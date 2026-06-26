# GEO Audit Agent: Objective Solution Improvement Roadmap

## 1. Purpose

This document defines an objective improvement backlog for GEO Audit Agent from two complementary perspectives:

- functional evolution,
- technical evolution.

The purpose is not to describe generic ideas, but to identify the most concrete improvements that would increase the product value, robustness, maintainability, and production readiness of the current solution.

## 2. Improvement Principles

The roadmap is based on the current application characteristics:

- the app already delivers value as a single-URL GEO audit tool,
- the backend audit engine is deterministic and domain-specific,
- the UI already supports a useful chat-plus-dashboard workflow,
- the solution remains experimental and not yet productized for broader operational use.

For that reason, the most objective improvements are those that strengthen one or more of the following:

- end-user usefulness,
- audit depth and credibility,
- empirical GEO evidence from real answer-engine prompts,
- operational reliability,
- security posture,
- extensibility toward a product platform.

## 3. Current Baseline

Today the solution already provides:

- single-URL GEO audits,
- structured scoring and recommendations,
- shared report state between chat and dashboard,
- exportable markdown and PDF output,
- multilingual user-facing experience,
- multi-provider LLM support,
- basic security hardening for URL handling, chat guardrails, and export limits.
- accessibility hardening for core dashboard, chat, form, modal, and status surfaces with WCAG 2.2 AA as the target.

The main gaps are therefore not in basic functionality, but in product depth, governance, persistence, identity, and production-grade operational controls.

The current public single-audit experience can remain anonymous, but the platform-level capabilities described below require authenticated user and workspace boundaries.

A key GEO differentiator is still missing from the current product baseline: physically running controlled prompts on answer engines such as ChatGPT, Claude, Perplexity, Gemini, and Google AI experiences, then collecting and comparing the actual responses, citations, brand mentions, and source links. This empirical answer-surface evidence is what separates a GEO platform from a traditional technical SEO checker.

## 4. Functional Improvement Backlog

### 4.1 Priority F1: Audit History and Report Persistence

**Objective value**

The current app behaves like a live diagnostic tool, but it does not preserve audit history. Persisting reports would transform it into a reusable working environment instead of a one-shot analyzer.

**Why this is objectively useful**

- users can compare audits over time,
- agencies can keep client deliverables,
- product and SEO teams can track improvement progress,
- the app gains operational memory beyond the current session.

**Functional scope**

- save completed audits,
- list previous audits,
- reopen a report without rerunning the crawl,
- filter by domain or date.
- support a progressive authenticated flow where anonymous users can run a demo audit but must sign in to save, reopen, compare, or monitor reports.

**Login dependency**

Required for saved history. Each saved audit should belong to a user and, eventually, to a workspace.

**Suggested priority**

High.

### 4.2 Priority F2: Authenticated Workspaces and Saved Report Area

**Objective value**

Authentication should not be treated as a generic technical checkbox. It becomes valuable when it unlocks a private working area for saved reports, client domains, team access, and future monitoring.

**Why this is objectively useful**

- protects private audit results and exported reports,
- lets users return to previous work,
- creates a foundation for team or client collaboration,
- enables future limits, quotas, billing, and notification preferences,
- separates the public demo experience from the product workspace.

**Functional scope**

- public landing/demo audit remains available without login,
- sign in is required for saving reports, viewing history, comparing audits, scheduled monitoring, and alerting,
- personal workspace is created by default after first sign-in,
- authenticated dashboard shows recent audits, saved reports, and workspace context,
- logout and account/profile entry points are visible in the UI,
- workspace roles can start simple, then evolve into owner, admin, member, and viewer.

**Suggested priority**

Highest, as part of the first productization increment.

### 4.3 Priority F3: Multi-Page or Site-Section Audits

**Objective value**

Single-page analysis is a good starting point, but strategic GEO readiness often depends on patterns across templates, content clusters, and site sections.

**Why this is objectively useful**

- homepage-only analysis can miss structural weaknesses,
- teams need broader visibility across a website,
- readiness often differs between marketing pages, documentation, blog content, and help sections.

**Functional scope**

