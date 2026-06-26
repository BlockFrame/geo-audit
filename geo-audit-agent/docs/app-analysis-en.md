# GEO Audit Agent: Functional and Technical Analysis

## 1. Overview

GEO Audit Agent is a full-stack application designed to evaluate how well a website is prepared for AI-assisted discovery and answer engines. In this project, GEO stands for Generative Engine Optimization: a practical discipline focused on improving how a brand or website can be crawled, interpreted, cited, and surfaced by systems such as ChatGPT Search, Perplexity, Google AI Overviews, Gemini, and similar AI retrieval experiences.

The application combines:

- a conversational interface for audit execution,
- a synchronized dashboard for structured findings,
- a backend agent built on LangGraph,
- a deterministic website audit pipeline wrapped inside a single report-building tool,
- export functions for markdown and PDF reports.

From a product perspective, the app is both a diagnostic interface and a reporting engine. From an engineering perspective, it is a hybrid between an agentic application and a classical structured audit system: the language model decides when to trigger the audit, while the actual inspection logic is implemented in deterministic Python tools.

## 2. Primary Product Goal

The app solves a specific problem: most websites are still optimized mainly for conventional search engine ranking, while modern AI systems increasingly depend on structured signals, retrievable content, machine-readable entity context, social preview completeness, and explicit accessibility rules for AI crawlers.

The application therefore aims to answer these questions for a given URL:

- Can AI-oriented crawlers access the site?
- Does the site expose a valid or useful `llms.txt`?
- Is structured data present and meaningful?
- Are metadata and previews suitable for AI and social summarization?
- Is the content sufficiently citable?
- Does the brand show entity and authority signals across trusted platforms?
- How ready is the site for downstream AI answer ecosystems?

The output is intentionally practical rather than abstract: the app generates a weighted GEO score, a breakdown by category, and a prioritized action plan.

## 3. High-Level Architecture

The application is divided into two major runtime surfaces.

### 3.1 Frontend

The frontend is a Next.js 15 application with CopilotKit React integration. It contains:

- the main dashboard,
- the chat interface,
- the CopilotKit API proxy route,
- report export routes,
- presentation components for audit findings.

The frontend is responsible for:

- starting the conversational audit flow,
- rendering shared agent state,
- displaying generated UI actions,
- exposing report downloads,
- handling responsive layout and browser-facing branding.

### 3.2 Backend

The backend is a FastAPI application exposing two related but distinct integration surfaces:

- a CopilotKit endpoint at `/copilotkit`,
- an AGUI/LangGraph endpoint at `/agui/default`.

It hosts the LangGraph workflow, model provider selection, system prompt generation, audit tool registration, and final state normalization.

## 4. Backend Execution Model

The backend is intentionally structured around one primary execution graph rather than a collection of unrelated endpoints.

### 4.1 Agent Graph

The LangGraph workflow has three nodes:

- `agent`
- `tools`
- `update_state`

The execution path is:

- `START -> agent`
- `agent -> tools` when a tool call exists
- `tools -> update_state` when `compile_geo_report` completes
- `tools -> agent` for other tool continuations
- `agent -> update_state` when no further tool work is needed
- `update_state -> END`

This graph is compiled with `MemorySaver`, so it can preserve thread-level state across the conversational session.

### 4.2 Practical Agent Policy

The system prompt instructs the model to call only `compile_geo_report(url)` exactly once when a URL is available. This is a deliberate simplification. Although many lower-level tools exist, the application currently prefers a single deterministic audit call instead of a multi-step ReAct traversal.

That choice has three practical benefits:

- it reduces orchestration variability,
- it makes the audit result predictable and easier to map into frontend state,
- it avoids fragmented tool call sequences in the chat layer.

In effect, the LLM behaves more like a router into the report generator than like a free-form chain-of-thought tool planner.

### 4.3 Language Detection

The graph inspects recent human messages to infer whether the current conversation is Italian or English. This affects:

- system prompt language,
- fallback error messages,
- final assistant summary after the report is computed.

This is intentionally heuristic-based rather than locale-config based. The app therefore adapts to the user’s latest prompt language, even if the browser locale differs.

