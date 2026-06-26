import json
import re
from uuid import uuid4
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

from .state import GeoAuditState
from .prompts import build_geo_audit_system_prompt
from .model_provider import build_chat_model
from .tools.geo_tools import (
    fetch_homepage,
    check_robots_txt,
    check_llms_txt,
    detect_business_type,
    check_schema_markup,
    analyze_meta_tags,
    audit_technical_seo,
    analyze_content_quality,
    scan_brand_mentions,
    score_citability,
    analyze_platform_readiness,
    generate_llms_txt,
    compile_geo_report,
    validate_audit_url,
)

# ---------------------------------------------------------------------------
# Model + tools
# ---------------------------------------------------------------------------
tools = [
    fetch_homepage,
    check_robots_txt,
    check_llms_txt,
    detect_business_type,
    check_schema_markup,
    analyze_meta_tags,
    audit_technical_seo,
    analyze_content_quality,
    scan_brand_mentions,
    score_citability,
    analyze_platform_readiness,
    generate_llms_txt,
    compile_geo_report,
]

model = build_chat_model().bind_tools(tools)
tool_node = ToolNode(tools)
MAX_GRAPH_MESSAGES = 40
ALLOWED_TOOL_NAME = "compile_geo_report"
URL_PATTERN = re.compile(r"https?://[^\s\"'\]\}]+", re.IGNORECASE)
DOMAIN_PATTERN = re.compile(
    r"\b(?:https?://)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:/[^\s\"'\]\}<]*)?",
    re.IGNORECASE,
)
BLOCKED_CHAT_PATTERNS = [
    re.compile(r"\b(system prompt|developer message|hidden instructions?|internal prompt|tool schema|chain of thought)\b", re.IGNORECASE),
    re.compile(r"\b(ignore|bypass|override)\b.{0,40}\b(instruction|guardrail|policy|prompt)\b", re.IGNORECASE),
    re.compile(r"\b(api[\s_-]?key|token|password|secret|credential|cookie|session)\b", re.IGNORECASE),
    re.compile(r"\b(malware|ransomware|phishing|exploit|reverse shell|payload|sql injection|xss|csrf|ssrf|rce|privilege escalation)\b", re.IGNORECASE),
    re.compile(r"\b(jailbreak|prompt injection|dan)\b", re.IGNORECASE),
]

def _message_text(content) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return " ".join(parts)

    return str(content or "")


def _detect_language(state: GeoAuditState) -> str:
    latest_text = _latest_user_text(state).lower()
    if not latest_text:
        return "en"

    italian_markers = [
        r"\b(analizza|analizzare|audit|sito|migliorie|criticita|priorita|consigli|verifica|prosegui)\b",
        r"\b(come|cosa|perche|perche'|perché|quando|quali|quanto|dove)\b",
        r"\b(il|lo|la|gli|le|un|una|del|della|dei|delle|nel|nella|con|per)\b",
    ]
    if sum(1 for pattern in italian_markers if re.search(pattern, latest_text, re.IGNORECASE)) >= 2:
        return "it"

    return "en"


def _extract_structured_tool_payload(text: str):
    decoder = json.JSONDecoder()

    for marker in ("[", "{"):
        start = text.find(marker)
        if start == -1:
            continue

        try:
            payload, _ = decoder.raw_decode(text[start:])
            return payload
        except json.JSONDecodeError:
            continue

    return None


def _latest_user_text(state: GeoAuditState) -> str:
    for message in reversed(state.get("messages", [])):
        if isinstance(message, HumanMessage) or getattr(message, "type", None) == "human":
            return _message_text(getattr(message, "content", "")).strip()
    return ""


def _normalize_audit_candidate(candidate: str) -> str | None:
    cleaned = candidate.strip().strip(".,;:!?)]}")
    if not cleaned or "@" in cleaned:
        return None

    if not re.match(r"^https?://", cleaned, re.IGNORECASE):
        cleaned = f"https://{cleaned}"

    is_valid, _ = validate_audit_url(cleaned)
    return cleaned if is_valid else None


def _extract_audit_url_from_text(text: str) -> str | None:
    for match in URL_PATTERN.findall(text):
        normalized = _normalize_audit_candidate(match)
        if normalized:
            return normalized

    for match in DOMAIN_PATTERN.findall(text):
        normalized = _normalize_audit_candidate(match)
        if normalized:
            return normalized

    return None


