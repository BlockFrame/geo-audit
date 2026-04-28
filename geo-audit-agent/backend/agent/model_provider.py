import os
from typing import Iterable

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI, ChatOpenAI


load_dotenv(override=False)


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def _require_env(keys: Iterable[str], provider: str) -> None:
    missing = [k for k in keys if not os.getenv(k)]
    if missing:
        raise RuntimeError(
            f"Missing required environment variables for provider '{provider}': {', '.join(missing)}"
        )


def build_chat_model():
    provider = (os.getenv("LLM_PROVIDER") or "openai").strip().lower()
    request_timeout = _int_env("LLM_REQUEST_TIMEOUT_SECONDS", 60)
    max_retries = _int_env("LLM_MAX_RETRIES", 2)

    if provider == "openai":
        _require_env(["OPENAI_API_KEY"], provider)
        model = os.getenv("OPENAI_MODEL", "gpt-4o")
        return ChatOpenAI(
            model=model,
            temperature=0,
            streaming=True,
            timeout=request_timeout,
            max_retries=max_retries,
        )

    if provider == "openrouter":
        _require_env(["OPENROUTER_API_KEY"], provider)
        model = os.getenv("OPENROUTER_MODEL", "openrouter/free")
        base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        require_free = os.getenv("OPENROUTER_REQUIRE_FREE", "true").strip().lower() in (
            "1",
            "true",
            "yes",
            "on",
        )

        free_models_raw = os.getenv(
            "OPENROUTER_FREE_MODELS",
            "meta-llama/llama-3.3-8b-instruct:free,google/gemma-2-9b-it:free,mistralai/mistral-7b-instruct:free",
        )
        free_models = [m.strip() for m in free_models_raw.split(",") if m.strip()]

        headers = {}
        if os.getenv("OPENROUTER_HTTP_REFERER"):
            headers["HTTP-Referer"] = os.getenv("OPENROUTER_HTTP_REFERER")
        if os.getenv("OPENROUTER_APP_TITLE"):
            headers["X-Title"] = os.getenv("OPENROUTER_APP_TITLE")

        kwargs = {
            "model": model,
            "api_key": os.getenv("OPENROUTER_API_KEY"),
            "base_url": base_url,
            "temperature": 0,
            "streaming": True,
            "timeout": request_timeout,
            "max_retries": max_retries,
        }
        if require_free and free_models and model != "openrouter/free":
            # If not using the official free router model, constrain routing to a free-only pool.
            kwargs["extra_body"] = {"models": free_models}
        if headers:
            kwargs["default_headers"] = headers

        return ChatOpenAI(**kwargs)

    if provider in ("azure", "azure_foundry", "azure_ai_foundry"):
        _require_env(
            [
                "AZURE_OPENAI_API_KEY",
                "AZURE_OPENAI_ENDPOINT",
                "AZURE_OPENAI_DEPLOYMENT_NAME",
            ],
            provider,
        )
        return AzureChatOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21"),
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
            temperature=0,
            streaming=True,
            timeout=request_timeout,
            max_retries=max_retries,
        )

    if provider == "vertex":
        _require_env(["VERTEX_PROJECT_ID", "VERTEX_LOCATION"], provider)
        model = os.getenv("VERTEX_MODEL", "gemini-1.5-flash-002")
        try:
            from langchain_google_vertexai import ChatVertexAI
        except ImportError as exc:
            raise RuntimeError(
                "Provider 'vertex' requires package 'langchain-google-vertexai'. "
                "Install dependencies from backend/requirements.txt."
            ) from exc

        return ChatVertexAI(
            model=model,
            project=os.getenv("VERTEX_PROJECT_ID"),
            location=os.getenv("VERTEX_LOCATION"),
            temperature=0,
        )

    raise RuntimeError(
        "Unsupported LLM_PROVIDER. Use one of: openai, openrouter, azure, azure_foundry, vertex"
    )