- audit a set of discovered URLs,
- support section-level audits,
- aggregate per-page findings into a domain summary,
- flag template-level recurring issues.

**Suggested priority**

High.

### 4.4 Priority F4: Explainability Layer for Scores and Recommendations

**Objective value**

The app already produces scores and recommendations, but users would benefit from stronger traceability between evidence and final scoring.

**Why this is objectively useful**

- improves trust in the audit,
- reduces perceived black-box behavior,
- helps teams translate findings into implementation work,
- supports consulting and stakeholder communication.

**Functional scope**

- evidence panels per score category,
- explicit rule-to-score mapping,
- recommendation rationale,
- before/after expected benefit explanation.

**Suggested priority**

High.

### 4.5 Priority F5: Benchmarking and Competitive Comparison

**Objective value**

An isolated GEO score is useful, but comparison makes it far more actionable.

**Why this is objectively useful**

- users need context for interpreting scores,
- agencies often work competitively,
- benchmarking helps prioritize what matters most.

**Functional scope**

- compare two or more domains,
- identify strongest and weakest categories by competitor,
- show relative readiness per AI platform,
- export comparative summaries.

**Suggested priority**

Medium to high.

### 4.6 Priority F6: AI Platform Response Validation with Persona-Based Prompt Testing

**Objective value**

The current solution evaluates readiness through deterministic site analysis, but it does not yet measure what AI platforms actually answer in real user-like conditions. Adding direct answer-surface validation would connect theoretical readiness with observed platform behavior and become one of the product's main GEO differentiators.

**Why this is objectively useful**

- validates whether GEO improvements change actual AI answers,
- reveals gaps between site quality and platform-level visibility,
- supports real-world testing on platforms such as ChatGPT, Perplexity, and Claude,
- makes the solution more credible for agencies and teams that need empirical evidence, not only score-based diagnostics.

**Functional scope**

- define persona libraries such as prospect, researcher, buyer, journalist, and support seeker,
- define prompt libraries by intent, including discovery, comparison, recommendation, problem-solution, local search, product research, and expert-source prompts,
- physically execute prompt sets per persona across target AI platforms such as ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews or AI Mode where available, and future answer engines,
- capture full answer text, citation presence, cited domains, source links, brand mention frequency, sentiment, ranking or ordering, and visibility patterns,
- preserve evidence snapshots so a report can show what was actually observed, when, on which platform, and with which prompt,
- compare platform outputs against the deterministic GEO audit,
- surface insights such as where the site is technically ready but not yet visible in answer engines,
- generate platform-specific remediation guidance such as what content, schema, citations, third-party mentions, or source pages are needed to improve answer-engine visibility.

**Important operating constraints**

- respect each platform's terms, rate limits, authentication requirements, and allowed automation methods,
- separate direct API-based execution from browser-assisted evidence collection when APIs are unavailable or insufficient,
- mark results as observed samples rather than absolute rankings because answer engines can personalize, localize, and vary responses over time,
- store raw observations separately from derived metrics so future scoring logic can be audited and improved.

**Suggested priority**

Highest for product differentiation, after the first authenticated persistence foundation is in place.

### 4.7 Priority F7: Scheduled Monitoring and Alerting

**Objective value**

GEO readiness is not static. Scheduled monitoring would shift the app from diagnostic mode to continuous oversight.

**Why this is objectively useful**

- catches regressions after releases,
- supports operational workflows,
- creates repeatable monitoring value.

**Functional scope**

- recurring audit schedules,
- change detection between runs,
- alerts on critical regressions,
- trend summaries.
- per-user or per-workspace notification preferences.

**Login dependency**

Required. Schedules, alert destinations, and monitored domains must have an owner.

**Suggested priority**

Medium.

### 4.8 Priority F8: Stronger Reporting and Business-Oriented PDF Delivery

**Objective value**

The existing export capability is useful, but the reporting layer can become more presentation-ready for consulting, internal governance, and decision-making.

**Why this is objectively useful**

- improves stakeholder readability,
- reduces manual post-processing,
- increases adoption in agency and enterprise workflows,
- creates a business-facing deliverable that can be shared directly with decision-makers.

**Functional scope**