def _guardrail_message(language: str, kind: str) -> str:
    if language == "it":
        if kind == "scope":
            return (
                "Posso aiutarti solo con audit GEO per siti web pubblici. "
                "Non posso aiutare con exploit, bypass, prompt nascosti, segreti o credenziali."
            )
        return "Posso analizzare solo URL pubblici http(s). Non usare localhost, indirizzi privati o endpoint interni."

    if kind == "scope":
        return (
            "I can only help with GEO audits for public websites. "
            "I can't help with exploits, bypasses, hidden prompts, secrets, or credentials."
        )
    return "I can only analyze public http(s) URLs. Do not use localhost, private addresses, or internal endpoints."


def _chat_guardrail_response(state: GeoAuditState, language: str) -> AIMessage | None:
    latest_text = _latest_user_text(state)
    if not latest_text:
        return None

    if any(pattern.search(latest_text) for pattern in BLOCKED_CHAT_PATTERNS):
        return AIMessage(content=_guardrail_message(language, "scope"))

    for url in URL_PATTERN.findall(latest_text):
        is_valid, _ = validate_audit_url(url)
        if not is_valid:
            return AIMessage(content=_guardrail_message(language, "url"))

    return None


def _enforce_tool_guardrails(response: AIMessage, language: str) -> AIMessage:
    tool_calls = getattr(response, "tool_calls", None) or []
    if not tool_calls:
        return response

    if len(tool_calls) != 1:
        return AIMessage(content=_guardrail_message(language, "scope"))

    tool_call = tool_calls[0]
    if tool_call.get("name") != ALLOWED_TOOL_NAME:
        return AIMessage(content=_guardrail_message(language, "scope"))

    args = tool_call.get("args") or {}
    url = args.get("url") if isinstance(args, dict) else None
    if not isinstance(url, str):
        return AIMessage(content=_guardrail_message(language, "url"))

    is_valid, _ = validate_audit_url(url)
    if not is_valid:
        return AIMessage(content=_guardrail_message(language, "url"))

    return AIMessage(content=response.content, tool_calls=[{
        "id": tool_call.get("id") or f"synthetic_{uuid4().hex}",
        "name": ALLOWED_TOOL_NAME,
        "args": {"url": url.strip()},
        "type": "tool_call",
    }])


def _normalize_textual_tool_calls(response: AIMessage) -> AIMessage:
    if getattr(response, "tool_calls", None):
        return response

    text = _message_text(getattr(response, "content", "")).strip()
    if not text or "compile_geo_report" not in text:
        return response

    payload = _extract_structured_tool_payload(text)
    raw_calls = payload if isinstance(payload, list) else [payload] if isinstance(payload, dict) else []

    normalized_calls = []
    for raw_call in raw_calls:
        if not isinstance(raw_call, dict):
            continue

        name = raw_call.get("name") or raw_call.get("tool_name")
        arguments = raw_call.get("arguments") or raw_call.get("args") or {}

        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError:
                arguments = {"url": arguments} if name == "compile_geo_report" else {}

        if not name or not isinstance(arguments, dict):
            continue

        normalized_calls.append({
            "id": raw_call.get("id") or f"synthetic_{uuid4().hex}",
            "name": name,
            "args": arguments,
            "type": "tool_call",
        })

    if not normalized_calls and "compile_geo_report" in text:
        url_match = re.search(r"https?://[^\s\"'\]\}]+", text)
        if url_match:
            normalized_calls.append({
                "id": f"synthetic_{uuid4().hex}",
                "name": "compile_geo_report",
                "args": {"url": url_match.group(0)},
                "type": "tool_call",
            })

    if not normalized_calls:
        return response

    return AIMessage(content="", tool_calls=normalized_calls)


def _score_label(score: int | None, language: str) -> str:
    if score is None:
        return "non disponibile" if language == "it" else "unavailable"
    if score >= 70:
        return "forte" if language == "it" else "strong"
    if score >= 45:
        return "discreto" if language == "it" else "moderate"
    return "debole" if language == "it" else "weak"


