# GEO-AUDIT-APP

GEO-AUDIT-APP is an experimental full-stack application for running GEO (Generative Engine Optimization) audits against public websites.

The user-facing product name can remain "GEO Audit Agent", while the project root and deployment documentation use `GEO-AUDIT-APP` as the repository/application name.

The solution combines:

- a conversational audit experience powered by CopilotKit,
- a FastAPI backend with LangGraph orchestration,
- deterministic GEO inspection logic implemented in Python,
- a synchronized dashboard backed by shared agent state,
- exportable Markdown and PDF reports.

The goal of the project is to evaluate how well a website is prepared for AI-assisted discovery and answer engines such as ChatGPT Search, Perplexity, Google AI Overviews, Gemini, and similar systems.

## Experimental Status

This project should currently be considered an experimental application.

That means:

- the product is suitable for local use, prototyping, demos, and technical evaluation,
- the audit model is intentionally pragmatic rather than academically standardized,
- production deployment would still require stronger operational hardening.

## Core Capabilities

- Conversational audit flow with shared state between chat and dashboard
- GEO score calculation with category breakdown
- AI crawler access analysis via `robots.txt`
- `llms.txt` detection and recommendation generation
- Schema markup, metadata, technical, content, authority, and citability analysis
- AI platform readiness evaluation
- Markdown and PDF report export
- Responsive UI, browser icon support, and configurable public links
- Basic server-side guardrails for out-of-scope or unsafe chat requests

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, CopilotKit React |
| Backend | FastAPI, CopilotKit SDK |
| Agent Orchestration | LangGraph, LangChain |
| LLM Providers | OpenAI, OpenRouter, Azure AI Foundry / Azure OpenAI-compatible, Vertex AI |
| Audit Engine | Python, `httpx`, `BeautifulSoup4` |
| Report Export | Markdown, `pdf-lib` |

## Architecture Summary

The solution is organized into two main runtime surfaces.

### Frontend

The frontend provides:

- the main dashboard,
- the CopilotKit chat interface,
- the CopilotKit proxy route,
- the report export route,
- presentation components for GEO findings.

The dashboard and chat share the same agent state, so the UI updates from one structured backend result instead of multiple disconnected fetches.

### Backend

The backend provides:

- a CopilotKit endpoint at `/copilotkit`,
- a LangGraph AGUI endpoint at `/agui/default`,
- deterministic GEO inspection tools,
- model-provider abstraction,
- state normalization into the frontend-facing report shape.

The LLM does not compute the audit directly. The model acts as a routing and conversational layer, while the actual inspection is performed by deterministic Python logic.

## Runtime Flow

At a high level, the application works like this:

1. The user submits a prompt with a target URL in the chat.
2. The frontend sends the request through `/api/copilotkit`.
3. The backend agent resolves the URL and triggers `compile_geo_report(url)`.
4. The report tool runs all lower-level GEO checks and produces a structured report payload.
5. The backend maps that payload into shared agent state.
6. The dashboard renders panels from the synchronized state.
7. The chat shows a concise assistant summary based on the same report.

## GEO Audit Coverage

The current report pipeline evaluates the following dimensions:

- homepage and content structure,
- AI crawler accessibility,
- `llms.txt` presence and suggested content,
- meta tags and social preview coverage,
- technical SEO checks,
- content quality and E-E-A-T heuristics,
- brand authority signals,
- citability scoring,
- AI platform readiness.

## GEO Score Model

The final GEO score is weighted across six categories:

| Category | Weight |
| --- | --- |
| AI Citability & Visibility | 25% |
| Brand Authority Signals | 20% |
| Content Quality & E-E-A-T | 20% |
| Technical Foundations | 15% |
| Structured Data | 10% |
| Platform Optimization | 10% |

## Project Structure

