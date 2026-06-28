# GEO Audit Agent

> AI-powered GEO (Generative Engine Optimization) audit platform with chat + dashboard experience.

## What this project does

GEO Audit Agent analyzes public websites for AI-search readiness and returns:

- GEO score and weighted breakdown
- AI crawler accessibility matrix
- llms.txt and schema markup checks
- technical + content + brand/citability insights
- prioritized action plan with quick wins

---

## Product view

```mermaid
flowchart LR
  U[User] --> FE[Next.js Frontend]
  FE --> CHAT[Copilot Chat]
  FE --> DASH[Audit Dashboard]
  CHAT --> API[/api/copilotkit proxy]
  API --> BE[FastAPI + LangGraph]
  BE --> TOOL[compile_geo_report]
  TOOL --> WEB[Target Website]
  BE --> FE
```

## Architecture snapshot

```mermaid
flowchart TB
  subgraph Frontend
    P[app/page.tsx]
    D[AuditDashboardContent]
    C[UI Panels]
  end

  subgraph Backend
    M[main.py]
    G[agent/graph.py]
    T[agent/tools/geo_tools.py]
    PR[agent/prompts.py]
  end

  P --> D --> C
  P --> M
  M --> G --> T
  G --> PR
```

## KPI clustering logic (dashboard)

```mermaid
flowchart LR
  R[GeoReport payload] --> K1[GEO Score]
  R --> K2[Citability]
  R --> K3[Technical]
  R --> K4[Content]
  K1 --> Panels[Detail Panels]
  K2 --> Panels
  K3 --> Panels
  K4 --> Panels
```

---

## Tech stack

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS, Framer Motion, Three.js
- **Backend:** FastAPI, LangGraph, LangChain
- **AI Integration:** CopilotKit runtime + co-agent shared state

---

## Local setup

### 1) Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python main.py
```

### 2) Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend: `http://localhost:3000`  
Backend health: `http://127.0.0.1:8000/health`

---

## Environment variables

### Frontend (`frontend/.env.local`)

- `BACKEND_URL`
- `BACKEND_AGUI_URL`
- `NEXT_PUBLIC_GITHUB_URL`
- `NEXT_PUBLIC_LINKEDIN_URL`
- `NEXT_PUBLIC_DISCORD_URL`
- `NEXT_PUBLIC_FEEDBACK_FORM_URL`

### Backend (`backend/.env`)

- `LLM_PROVIDER`
- `OPENROUTER_API_KEY` (or provider-specific key)
- provider-specific model/base URL values

> Never commit real keys. Use `.env` locally and platform secret storage in production.

---

## Documentation

- `frontend/README.md` – frontend-focused developer guide
- `docs/technical-architecture-en.md` – implementation architecture
- `docs/solution-architecture-en.md` – solution-level architecture
- `docs/agent-architecture.md` – current agent architecture (added)
- `docs/prompts-guide.md` – prompt catalog and behavior (added)

---

## Security note

Repository scan checks are part of maintenance workflow:

- no tracked `.env` files with live secrets
- key pattern scans on source/docs
- explicit placeholders only in examples/docs