- branded templates,
- downloadable business-oriented PDF reports,
- executive summary mode,
- business KPIs, priorities, and investment-oriented framing for non-technical stakeholders,
- implementation checklist mode,
- export sections tailored by audience.

**Suggested priority**

Medium.

### 4.9 Priority F9: Guided Remediation Workflows

**Objective value**

The current app identifies problems well; the next step is helping users implement fixes more directly.

**Why this is objectively useful**

- shortens time from finding to action,
- improves product stickiness,
- supports semi-assisted implementation planning.

**Functional scope**

- schema templates by business type,
- suggested `llms.txt` variants,
- implementation checklists by CMS or stack,
- category-based remediation playbooks.

**Suggested priority**

Medium.

## 5. Technical Improvement Backlog

### 5.1 Priority T1: Persistent Data Layer

**Objective value**

Many functional improvements depend on persistence. Without a durable storage layer, the app cannot evolve beyond transient sessions.

**Why this is objectively useful**

- enables audit history,
- enables comparisons and trends,
- reduces recomputation,
- supports productization.

**Technical scope**

- choose a persistence model for reports and metadata,
- version the report schema,
- store audit runs, timestamps, and derived summaries,
- add retrieval APIs or route handlers.

**Suggested priority**

Highest.

### 5.2 Priority T2: Stronger Crawl and Fetch Governance

**Objective value**

The recent SSRF-oriented hardening is important, but broader fetch governance is still needed for a robust crawler-like system.

**Why this is objectively useful**

- improves safety,
- reduces unpredictable runtime behavior,
- prepares the app for broader crawl scope.

**Technical scope**

- centralized fetch policies,
- per-domain rate controls,
- retry and backoff strategy,
- clearer timeout and partial-failure handling,
- optional content-size caps and MIME checks.

**Suggested priority**

High.

### 5.3 Priority T3: Authentication, Authorization, and Multi-Tenant Boundaries

**Objective value**

The app is currently suitable for local or internal prototype use. Product readiness requires identity and access boundaries.

**Why this is objectively useful**

- protects audit history and exports,
- enables shared usage,
- supports enterprise adoption.
- enables quotas, rate limits, monitoring ownership, and future commercial plans.

**Technical scope**

- user identity,
- protected report access,
- workspace or tenant boundaries,
- role-aware export and history access.
- authenticated API route protection for report history, saved reports, schedules, workspace settings, and private exports,
- backend-side trust boundaries so the FastAPI service does not blindly trust user identifiers supplied by the browser,
- session or token forwarding strategy between Next.js and FastAPI,
- account lifecycle controls such as logout, deleted users, and workspace ownership transfer.

**Recommended authentication approach**

The most pragmatic implementation options are:

- Auth.js with a relational database for maximum control and open-source flexibility,
- Clerk for the fastest path to hosted authentication, user management, and organizations,
- Supabase Auth if the project also adopts Supabase Postgres as the managed data layer.

For this product, the recommended default is either Auth.js plus Postgres for a custom product architecture, or Clerk plus Postgres if speed of implementation and team/workspace management are more important than minimizing SaaS dependencies.

**Minimum data model**

The first authenticated implementation should support at least:

```text
User
- id
- email
- name
- created_at

Workspace
- id
- name
- owner_user_id
- created_at

WorkspaceMember
- workspace_id
- user_id
- role

AuditRun
- id
- workspace_id
- user_id
- url
- domain
- status
- geo_score
- business_type
- report_schema_version
- created_at
- completed_at

AuditReport
- id
- audit_run_id
- report_json
- created_at
```

Future tables can then extend this base with `ScheduledMonitor`, `CompetitorDomain`, `PromptTestRun`, `NotificationTarget`, and `ReportExport`.

**Protected surfaces**

At minimum, authentication and authorization should protect:

- audit history and saved reports,
- report reopening and private report export,
- scheduled monitoring and alert destinations,
- workspace settings and membership,
- Copilot/chat access to private report context,
- audit execution itself if the product needs quota control or abuse prevention.

The public one-shot audit route can remain available for demo usage, but saving or reusing the result should require sign-in.

**Suggested priority**