### 4.4 Tool-Call Normalization Fallback

A notable robustness layer exists in the graph: `_normalize_textual_tool_calls`.

This was introduced to handle providers or model routes that emit tool calls as plain text instead of structured `tool_calls`. In those cases, the backend attempts to parse the textual payload and reconstruct a synthetic tool call. If parsing fails but a `compile_geo_report` call is clearly visible with a URL, it still synthesizes the tool invocation.

This is an important architectural safeguard because it decouples the user experience from the exact reliability of vendor-specific tool-call formatting. It is especially relevant when free or router-based models are used.

### 4.5 Direct Post-Tool Completion

After `compile_geo_report` returns, the graph routes directly to `update_state` instead of performing another model roundtrip. This is a strong design choice.

Why it matters:

- it reduces latency,
- it prevents the app from getting stuck waiting for a second LLM response,
- it guarantees dashboard population once the deterministic report exists,
- it ensures the assistant can always emit a final concise summary even if the provider is unstable.

The summary is generated server-side from the report payload, not by asking the model again.

## 5. Backend API Layer

The FastAPI application creates a `CopilotKitSDK` instance and registers one agent named `default`.

There is also a compatibility wrapper class, `FixedLangGraphAGUIAgent`, which bridges a mismatch between the CopilotKit SDK and the LangGraph AGUI agent implementation. Specifically, the SDK expects an `execute()` method while the underlying AGUI agent only exposes `run()`. The wrapper delegates `execute()` and `get_state()` to a CopilotKit-compatible LangGraph agent.

This is a compatibility shim, but it is critical: without it, the integration would be brittle or broken across SDK expectations.

The backend also exposes `/health`, returning a simple liveness payload used for environment verification.

## 6. Audit Tooling and Deterministic GEO Logic

The core audit intelligence lives in Python tools under the backend tool module. Even though several functions are individually available, the application’s main operational path centers on `compile_geo_report(url)`.

### 6.1 What `compile_geo_report` Aggregates

The report generator executes multiple lower-level analyses:

- business type detection,
- robots.txt / crawler policy analysis,
- `llms.txt` detection,
- `llms.txt` recommendation generation,
- schema markup inspection,
- metadata inspection,
- technical SEO audit,
- content quality and E-E-A-T analysis,
- brand mention and authority signal analysis,
- citability scoring,
- platform readiness scoring.

This means the application is not merely exposing raw page information. It is composing several inspection dimensions into a single domain-specific report schema.

### 6.2 GEO Scoring Model

The final score is weighted across six categories:

- AI Citability & Visibility: 25%
- Brand Authority Signals: 20%
- Content Quality & E-E-A-T: 20%
- Technical Foundations: 15%
- Structured Data: 10%
- Platform Optimization: 10%

This scoring model is opinionated and product-oriented. It is not trying to be a universal SEO benchmark. Instead, it encodes a specific thesis: AI retrievability is a combination of access, machine-readable semantics, entity trust, and answer-friendly content structure.

### 6.3 Recommendation Generation

The report generator also creates a structured action plan with:

- priority,
- action,
- impact estimate,
- effort estimate.

That output is central to the app’s value. The app is not only descriptive; it is prescriptive.

### 6.4 Current Domain-Specific Strengths

The audit is particularly strong in the following areas:

- explicit AI crawler visibility,
- `llms.txt` presence and fallback generation,
- schema.org coverage,
- metadata and preview completeness,
- citability heuristics based on structure and factual density,
- brand/entity presence checks,
- AI platform-specific readiness scoring.

## 7. Frontend Interaction Model

The frontend is designed around a dual-surface experience:

- conversational interaction in the right panel,
- structured dashboard rendering in the main panel.

These two surfaces are connected through shared agent state rather than duplicated API calls.

### 7.1 Shared State via `useCoAgent`

The main page uses `useCoAgent<GeoAuditState>` with the `default` agent. This creates a synchronized state object that can be updated by the backend agent and consumed by the dashboard.

Important state fields include:

- `status`
- `url`
- `geo_score`
- `score_breakdown`
- `crawler_matrix`
- `llms_txt_status`
- `schema_found`
- `schema_types`
- `recommendations`
- `report`

The dashboard does not independently fetch results. It simply reacts to this synchronized state.

### 7.2 Copilot Readable Context

The `useGeoAuditCopilot` hook publishes two readable contexts to CopilotKit:

- the raw app state,
- a summarized report context describing the report contents.

This improves contextual awareness for follow-up prompts, such as prioritizing actions or asking about one specific platform gap.

### 7.3 Frontend Action Surfaces

The hook also registers generative UI actions for inline rendering:

- `display_geo_score`
- `display_crawler_matrix`
- `display_action_plan`
- `display_llms_txt`
- `display_schema_report`

These actions allow the assistant to render specialized UI blocks directly in chat. However, because the dashboard also reads the shared report state, the app remains functional even if inline rendering is not the only presentation path.

This duality is a good engineering pattern: chat UI can enrich the experience, but the business value is not dependent on chat rendering alone.

### 7.4 Follow-Up Analytical Actions

The frontend exposes additional logic-bound actions that operate on the already computed report:

- `prioritize_recommendations`
- `analyze_platform_gap`
- `get_schema_template`

These are not crawl operations. They are post-audit analytical affordances built on existing state. This makes the experience feel agentic while keeping actual website inspection deterministic.

## 8. Dashboard Composition

The dashboard is modular and panel-driven. Based on available state, it conditionally renders:

- `VerboseReportPanel`
- `CrawlerMatrix`
- `ActionPlanCards`
- `TechnicalChecksPanel`
- `CitabilityPanel`
- `BrandPresencePanel`
- `SchemaReport`
- `LlmsTxtPreview`

This means the report payload is broad enough to power several specialized visualizations. The dashboard is not a monolithic report blob; it is an orchestration layer over typed subpanels.

The app also includes:

- `ScoreGauge` for top-level scoring,
- `MethodologyModal` for KPI explanation,
- `ReportDownloads` for export behavior,
- `VerboseReportPanel` for comprehensive detail review.

## 9. CopilotKit Proxy Architecture in the Frontend

The Next.js route under `/api/copilotkit/[[...path]]` is a key integration layer.

Its responsibilities are:

- forwarding runtime info requests,
- proxying standard CopilotKit requests,
- forwarding `agent/run` envelopes to the AGUI backend endpoint,
- short-circuiting `agent/connect` to `204` for the handshake path,
- normalizing backend URLs to avoid redirect issues.

This route is operationally important because it isolates the browser from backend protocol details and prevents CORS and envelope-mismatch problems from leaking into the client code.

The current implementation also reflects prior hardening work:

- trailing slash normalization on the backend URL,
- explicit routing of `agent/run` body payloads,
- `agent/connect` returning `204` instead of incorrectly forwarding to the AGUI endpoint.

## 10. Export and Reporting Layer

The application supports exporting the computed report as:

- Markdown
- PDF

The export API takes a `GeoReport` payload and generates:

- a verbose markdown report,
- a PDF built from that markdown using `pdf-lib`.

### 10.1 Markdown Export Structure

The export layer produces a comprehensive document with:

- executive summary,
- score breakdown table,
- prioritized action plan,
- crawler access matrix,
- `llms.txt` recommendation block,
- schema findings,
- meta issues,
- technical checks,
- content quality and E-E-A-T summary,
- brand authority signals,
- platform readiness,
- raw JSON appendix.

This export strategy is well aligned with the product. It makes the application suitable not only for interactive analysis but also for consulting-style deliverables.

### 10.2 File Naming

Export filenames are derived from:

- the report URL host,
- the audit date.

This creates stable, human-readable report artifacts.

## 11. Configuration and Environment Model

The project is configurable on both backend and frontend.

### 11.1 Backend Configuration

The backend chooses the LLM provider through `LLM_PROVIDER` and supports:

- OpenAI
- OpenRouter
- Azure OpenAI / Azure AI Foundry compatible endpoints
- Vertex AI

Timeouts and retry counts are environment-controlled.

