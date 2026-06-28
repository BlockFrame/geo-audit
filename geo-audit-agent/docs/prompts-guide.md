# Prompts Guide

## Where prompts live

- **Primary backend prompt**: `backend/agent/prompts.py`
  - `GEO_AUDIT_SYSTEM_PROMPT_TEMPLATE`
  - language-specific builder: `build_geo_audit_system_prompt(language)`

- **Routing/intent behavior**: `backend/agent/graph.py`
  - audit intent patterns
  - URL extraction patterns
  - guardrail block patterns
  - follow-up behavior after first audit

## Prompt responsibilities

The system prompt enforces:

1. GEO-audit role and scope
2. Strict audit execution policy
3. Safety boundaries (no secrets, no exploit guidance)
4. URL resolution rules
5. Concise summary format
6. Single-language response policy

## Supported interaction patterns

### 1) Start audit

Examples:
- `Run a GEO audit for https://example.com`
- `Esegui un audit GEO per https://example.com`

Behavior:
- Extract URL
- Validate URL
- Run `compile_geo_report`
- Return summary + dashboard updates

### 2) Follow-up question (after report exists)

Examples:
- `What are the 3 fastest wins?`
- `Qual è il problema più critico lato schema?`

Behavior:
- Uses existing report context
- Does **not** rerun audit unless explicit new audit intent is present

## Prompting best practices for users

- Include full URL (`https://...`)
- Ask specific goals:
  - “Top 3 issues”
  - “Quick wins for marketing team”
  - “Technical-only action plan”
- For follow-ups, avoid “run/start/audit” words unless you really want a new run

## Change management

When editing prompts:

1. Keep safety constraints explicit
2. Preserve URL validation boundaries
3. Avoid expanding tool scope unintentionally
4. Re-test:
   - direct audit from textbox
   - direct audit from chat
   - follow-up Q&A (no repeated audit recap)