def _build_report_summary(report: dict, language: str) -> str:
    score = report.get("geo_score")
    recommendations = report.get("recommendations") or []
    top_actions = [item.get("action") for item in recommendations if isinstance(item, dict) and item.get("action")][:3]
    quick_win = top_actions[0] if top_actions else None

    if language == "it":
        lines = [
            f"Audit completato per {report.get('url', 'il sito richiesto')}.",
            f"- GEO score: {score if score is not None else 'n/d'}/100 ({_score_label(score, language)})",
        ]
        if top_actions:
            lines.append("- Top criticita:")
            lines.extend(f"  {index}. {action}" for index, action in enumerate(top_actions, start=1))
        if quick_win:
            lines.append(f"- Quick win: {quick_win}")
        return "\n".join(lines)

    lines = [
        f"Audit completed for {report.get('url', 'the requested site')}.",
        f"- GEO score: {score if score is not None else 'n/a'}/100 ({_score_label(score, language)})",
    ]
    if top_actions:
        lines.append("- Top issues:")
        lines.extend(f"  {index}. {action}" for index, action in enumerate(top_actions, start=1))
    if quick_win:
        lines.append(f"- Quick win: {quick_win}")
    return "\n".join(lines)


def route_after_tools(state: GeoAuditState):
    last = state["messages"][-1]
    if getattr(last, "name", None) == "compile_geo_report":
        return "update_state"
    return "agent"

# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------

def call_model(state: GeoAuditState):
    messages = state.get("messages", [])
    language = _detect_language(state)
    system = SystemMessage(content=build_geo_audit_system_prompt(language))
    guardrail_response = _chat_guardrail_response(state, language)
    if guardrail_response is not None:
        return {"messages": [guardrail_response], "status": "error"}

    audit_url = _extract_audit_url_from_text(_latest_user_text(state))
    if audit_url:
        return {
            "messages": [AIMessage(content="", tool_calls=[{
                "id": f"synthetic_{uuid4().hex}",
                "name": ALLOWED_TOOL_NAME,
                "args": {"url": audit_url},
                "type": "tool_call",
            }])],
            "status": "analyzing",
            "url": audit_url,
        }

    try:
        response = _normalize_textual_tool_calls(model.invoke([system] + messages))
        response = _enforce_tool_guardrails(response, language)
        return {"messages": [response], "status": "analyzing"}
    except Exception:
        # Keep the stream alive and return a user-facing error instead of
        # aborting the HTTP connection with a backend stack trace.
        fallback = AIMessage(
            content=(
                "Il provider AI non ha risposto in tempo. Riprova tra pochi secondi oppure usa un modello/provider piu stabile."
                if language == "it"
                else "The AI provider did not respond in time. Retry in a few seconds or use a more stable model/provider."
            )
        )
        return {"messages": [fallback], "status": "error"}


def should_continue(state: GeoAuditState):
    # Safety guard: stop runaway tool loops that can keep the UI waiting.
    if len(state.get("messages", [])) >= MAX_GRAPH_MESSAGES:
        return "update_state"

    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "update_state"


def update_state(state: GeoAuditState):
    """Parse compile_geo_report output and populate structured state fields."""
    updates: dict = {"status": "incomplete"}
    language = _detect_language(state)
    for msg in reversed(state.get("messages", [])):
        name = getattr(msg, "name", None)
        if name == "compile_geo_report":
            try:
                data = json.loads(msg.content)
                updates.update({
                    "status":                "complete",
                    "geo_score":             data.get("geo_score"),
                    "score_breakdown":       data.get("score_breakdown"),
                    "crawler_matrix":        data.get("crawler_matrix"),
                    "llms_txt_status":       data.get("llms_txt_status"),
                    "llms_txt_recommended":  data.get("llms_txt_recommended"),
                    "schema_found":          data.get("schema_found"),
                    "schema_types":          data.get("schema_types"),
                    "schema_recommendations": data.get("schema_recommendations"),
                    "meta_issues":           data.get("meta_issues"),
                    "recommendations":       data.get("recommendations"),
                    "report":                data,
                    "messages":              [AIMessage(content=_build_report_summary(data, language))],
                })
            except (json.JSONDecodeError, TypeError):
                pass
            break
    return updates


# ---------------------------------------------------------------------------
# Build graph
# ---------------------------------------------------------------------------
workflow = StateGraph(GeoAuditState)

workflow.add_node("agent",        call_model)
workflow.add_node("tools",        tool_node)
workflow.add_node("update_state", update_state)

workflow.set_entry_point("agent")
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {"tools": "tools", "update_state": "update_state"},
)
workflow.add_conditional_edges(
    "tools",
    route_after_tools,
    {"agent": "agent", "update_state": "update_state"},
)
workflow.add_edge("update_state", END)

graph = workflow.compile(checkpointer=MemorySaver())