```text
geo-audit-app/
├── geo-audit-agent/
│   ├── backend/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── agent/
│   │       ├── graph.py
│   │       ├── model_provider.py
│   │       ├── prompts.py
│   │       ├── state.py
│   │       └── tools/
│   │           └── geo_tools.py
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── copilotkit/
│   │   │   │   └── report/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── public/
│   ├── docs/
│   │   ├── app-analysis-en.md
│   │   ├── solution-architecture-en.md
│   │   ├── technical-architecture-en.md
│   │   └── solution-improvement-roadmap-en.md
│   ├── render.yaml
│   └── README.md
└── README.md
```

## Setup

### 1. Backend Setup

```powershell
cd geo-audit-agent/backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env
```

Edit `geo-audit-agent/backend/.env` and select one provider.

Example with OpenAI:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=<your_key>
OPENAI_MODEL=gpt-4o
```

Start the backend:

```powershell
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```powershell
cd geo-audit-agent/frontend

npm install
copy .env.local.example .env.local
```

Recommended local values:

```env
BACKEND_URL=http://127.0.0.1:8000/copilotkit
BACKEND_AGUI_URL=http://127.0.0.1:8000/agui/default
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/rossi-stefano/
NEXT_PUBLIC_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSeOOb2vsD94lpUBTBlHX2S_wgFYOlMJ2jzXTtZ8WUzYhcuqMg/viewform?usp=dialog
```

Start the frontend:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Supported LLM Providers

### OpenAI

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=<your_key>
OPENAI_MODEL=gpt-4o
```

### OpenRouter

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=<your_key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free
OPENROUTER_REQUIRE_FREE=true
OPENROUTER_FREE_MODELS=meta-llama/llama-3.3-8b-instruct:free,google/gemma-2-9b-it:free,mistralai/mistral-7b-instruct:free
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_APP_TITLE=geo-audit-agent
```

### Azure AI Foundry / Azure OpenAI-compatible

```env
LLM_PROVIDER=azure_foundry
AZURE_OPENAI_API_KEY=<your_key>
AZURE_OPENAI_ENDPOINT=https://<resource-name>.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=<deployment_name>
AZURE_OPENAI_API_VERSION=2024-10-21
```

### Vertex AI

```env
LLM_PROVIDER=vertex
VERTEX_PROJECT_ID=<gcp_project_id>
VERTEX_LOCATION=us-central1
VERTEX_MODEL=gemini-1.5-flash-002
```

Vertex requires valid Google Cloud authentication in the environment.

## Deployment

The recommended first-phase deployment topology is:

- frontend on Vercel,
- backend on Render.

This split fits the current architecture well because the frontend is a Next.js application with route handlers, while the backend is a FastAPI + LangGraph service that should run as a dedicated Python web service.

### Deploying the Backend to Render

The repository includes a Render blueprint file at `geo-audit-agent/render.yaml`.

Render service characteristics:

- service type: Python web service,
- root directory: `backend/`,
- health endpoint: `/health`,
- start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

You can deploy it in two ways:

1. Create the service manually in Render and point it to the repository.
2. Use the `render.yaml` blueprint from the project folder.

Required backend environment variables on Render:

- `FRONTEND_ORIGINS=https://<your-vercel-domain>`
- optionally `FRONTEND_ORIGIN_REGEX=https://.*\.vercel\.app` if you want preview deployments to work
- one provider configuration set such as OpenAI, OpenRouter, Azure, or Vertex

Example using OpenAI on Render:

```env
FRONTEND_ORIGINS=https://your-app.vercel.app
FRONTEND_ORIGIN_REGEX=https://.*\.vercel\.app
LLM_PROVIDER=openai
OPENAI_API_KEY=<your_key>
OPENAI_MODEL=gpt-4o
```

Example using OpenRouter on Render:

```env
FRONTEND_ORIGINS=https://your-app.vercel.app
FRONTEND_ORIGIN_REGEX=https://.*\.vercel\.app
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=<your_key>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free
OPENROUTER_REQUIRE_FREE=true
OPENROUTER_HTTP_REFERER=https://your-app.vercel.app
OPENROUTER_APP_TITLE=GEO-AUDIT-APP
```