This gives the application deployment flexibility, but it also introduces runtime variability across providers. The textual tool-call normalization fallback exists largely because of that variability.

### 11.2 Frontend Configuration

The frontend uses environment variables for:

- backend route targets,
- AGUI route target,
- public LinkedIn link,
- public feedback form URL.

This allows small product adjustments without editing the React code directly.

## 12. UX and Presentation Characteristics

The application is not a generic admin panel. Its UI is explicitly designed as an experimental, dark-themed, glassmorphism-inspired analysis interface.

Recent implementation details show that the frontend was also adjusted for:

- mobile responsiveness,
- wrapped header controls,
- stacked mobile layout for dashboard and chat,
- browser tab branding through SVG and ICO icons.

These refinements matter because the product is not only computational; it is intended to be presented and used interactively.

## 13. Error Handling and Operational Resilience

The application includes several resilience patterns.

### 13.1 LLM Timeout Fallback

If the provider fails or times out, the graph returns a user-facing fallback AI message instead of crashing the stream.

### 13.2 Tool-Call Recovery

If the model emits malformed or text-only tool invocations, the backend reconstructs the intended `compile_geo_report` call when possible.

### 13.3 Infinite-Loop Guard

The graph uses `MAX_GRAPH_MESSAGES` as a safety guard against runaway tool loops.

### 13.4 Protocol Hardening in the Proxy

The frontend API route explicitly handles `info`, `run`, and `connect` paths to avoid protocol mismatches between CopilotKit single-route requests and backend expectations.

## 14. Extension Points

The current architecture is a solid base for future enhancements.

Likely extension directions include:

- adding new GEO tools without changing the dashboard contract,
- expanding post-audit analytical actions,
- storing audit histories or user sessions persistently,
- adding authentication and multi-user report workspaces,
- introducing batch audits or domain-wide crawling,
- exposing trend analysis across multiple reports,
- enriching export templates with branding and executive-friendly formatting.

From an engineering standpoint, the strongest extension seam is the report schema. As long as `compile_geo_report` returns a coherent payload and `GeoAuditState` remains aligned, the rest of the system can evolve with manageable effort.

## 15. Current Limitations

The app is strong, but its current implementation also makes some tradeoffs that should be documented.

### 15.1 Single URL Entry Point

The audit is page- and domain-centric, not a full site crawler. It evaluates a target URL plus related root-level resources such as `robots.txt` and `llms.txt`.

### 15.2 Heuristic Scoring

Citability, authority, and platform readiness are heuristically derived. They are useful operational indicators, but they are not canonical vendor metrics.

### 15.3 Model Dependency for Triggering

Even though the audit body is deterministic, the initiation still depends on the LLM correctly routing to `compile_geo_report`. The fallback normalization reduces risk, but the app is not completely model-free.

### 15.4 No Persistent Data Layer

There is no database-backed audit history in the current implementation. Sessions are conversational and export-based rather than archival.

## 16. Recommended Mental Model for Maintainers

The cleanest way to understand this app is as three stacked layers.

### Layer 1: Deterministic GEO Engine

This is the Python audit logic that inspects websites and builds a structured report.

### Layer 2: Agent Routing and State Normalization

This is the LangGraph workflow that translates user requests into report generation and transforms the report into shared application state.

### Layer 3: Dual-Surface UX

This is the React application that presents the result both as conversational output and as a structured dashboard.

That separation is one of the application’s biggest strengths. It makes the system easier to reason about, easier to debug, and easier to extend.

## 17. Conclusion

GEO Audit Agent is a well-scoped, domain-specific AI product rather than a generic chat wrapper. Its strongest qualities are:

- a clear GEO-focused problem definition,
- deterministic inspection logic behind the agent experience,
- a typed shared report model across backend and frontend,
- a productive dashboard-plus-chat interaction pattern,
- exportable deliverables suitable for operational use.

The app is already more than a prototype in structure. It contains real product decisions about scoring, reporting, language behavior, resilience, and presentation. With persistent history, improved branding, and additional site-wide or longitudinal features, it could evolve from an experimental audit tool into a robust consultant-grade GEO assessment platform.