Highest, because it is a prerequisite for credible persistence, workspaces, monitoring, and team usage.

### 5.4 Priority T4: Observability, Web Analytics, and Audit Telemetry

**Objective value**

The current app is debuggable during development, but production operations require visibility into behavior, failure modes, and latency distribution.

**Why this is objectively useful**

- shortens incident diagnosis,
- improves reliability work,
- supports capacity planning,
- helps validate provider behavior,
- makes it possible to understand traffic, user behavior, and feature adoption on the website.

**Technical scope**

- structured logs,
- trace identifiers across frontend and backend,
- runtime metrics,
- website traffic analytics integration such as Google Analytics or an equivalent privacy-conscious analytics platform,
- pageview, acquisition, and engagement tracking for the main product surfaces,
- event tracking for key actions such as audit starts, exports, feedback clicks, and report downloads,
- tool execution telemetry,
- export and provider failure monitoring.

**Suggested priority**

High.

### 5.5 Priority T5: Automated AI Platform Test Harness

**Objective value**

If the product is going to validate real answer-engine behavior, it needs a controlled execution framework for repeatable platform tests. Without this, persona-based prompt testing remains manual, inconsistent, and difficult to trust.

**Why this is objectively useful**

- enables empirical validation at scale,
- makes answer-surface testing reproducible,
- separates test design from ad hoc human browsing,
- creates a foundation for platform-specific reporting and trend analysis.

**Technical scope**

- define a test-runner model for persona, prompt-set, platform, run date, and captured outputs,
- support prompt templates with variables such as brand, domain, market, location, product category, competitor set, and persona,
- integrate direct platform APIs when available and compliant,
- integrate browser-assisted or human-in-the-loop capture workflows only where allowed and operationally safe,
- normalize captured answers, citations, source links, ranking/order, answer confidence signals, brand mentions, and sentiment into a comparable schema,
- store test artifacts and evidence snapshots,
- manage rate limits, login/session boundaries, and platform-specific execution rules,
- link every observation back to its saved audit, workspace, prompt set, platform, timestamp, and evidence artifact,
- calculate derived metrics such as brand mentioned, brand cited, citation share, source overlap, competitor visibility, answer sentiment, and platform readiness delta.

**Recommended observation model**

```text
PromptSet
- id
- workspace_id
- name
- market
- language
- created_at

PromptCase
- id
- prompt_set_id
- persona
- intent
- prompt_text
- variables_json

PlatformRun
- id
- workspace_id
- audit_run_id
- platform
- execution_method
- status
- started_at
- completed_at

PromptObservation
- id
- platform_run_id
- prompt_case_id
- answer_text
- cited_domains_json
- source_links_json
- brand_mentioned
- brand_cited
- sentiment
- rank_position
- evidence_artifact_uri
- observed_at
```

This model should remain separate from deterministic audit findings. Deterministic readiness explains whether the site is prepared; prompt observations show whether answer engines actually surface the brand or domain.

**Suggested priority**

Highest for GEO differentiation, but dependent on authentication, persistence, and clear platform execution policies.

### 5.6 Priority T6: Formal Validation and Contract Hardening

**Objective value**

The application already benefits from typed frontend structures and a normalized backend report, but the cross-layer contract could be made much stricter.

**Why this is objectively useful**

- reduces integration drift,
- prevents fragile UI failures,
- improves maintainability as the report grows.

**Technical scope**

- schema validation for report payloads,
- explicit versioning of report contracts,
- stronger runtime validation at API boundaries,
- test fixtures for representative report shapes.

**Suggested priority**

High.

### 5.7 Priority T7: Test Coverage Expansion

**Objective value**

The solution now contains increasingly important business rules and guardrails. Those deserve repeatable automated verification.

**Why this is objectively useful**

- protects the current stabilized behavior,
- reduces regression risk,
- makes future refactoring safer.

**Technical scope**

- unit tests for deterministic GEO computations,
- tests for URL safety and chat guardrails,
- contract tests for shared state mapping,
- route tests for report export,
- UI smoke tests for audit and refusal flows.

**Suggested priority**

High.

