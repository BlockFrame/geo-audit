import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from copilotkit import CopilotKitSDK, LangGraphAGUIAgent
from copilotkit.langgraph_agent import LangGraphAgent as _CKLangGraphAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from ag_ui_langgraph.endpoint import add_langgraph_fastapi_endpoint

from agent.graph import graph


def _parse_origins(raw_value: str | None) -> list[str]:
    if not raw_value:
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    origins = [origin.strip() for origin in raw_value.split(",") if origin.strip()]
    return origins or ["http://localhost:3000", "http://127.0.0.1:3000"]


class FixedLangGraphAGUIAgent(LangGraphAGUIAgent):
    """
    LangGraphAGUIAgent subclass that bridges the SDK's execute() call.

    copilotkit SDK 0.1.87 calls agent.execute() but LangGraphAGUIAgent
    (which extends ag_ui_langgraph.LangGraphAgent) only has run().
    We delegate execute() and get_state() to a copilotkit.LangGraphAgent
    instance while keeping the LangGraphAGUIAgent type for SDK validation.
    """

    def __init__(self, *, name, description=None, graph, config=None):
        super().__init__(name=name, description=description, graph=graph, config=config)
        self._ck_agent = _CKLangGraphAgent(
            name=name, description=description, graph=graph, config=config
        )

    def execute(self, *, state, config=None, messages, thread_id, actions=None, meta_events=None, **kwargs):
        return self._ck_agent.execute(
            state=state, config=config, messages=messages,
            thread_id=thread_id, actions=actions, meta_events=meta_events, **kwargs
        )

    async def get_state(self, *, thread_id):
        return await self._ck_agent.get_state(thread_id=thread_id)

    def dict_repr(self):
        return {
            "name": self.name,
            "description": self.description or "",
            "type": "langgraph_agui",
        }


app = FastAPI(title="GEO Audit Agent API", version="1.0.0")

frontend_origins = _parse_origins(os.getenv("FRONTEND_ORIGINS"))
frontend_origin_regex = os.getenv("FRONTEND_ORIGIN_REGEX")

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=frontend_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sdk = CopilotKitSDK(
    agents=[
        FixedLangGraphAGUIAgent(
            name="default",
            description=(
                "Expert GEO (Generative Engine Optimization) analyst. "
                "Audits websites for AI search engine readiness: llms.txt, "
                "AI crawler access, schema markup, meta tags, and citability."
            ),
            graph=graph,
        )
    ]
)

add_fastapi_endpoint(app, sdk, "/copilotkit")
add_langgraph_fastapi_endpoint(
    app,
    LangGraphAGUIAgent(
        name="default",
        description=(
            "Expert GEO (Generative Engine Optimization) analyst. "
            "Audits websites for AI search engine readiness: llms.txt, "
            "AI crawler access, schema markup, meta tags, and citability."
        ),
        graph=graph,
    ),
    "/agui/default",
)


@app.get("/health")
def health():
    return {"status": "ok", "agent": "default"}