After deployment, note the Render backend base URL, for example:

```text
https://geo-audit-app-backend.onrender.com
```

### Deploying the Frontend to Vercel

Deploy the `geo-audit-agent/frontend/` directory as the Vercel project root.

Required frontend environment variables on Vercel:

```env
BACKEND_URL=https://<your-render-domain>/copilotkit
BACKEND_AGUI_URL=https://<your-render-domain>/agui/default
NEXT_PUBLIC_LINKEDIN_URL=https://www.linkedin.com/in/rossi-stefano/
NEXT_PUBLIC_FEEDBACK_FORM_URL=https://docs.google.com/forms/d/e/1FAIpQLSeOOb2vsD94lpUBTBlHX2S_wgFYOlMJ2jzXTtZ8WUzYhcuqMg/viewform?usp=dialog
```

Example:

```env
BACKEND_URL=https://geo-audit-app-backend.onrender.com/copilotkit
BACKEND_AGUI_URL=https://geo-audit-app-backend.onrender.com/agui/default
```

Vercel build settings:

- framework preset: Next.js,
- root directory: `frontend`,
- install command: `npm install`,
- build command: `npm run build`.

### Deployment Order

1. Deploy the backend to Render.
2. Copy the Render public URL.
3. Configure `BACKEND_URL` and `BACKEND_AGUI_URL` in Vercel.
4. Deploy the frontend to Vercel.
5. Update `FRONTEND_ORIGINS` on Render with the final Vercel production domain.
6. Optionally set `FRONTEND_ORIGIN_REGEX` to allow Vercel preview deployments.

### Free-Tier Notes

This stack is suitable for a first deployment on low-cost or free tiers, but there are practical limits:

- Vercel Hobby is generally fine for the frontend,
- Render free or low-tier instances may sleep or cold-start,
- LLM provider usage is the main non-free dependency,
- long-lived production usage will usually require moving beyond purely free tiers.

## How To Use

1. Open the web app.
2. Paste a full public website URL into the chat prompt.
3. Ask for an audit, for example: `Run a GEO audit for https://www.example.com`
4. Wait for the backend to compute the structured report.
5. Review the dashboard panels and the assistant summary.
6. Export the report if needed.

## Report Export and Analytics

The app supports exporting the current structured report as:

- Markdown
- PDF

Recent additions include:

- business-oriented report modes (verbose, executive, checklist),
- audience targeting (executive, marketing, technical),
- branded header metadata in generated PDF,
- Vercel Analytics and Speed Insights integration.

## Security and Operational Notes

The current implementation already includes some protective measures:

- `.gitignore` excludes local environment files and common development artifacts,
- backend URL validation only allows public `http(s)` targets for audits,
- server-side chat guardrails reject prompt-exfiltration, credentials, jailbreak, and exploit-style requests,
- export requests are bounded to reduce oversized payload abuse.

Before any public or client-facing deployment, you should still review:

- secret management and credential rotation,
- authentication and authorization,
- rate limiting,
- production CORS policy,
- observability and audit logging,
- output validation for critical business use.

## Documentation

Detailed project documentation is available under `geo-audit-agent/docs/`:

- `app-analysis-en.md`: functional and product-oriented analysis
- `solution-architecture-en.md`: system-level solution architecture
- `technical-architecture-en.md`: implementation-oriented technical architecture
- `solution-improvement-roadmap-en.md`: objective functional and technical improvement backlog
- `DEPLOYMENT_CHECKLIST.md`: deployment checklist for Render + Vercel
- `VERCEL_ANALYTICS_SETUP.md`: analytics events and setup notes

Recommended reading order:

1. `geo-audit-agent/docs/app-analysis-en.md`
2. `geo-audit-agent/docs/solution-architecture-en.md`
3. `geo-audit-agent/docs/technical-architecture-en.md`
4. `geo-audit-agent/docs/solution-improvement-roadmap-en.md`

## License and Usage Notes

This repository is currently positioned as an experimental application. Review architecture, security, and operational readiness before using it in production.