### 5.8 Priority T8: Better Provider Abstraction and Resilience

**Objective value**

The app already supports multiple model providers, but provider differences still leak into runtime behavior.

**Why this is objectively useful**

- improves portability,
- reduces support effort,
- stabilizes tool-call behavior.

**Technical scope**

- provider capability flags,
- richer fallback strategies,
- standardized error taxonomy,
- configurable resilience policies per provider.

**Suggested priority**

Medium to high.

### 5.9 Priority T9: Production Delivery Hardening

**Objective value**

The app now works well locally, but broader deployment requires more explicit production controls.

**Why this is objectively useful**

- reduces deployment risk,
- improves repeatability,
- supports handoff to operational environments.

**Technical scope**

- deployment configuration strategy,
- secret handling outside local files,
- environment-specific CORS and proxy configuration,
- rate limiting,
- secure headers and operational defaults.

**Suggested priority**

Medium to high.

### 5.10 Priority T10: Accessibility Regression Automation

**Objective value**

The application now has an explicit WCAG 2.2 AA target. Automated accessibility checks would make that target durable as the UI evolves.

**Why this is objectively useful**

- prevents regressions in labels, landmarks, focus behavior, and contrast,
- makes accessibility part of the release process,
- reduces manual QA effort after UI changes,
- supports professional product readiness.

**Technical scope**

- add Playwright plus axe-core accessibility smoke tests,
- test empty, loading, completed, and error dashboard states,
- test methodology dialog keyboard behavior,
- fail CI on serious or critical accessibility violations,
- document accepted third-party UI exceptions when necessary.

**Suggested priority**

Medium to high.

## 6. Recommended Delivery Sequence

The most coherent implementation sequence is:

1. authenticated audit history: login, personal workspace, saved audit runs, saved reports, and report reopening,
2. persistent data layer and report schema versioning,
3. formal validation and contract hardening,
4. test coverage expansion,
5. observability, web analytics, audit telemetry, and quota-ready usage tracking,
6. AI answer-surface test harness: prompt sets, persona libraries, platform run model, and evidence storage,
7. AI platform response validation with persona-based prompt testing,
8. explainability layer for deterministic scores and empirical prompt observations,
9. benchmarking and trend comparison across saved audits and observed platform responses,
10. multi-page and site-section audits,
11. scheduled monitoring and alerting,
12. guided remediation and business-oriented reporting.

This order is intentionally pragmatic. It does not add authentication as an isolated technical task; it introduces authentication through the first product feature that needs it: saved audit history. The public single-audit path can remain available as a low-friction demo, while persistence, history, comparison, monitoring, private exports, and answer-surface evidence collection become authenticated capabilities.

## 7. Recommended First Product Increment

The strongest next implementation target is **Authenticated Audit History**.

**MVP scope**

- add sign-in and logout,
- create a personal workspace after first sign-in,
- save every completed audit as an `AuditRun`,
- persist the full report as an `AuditReport`,
- show a recent audits panel in the authenticated dashboard,
- reopen a saved report without rerunning the audit,
- keep the anonymous public audit available, but require login to save or reopen reports.

**Why this should come first**

- it gives authentication an immediate user-facing purpose,
- it unlocks trend comparison and monitoring later,
- it reduces recomputation,
- it establishes ownership and access control before private data accumulates,
- it creates the core product loop: run audit, save report, return later, improve, compare.

## 8. Summary

The current solution is already meaningful as an experimental GEO audit application. Its most objective next improvements are not cosmetic. They fall into two clear groups:

- functional improvements that increase product usefulness and decision-making value,
- technical improvements that make the solution safer, more durable, and more extensible.

If the goal is to evolve the app into a credible product rather than a working prototype, the strongest next investments are:

- authenticated audit history,
- login and workspace boundaries,
- persistence,
- report schema versioning,
- an automated AI answer-surface testing capability,
- physical prompt execution and evidence capture across ChatGPT, Claude, Perplexity, Gemini, Google AI experiences, and future answer engines,
- testing,
- validation,
- observability and website analytics,
- broader audit scope,
- clearer explainability of findings,
- empirical comparison between deterministic GEO readiness and actual AI platform responses.