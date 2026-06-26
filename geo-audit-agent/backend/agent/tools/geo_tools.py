import httpx
import ipaddress
import json
import re
import socket
from contextvars import ContextVar
from datetime import date
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from langchain_core.tools import tool

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
AI_CRAWLERS = [
    # Tier 1 — Critical for AI search visibility (ALLOW recommended)
    {"name": "GPTBot",            "company": "OpenAI",       "type": "search",   "tier": 1},
    {"name": "OAI-SearchBot",     "company": "OpenAI",       "type": "search",   "tier": 1},
    {"name": "ChatGPT-User",      "company": "OpenAI",       "type": "search",   "tier": 1},
    {"name": "ClaudeBot",         "company": "Anthropic",    "type": "search",   "tier": 1},
    {"name": "PerplexityBot",     "company": "Perplexity",   "type": "search",   "tier": 1},
    # Tier 2 — Important for broader AI ecosystem (ALLOW recommended)
    {"name": "Google-Extended",   "company": "Google",       "type": "training", "tier": 2},
    {"name": "GoogleOther",       "company": "Google",       "type": "training", "tier": 2},
    {"name": "Applebot-Extended", "company": "Apple",        "type": "training", "tier": 2},
    {"name": "Amazonbot",         "company": "Amazon",       "type": "search",   "tier": 2},
    {"name": "FacebookBot",       "company": "Meta",         "type": "search",   "tier": 2},
    {"name": "Bingbot",           "company": "Microsoft",    "type": "search",   "tier": 2},
    # Tier 3 — Training-only / context-dependent (BLOCK Bytespider recommended)
    {"name": "anthropic-ai",      "company": "Anthropic",    "type": "training", "tier": 3},
    {"name": "CCBot",             "company": "Common Crawl", "type": "training", "tier": 3},
    {"name": "Bytespider",        "company": "ByteDance",    "type": "training", "tier": 3},
    {"name": "cohere-ai",         "company": "Cohere",       "type": "training", "tier": 3},
]

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; GeoAuditBot/1.0; +https://github.com/geo-audit)"}
ALLOWED_SCHEMES = {"http", "https"}
BLOCKED_HOST_LABELS = {"localhost"}
MAX_REDIRECTS = 5
MAX_FETCH_BYTES = 2 * 1024 * 1024
PUBLIC_URL_ERROR = "Target URL is not allowed. Use a public http(s) website URL."
FETCH_ERROR = "Unable to fetch the requested page."
FETCH_TOO_LARGE_ERROR = "Fetched content is too large."
UNSUPPORTED_CONTENT_TYPE_ERROR = "Fetched content type is not supported."
_REQUEST_CACHE: ContextVar[dict[tuple[str, int], tuple[int, str, dict]] | None] = ContextVar(
    "geo_audit_request_cache",
    default=None,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _base(url: str) -> str:
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}"


def _validate_public_ip(ip_text: str) -> None:
    ip = ipaddress.ip_address(ip_text)
    if not ip.is_global:
        raise ValueError(PUBLIC_URL_ERROR)


def _validate_public_hostname(hostname: str) -> None:
    normalized = hostname.strip().lower()
    if not normalized:
        raise ValueError(PUBLIC_URL_ERROR)

    if normalized in BLOCKED_HOST_LABELS or normalized.endswith(".localhost") or normalized.endswith(".local"):
        raise ValueError(PUBLIC_URL_ERROR)

    try:
        _validate_public_ip(normalized)
        return
    except ValueError:
        pass

    try:
        addresses = socket.getaddrinfo(normalized, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ValueError(FETCH_ERROR) from exc

    for _, _, _, _, sockaddr in addresses:
        candidate = sockaddr[0]
        _validate_public_ip(candidate)


def normalize_public_url(url: str) -> str:
    candidate = (url or "").strip()
    parsed = urlparse(candidate)

    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValueError(PUBLIC_URL_ERROR)
    if not parsed.netloc or parsed.username or parsed.password or not parsed.hostname:
        raise ValueError(PUBLIC_URL_ERROR)

    _validate_public_hostname(parsed.hostname)
    return parsed.geturl()


def validate_audit_url(url: str) -> tuple[bool, str | None]:
    try:
        normalize_public_url(url)
    except ValueError as exc:
        return False, str(exc)
    return True, None


def _safe_request(url: str, timeout: int = 10) -> httpx.Response:
    current_url = normalize_public_url(url)

    with httpx.Client(headers=HEADERS, timeout=timeout, follow_redirects=False) as client:
        for _ in range(MAX_REDIRECTS + 1):
            response = client.get(current_url)
            if response.is_redirect:
                location = response.headers.get("location")
                if not location:
                    return response
                current_url = normalize_public_url(urljoin(current_url, location))
                continue
            return response

    raise ValueError("Too many redirects")


def _is_supported_content_type(headers: dict) -> bool:
    content_type = headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if not content_type:
        return True

    return content_type.startswith("text/") or content_type in {
        "application/json",
        "application/ld+json",
        "application/xml",
        "application/xhtml+xml",
        "application/rss+xml",
        "application/atom+xml",
    }


def _read_limited_text(response: httpx.Response) -> str:
    content_length = response.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > MAX_FETCH_BYTES:
        raise ValueError(FETCH_TOO_LARGE_ERROR)

    chunks: list[bytes] = []
    total_bytes = 0
    for chunk in response.iter_bytes():
        total_bytes += len(chunk)
        if total_bytes > MAX_FETCH_BYTES:
            raise ValueError(FETCH_TOO_LARGE_ERROR)
        chunks.append(chunk)

    return b"".join(chunks).decode(response.encoding or "utf-8", errors="replace")


def _safe_fetch_full(url: str, timeout: int = 10) -> tuple[int, str, dict]:
    current_url = normalize_public_url(url)

    with httpx.Client(headers=HEADERS, timeout=timeout, follow_redirects=False) as client:
        for _ in range(MAX_REDIRECTS + 1):
            with client.stream("GET", current_url) as response:
                headers = dict(response.headers)

                if response.is_redirect:
                    location = response.headers.get("location")
                    if not location:
                        return response.status_code, "", headers
                    current_url = normalize_public_url(urljoin(current_url, location))
                    continue

                if not _is_supported_content_type(headers):
                    raise ValueError(UNSUPPORTED_CONTENT_TYPE_ERROR)

                return response.status_code, _read_limited_text(response), headers

    raise ValueError("Too many redirects")


def _get(url: str, timeout: int = 10) -> tuple[int, str]:
    status_code, content, _ = _get_full(url, timeout=timeout)
    return status_code, content


def _get_full(url: str, timeout: int = 10) -> tuple[int, str, dict]:
    """Like _get but also returns response headers for security header checks."""
    cache = _REQUEST_CACHE.get()
    cache_key = (url, timeout)
    if cache is not None and cache_key in cache:
        return cache[cache_key]

    try:
        result = _safe_fetch_full(url, timeout=timeout)
    except ValueError as exc:
        result = (0, str(exc), {})
    except Exception:
        result = (0, FETCH_ERROR, {})

    if cache is not None:
        cache[cache_key] = result

    return result


def _domain_label(url: str) -> str:
    host = (urlparse(url).netloc or "example.com").lower()
    host = host.split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    return host


# ---------------------------------------------------------------------------
# Private implementations (no @tool decorator — no circular imports)
# ---------------------------------------------------------------------------

def _homepage_impl(url: str) -> dict:
    status_code, html = _get(url)
    if status_code == 0:
        return {"error": f"Cannot fetch {url}: {html}"}

    soup = BeautifulSoup(html, "html.parser")

    title_el = soup.find("title")
    title = title_el.get_text(strip=True) if title_el else None

    desc_el = soup.find("meta", {"name": "description"})
    desc = desc_el.get("content") if desc_el else None

    h1s = [h.get_text(strip=True) for h in soup.find_all("h1")][:5]
    h2s = [h.get_text(strip=True) for h in soup.find_all("h2")][:8]

    words = len(soup.get_text().split())
    lang_el = soup.find("html", {"lang": True})

    return {
        "url": url,
        "status_code": status_code,
        "title": title,
        "meta_description": desc,
        "h1_tags": h1s,
        "h2_tags": h2s,
        "word_count": words,
        "lang": lang_el.get("lang") if lang_el else None,
        "has_main": bool(soup.find("main")),
        "has_article": bool(soup.find("article")),
        "html_length": len(html),
    }


def _robots_impl(url: str) -> dict:
    robots_url = f"{_base(url)}/robots.txt"
    status_code, content = _get(robots_url)

    if status_code != 200:
        return {
            "status": "not_found",
            "status_code": status_code,
            "crawler_matrix": [
                {**c, "access": "unknown", "explicitly_configured": False, "rules": []}
                for c in AI_CRAWLERS
            ],
            "ai_crawlers_explicitly_configured": 0,
        }

    # Parse rules
    rules: dict[str, list] = {}
    current_agents: list[str] = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.lower().startswith("user-agent:"):
            current_agents = [line.split(":", 1)[1].strip()]
        elif line.lower().startswith(("disallow:", "allow:")):
            for agent in current_agents:
                rules.setdefault(agent, []).append(line)

    def _access(name: str) -> tuple[str, bool]:
        if name in rules:
            disallows = [r for r in rules[name] if r.lower().startswith("disallow:")]
            if any(r.split(":", 1)[1].strip() in ("/", "") for r in disallows):
                return "blocked", True
            if disallows:
                return "partial", True
            return "allowed", True
        # falls back to wildcard
        wildcard = rules.get("*", [])
        disallows = [r for r in wildcard if r.lower().startswith("disallow:")]
        if any(r.split(":", 1)[1].strip() in ("/", "") for r in disallows):
            return "blocked_via_wildcard", False
        if disallows:
            return "partial_via_wildcard", False
        return "allowed_via_wildcard", False

    crawler_matrix = []
    for c in AI_CRAWLERS:
        access, explicit = _access(c["name"])
        crawler_matrix.append({
            **c,
            "access": access,
            "explicitly_configured": explicit,
            "rules": rules.get(c["name"], []),
        })

    return {
        "status": "found",
        "status_code": status_code,
        "has_sitemap_declaration": "sitemap:" in content.lower(),
        "crawler_matrix": crawler_matrix,
        "ai_crawlers_explicitly_configured": sum(1 for c in crawler_matrix if c["explicitly_configured"]),
        "raw_snippet": content[:600],
    }


def _llms_impl(url: str) -> dict:
    llms_url = f"{_base(url)}/llms.txt"
    status_code, content = _get(llms_url)

    if status_code == 200:
        return {
            "status": "found",
            "url": llms_url,
            "content_length": len(content),
            "has_about": "## about" in content.lower() or "# about" in content.lower(),
            "has_services": "service" in content.lower(),
            "has_contact": "contact" in content.lower(),
            "preview": content[:400],
        }
    if status_code == 403:
        return {"status": "blocked", "url": llms_url, "status_code": 403,
                "message": "File exists but returns 403. Fix server config to allow public access."}
    if status_code == 404:
        return {"status": "not_found", "url": llms_url, "status_code": 404,
                "message": "No llms.txt found — critical GEO gap."}
    return {"status": "error", "url": llms_url, "status_code": status_code}


def _schema_impl(url: str) -> dict:
    status_code, html = _get(url)
    if status_code == 0:
        return {"error": "Cannot fetch page"}

    soup = BeautifulSoup(html, "html.parser")

    # JSON-LD
    ld_scripts = soup.find_all("script", {"type": "application/ld+json"})
    ld_types: list[str] = []
    ld_errors: list[str] = []
    for script in ld_scripts:
        try:
            data = json.loads(script.string or "{}")
            items = data if isinstance(data, list) else [data]
            for item in items:
                if isinstance(item, dict) and "@type" in item:
                    ld_types.append(item["@type"])
        except json.JSONDecodeError as e:
            ld_errors.append(str(e))

    # Microdata
    microdata = [el.get("itemtype", "").split("/")[-1]
                 for el in soup.find_all(attrs={"itemtype": True})]

    all_types = list(set(ld_types + microdata))

    recs = []
    if not ld_types:
        recs.append("Add JSON-LD structured data — highest priority")
    if not any(t in all_types for t in ["Organization", "FinancialService", "LocalBusiness"]):
        recs.append("Add Organization / FinancialService schema")
    if "WebSite" not in all_types:
        recs.append("Add WebSite schema with SearchAction")
    if "BreadcrumbList" not in all_types:
        recs.append("Add BreadcrumbList schema for navigation context")
    if "FAQPage" not in all_types:
        recs.append("Add FAQPage schema for AI-friendly Q&A content")

    score = min(100, len(all_types) * 15 + (25 if ld_types else 0))

    # Generate ready-to-use Organization JSON-LD template if no entity schema found
    org_jsonld_template = None
    if not any(t in all_types for t in ["Organization", "FinancialService", "LocalBusiness",
                                         "Corporation", "NGO", "Person"]):
        base_url = _base(url)
        domain   = _domain_label(url)
        org_jsonld_template = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": f"{base_url}/#organization",
            "name": domain,
            "url": base_url,
            "logo": {"@type": "ImageObject", "url": f"{base_url}/logo.png"},
            "description": "Add a 1-2 sentence description of the organization here.",
            "sameAs": [
                "https://en.wikipedia.org/wiki/COMPANY_NAME",
                "https://www.wikidata.org/wiki/QXXXXXX",
                "https://www.linkedin.com/company/COMPANY-SLUG",
                "https://www.youtube.com/@COMPANY-HANDLE",
                "https://twitter.com/COMPANY-HANDLE",
            ],
            "knowsAbout": ["Topic 1", "Topic 2", "Topic 3"],
        }

    return {
        "json_ld_found": bool(ld_types),
        "json_ld_count": len(ld_scripts),
        "json_ld_types": ld_types,
        "json_ld_errors": ld_errors,
        "microdata_types": microdata,
        "all_schema_types": all_types,
        "recommendations": recs,
        "score": score,
        "org_jsonld_template": org_jsonld_template,
    }


def _meta_impl(url: str) -> dict:
    status_code, html = _get(url)
    if status_code == 0:
        return {"error": "Cannot fetch page"}

    soup = BeautifulSoup(html, "html.parser")

    title_el = soup.find("title")
    title = title_el.get_text(strip=True) if title_el else None
    title_len = len(title) if title else 0

    desc_el = soup.find("meta", {"name": "description"})
    desc = desc_el.get("content") if desc_el else None
    desc_len = len(desc) if desc else 0

    og = {tag.get("property"): tag.get("content")
          for tag in soup.find_all("meta", property=re.compile("^og:"))}

    tw = {tag.get("name"): tag.get("content")
          for tag in soup.find_all("meta", attrs={"name": re.compile("^twitter:")})}

    issues = []
    if not title:
        issues.append({"severity": "critical", "issue": "Missing <title> tag"})
    elif title_len < 30:
        issues.append({"severity": "warning", "issue": f"Title too short ({title_len} chars; ideal 50-60)"})
    elif title_len > 65:
        issues.append({"severity": "warning", "issue": f"Title too long ({title_len} chars; ideal 50-60)"})

    if not desc:
        issues.append({"severity": "high", "issue": "Missing meta description"})
    elif desc_len > 160:
        issues.append({"severity": "warning", "issue": f"Meta description too long ({desc_len} chars; ideal <155)"})

    if "og:image" not in og:
        issues.append({"severity": "high", "issue": "Missing og:image — no social/AI preview image"})
    if "og:title" not in og:
        issues.append({"severity": "medium", "issue": "Missing og:title"})

    card = tw.get("twitter:card", "")
    if not card:
        issues.append({"severity": "medium", "issue": "Missing twitter:card"})
    elif card not in ("summary", "summary_large_image", "app", "player"):
        issues.append({"severity": "high",
                       "issue": f"Invalid twitter:card value '{card}'; should be 'summary_large_image'"})
    if "twitter:image" not in tw:
        issues.append({"severity": "medium", "issue": "Missing twitter:image"})

    penalty = (sum(30 for i in issues if i["severity"] == "critical") +
               sum(15 for i in issues if i["severity"] == "high") +
               sum(8  for i in issues if i["severity"] == "medium") +
               sum(3  for i in issues if i["severity"] == "warning"))
    score = max(0, 100 - penalty)

    return {
        "title": {"text": title, "length": title_len, "optimal": 50 <= title_len <= 60},
        "description": {"text": (desc[:200] if desc else None), "length": desc_len,
                        "optimal": 120 <= desc_len <= 155},
        "og_tags": og,
        "twitter_tags": tw,
        "issues": issues,
        "score": score,
    }


def _citability_impl(url: str) -> dict:
    status_code, html = _get(url)
    if status_code == 0:
        return {"error": "Cannot fetch page"}

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator=" ", strip=True)

    # 1. Question-format headers
    question_words = ["come", "cosa", "perché", "quando", "chi", "how", "what", "why", "when", "who",
                      "qual", "quanti", "which", "where", "dove"]
    q_headers = [h.get_text(strip=True) for h in soup.find_all(["h2", "h3"])
                 if any(w in h.get_text(strip=True).lower() for w in question_words)]
    s_answer = min(10, len(q_headers) * 2)

    # 2. Factual density (numbers, %, €, years)
    numbers = len(re.findall(r'\b\d{4}\b|\b\d+[%]\b|\b[€$]\d+|\b\d+\b', text))
    s_facts = min(10, numbers // 5)

    # 3. Structured content (lists + tables)
    s_structure = min(10, (len(soup.find_all(["ul", "ol"])) + len(soup.find_all("table")) * 2) * 2)

    # 4. Word count
    words = len(text.split())
    s_length = 10 if words > 2000 else 7 if words > 1000 else 5 if words > 500 else 2

    # 5. Authority signals
    authority_re = r"(?:secondo|according to|fondata|founded|anni di|years of|certificat|licen[sz]|autorizzat)"
    s_authority = min(10, len(re.findall(authority_re, text, re.I)) * 2)

    # 6. Unique data / stats
    s_data = min(10, len(re.findall(r'\d+[.,]\d+|\d+\s*(?:milion|billion|miliard)', text, re.I)) * 2)

    weighted = int(
        s_answer    * 0.25 * 10 +
        s_facts     * 0.20 * 10 +
        s_authority * 0.20 * 10 +
        s_length    * 0.15 * 10 +
        s_structure * 0.10 * 10 +
        s_data      * 0.10 * 10
    )

    issues = []
    if s_answer < 3:
        issues.append("Add FAQ sections with question-format H2/H3 headers")
    if s_facts < 3:
        issues.append("Include more data points, statistics, and specific numbers")
    if s_structure < 3:
        issues.append("Use bullet lists and comparison tables to structure information")
    if s_length < 7:
        issues.append("Increase content depth (target 1,000+ words per key page)")

    return {
        "citability_score": weighted,
        "score_details": {
            "answer_passages": s_answer,
            "factual_density": s_facts,
            "authority_signals": s_authority,
            "content_length": s_length,
            "structured_content": s_structure,
            "unique_data": s_data,
        },
        "word_count": words,
        "question_headers": q_headers[:5],
        "issues": issues,
        "verdict": "high" if weighted >= 70 else "medium" if weighted >= 40 else "low",
    }


def _business_type_impl(url: str) -> dict:
    status_code, html = _get(url)
    if status_code == 0:
        return {"error": "Cannot fetch page", "business_type": "Other", "confidence": 0}

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True).lower()
    links = " ".join((a.get("href") or "") for a in soup.find_all("a")).lower()
    corpus = f"{text} {links}"

    signals = {
        "SaaS": ["pricing", "free trial", "sign up", "/app", "/dashboard", "api docs"],
        "Local Service": ["google maps", "near me", "service area", "phone", "address"],
        "E-commerce": ["add to cart", "checkout", "product", "shop", "cart"],
        "Publisher": ["blog", "article", "author", "published", "newsletter"],
        "Agency": ["case study", "portfolio", "our services", "clients", "testimonials"],
    }

    scored = {}
    matched = {}
    for category, patterns in signals.items():
        hits = [p for p in patterns if p in corpus]
        scored[category] = len(hits)
        matched[category] = hits

    best = max(scored, key=lambda k: scored[k]) if scored else "Other"
    best_score = scored.get(best, 0)
    business_type = best if best_score > 0 else "Other"
    confidence = min(100, best_score * 20)

    return {
        "business_type": business_type,
        "confidence": confidence,
        "matched_signals": matched.get(best, []),
        "all_scores": scored,
    }


def _technical_impl(url: str) -> dict:
    status_code, html, resp_headers = _get_full(url)
    if status_code == 0:
        return {"error": "Cannot fetch page", "score": 0, "issues": ["Page unreachable"]}

    soup = BeautifulSoup(html, "html.parser")
    parsed = urlparse(url)

    # --- Core checks ---
    viewport = bool(soup.find("meta", attrs={"name": "viewport"}))
    canonical = bool(soup.find("link", attrs={"rel": "canonical"}))
    lang = bool(soup.find("html", attrs={"lang": True}))
    robots_meta = soup.find("meta", attrs={"name": re.compile("robots", re.I)})
    robots_value = (robots_meta.get("content", "") if robots_meta else "").lower()
    indexable = "noindex" not in robots_value
    h1_count = len(soup.find_all("h1"))
    has_https = parsed.scheme.lower() == "https"
    robots = _robots_impl(url)
    has_sitemap = robots.get("has_sitemap_declaration", False)

    # --- Security headers ---
    rh = {k.lower(): v.lower() for k, v in resp_headers.items()}
    has_hsts  = "strict-transport-security" in rh
    has_csp   = "content-security-policy" in rh
    has_xcto  = "nosniff" in rh.get("x-content-type-options", "")
    has_xfo   = "x-frame-options" in rh
    has_ref   = "referrer-policy" in rh
    sec_count = sum([has_hsts, has_csp, has_xcto, has_xfo, has_ref])

    # --- SSR detection ---
    raw_text  = soup.get_text(strip=True)
    h_in_raw  = len(soup.find_all(["h1", "h2", "h3"]))
    is_spa    = bool(
        soup.find("div", id=re.compile(r"^(root|app|__next|___gatsby)$"))
        and len(raw_text) < 800
    )
    ssr_ok    = len(raw_text) > 500 and h_in_raw >= 1 and not is_spa

    # --- CLS risk: images without explicit dimensions ---
    images        = soup.find_all("img")
    imgs_no_dims  = sum(1 for img in images if not (img.get("width") and img.get("height")))
    cls_risk      = imgs_no_dims > 3

    # --- IndexNow protocol ---
    indexnow_code, _ = _get(f"{_base(url)}/.well-known/indexnow-key.txt")
    has_indexnow     = indexnow_code == 200

    # --- Score (total capped at 100) ---
    score = 0
    score += 12 if has_https else 0
    score += 8  if viewport else 0
    score += 8  if canonical else 0
    score += 5  if lang else 0
    score += 12 if indexable else 0
    score += 5  if has_sitemap else 0
    score += 8  if h1_count == 1 else 4 if h1_count > 1 else 0
    score += min(10, sec_count * 2)
    score += 15 if ssr_ok else (5 if len(raw_text) > 200 else 0)
    score += 5  if not cls_risk else 0
    score += 5  if has_indexnow else 0

    issues = []
    if not has_https:
        issues.append("Site not served over HTTPS")
    if not viewport:
        issues.append("Missing viewport meta tag")
    if not canonical:
        issues.append("Missing canonical tag")
    if not lang:
        issues.append("Missing HTML lang attribute")
    if not indexable:
        issues.append("Page appears noindex via meta robots")
    if not has_sitemap:
        issues.append("No sitemap declaration found in robots.txt")
    if h1_count != 1:
        issues.append(f"Expected exactly one H1; found {h1_count}")
    if not has_hsts:
        issues.append("Security: missing Strict-Transport-Security (HSTS) header")
    if not has_xcto:
        issues.append("Security: missing X-Content-Type-Options: nosniff header")
    if not has_xfo:
        issues.append("Security: missing X-Frame-Options header")
    if is_spa:
        issues.append("Client-side rendering (SPA) detected — AI crawlers may see an empty page; implement SSR/SSG")
    elif not ssr_ok:
        issues.append("Low content in raw HTML — verify server-side rendering is active for AI crawler access")
    if cls_risk:
        issues.append(f"CLS risk: {imgs_no_dims} images missing explicit width/height (layout shift risk)")
    if not has_indexnow:
        issues.append("IndexNow not implemented — slower Bing/ChatGPT indexing on content updates")

    return {
        "score": min(100, score),
        "checks": {
            "https":                    has_https,
            "viewport":                 viewport,
            "canonical":                canonical,
            "lang":                     lang,
            "indexable":                indexable,
            "sitemap_declared":         has_sitemap,
            "h1_count":                 h1_count,
            "ssr_ok":                   ssr_ok,
            "is_spa":                   is_spa,
            "security_hsts":            has_hsts,
            "security_csp":             has_csp,
            "security_xcto":            has_xcto,
            "security_xfo":             has_xfo,
            "security_referrer":        has_ref,
            "cls_risk":                 cls_risk,
            "images_without_dimensions": imgs_no_dims,
            "indexnow":                 has_indexnow,
        },
        "issues": issues,
    }


def _content_quality_impl(url: str) -> dict:
    status_code, html = _get(url)
    if status_code == 0:
        return {"error": "Cannot fetch page", "score": 0, "issues": ["Page unreachable"]}

    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(" ", strip=True)
    lower_text = text.lower()
    words = re.findall(r"\w+", text)
    word_count = len(words)
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    avg_sentence_length = (word_count / len(sentences)) if sentences else 0

    anchors = [a.get("href", "").lower() for a in soup.find_all("a")]
    has_about = any("about" in h or "chi-siamo" in h for h in anchors)
    has_contact = any("contact" in h or "contatt" in h for h in anchors)
    has_author = bool(re.search(r"\bby\b|autore|author", lower_text))
    has_update_date = bool(re.search(r"\b20\d{2}\b", text))
    has_sources = bool(re.search(r"according to|secondo|fonte|source", lower_text))
    has_lists_or_tables = bool(soup.find_all(["ul", "ol", "table"]))

    eeat_signals = sum([
        has_about,
        has_contact,
        has_author,
        has_update_date,
        has_sources,
    ])

    score = 0
    score += 30 if word_count >= 1200 else 22 if word_count >= 700 else 12 if word_count >= 350 else 5
    score += 20 if avg_sentence_length <= 22 else 12 if avg_sentence_length <= 28 else 5
    score += eeat_signals * 8
    score += 10 if has_lists_or_tables else 0

    issues = []
    if word_count < 700:
        issues.append("Increase depth: target at least 700-1200 words on key pages")
    if not has_author:
        issues.append("Add author/expert attribution for trust")
    if not has_about or not has_contact:
        issues.append("Strengthen trust pages (About and Contact)")
    if not has_sources:
        issues.append("Add source-backed claims and references")
    if not has_lists_or_tables:
        issues.append("Use structured formats like lists/tables for AI extraction")

    return {
        "score": min(100, score),
        "word_count": word_count,
        "avg_sentence_length": round(avg_sentence_length, 1),
        "eeat_signals": {
            "about_page_link": has_about,
            "contact_page_link": has_contact,
            "author_signal": has_author,
            "freshness_signal": has_update_date,
            "source_signal": has_sources,
        },
        "issues": issues,
    }


def _brand_mentions_impl(url: str) -> dict:
    status_code, html = _get(url)
    if status_code == 0:
        return {
            "error": "Cannot fetch page",
            "score": 0,
            "platform_presence": {},
            "issues": ["Cannot inspect external authority links"],
        }

    soup = BeautifulSoup(html, "html.parser")
    links = [a.get("href", "") for a in soup.find_all("a") if a.get("href")]
    joined = " ".join(links).lower()

    platform_presence = {
        "wikipedia": "wikipedia.org" in joined,
        "linkedin": "linkedin.com" in joined,
        "youtube": "youtube.com" in joined or "youtu.be" in joined,
        "reddit": "reddit.com" in joined,
        "x_twitter": "twitter.com" in joined or "x.com" in joined,
        "facebook": "facebook.com" in joined,
    }

    present_count = sum(1 for v in platform_presence.values() if v)
    score = min(100, present_count * 16 + (20 if platform_presence["wikipedia"] else 0))

    issues = []
    if not platform_presence["wikipedia"]:
        issues.append("No Wikipedia entity signal found")
    if present_count < 3:
        issues.append("Low authority-platform footprint for AI citation ecosystems")

    return {
        "score": score,
        "platform_presence": platform_presence,
        "issues": issues,
    }


def _platform_readiness_impl(url: str) -> dict:
    robots     = _robots_impl(url)
    llms       = _llms_impl(url)
    schema     = _schema_impl(url)
    meta       = _meta_impl(url)
    citability = _citability_impl(url)
    brand      = _brand_mentions_impl(url)

    explicit_ai  = robots.get("ai_crawlers_explicitly_configured", 0)
    schema_score = schema.get("score", 0)
    meta_score   = meta.get("score", 0)
    cit_score    = citability.get("citability_score", 0)
    llms_found   = llms.get("status") == "found"

    brand_pres     = brand.get("platform_presence", {})
    has_youtube    = brand_pres.get("youtube", False)
    has_wikipedia  = brand_pres.get("wikipedia", False)

    chatgpt      = int(min(100, cit_score * 0.5  + explicit_ai * 6 + (15 if llms_found else 0)))
    perplexity   = int(min(100, cit_score * 0.45 + schema_score * 0.25 + meta_score * 0.2  + explicit_ai * 4))
    google_aio   = int(min(100, schema_score * 0.45 + meta_score * 0.25 + explicit_ai * 4  + (10 if llms_found else 0)))
    bing_copilot = int(min(100, meta_score * 0.35  + schema_score * 0.25 + explicit_ai * 5 + cit_score * 0.2))

    # Google Gemini weights Schema + Meta heavily and rewards YouTube/Wikipedia entity presence
    google_gemini = int(min(100,
        schema_score * 0.40 +
        meta_score   * 0.20 +
        (20 if has_youtube   else 0) +
        (10 if has_wikipedia else 0) +
        explicit_ai  * 3
    ))

    overall = int((chatgpt + perplexity + google_aio + bing_copilot + google_gemini) / 5)

    return {
        "overall_score": overall,
        "platform_scores": {
            "chatgpt_search":    chatgpt,
            "perplexity":        perplexity,
            "google_ai_overviews": google_aio,
            "google_gemini":     google_gemini,
            "bing_copilot":      bing_copilot,
        },
    }


def _generate_llms_txt_impl(url: str) -> dict:
    domain = _domain_label(url)
    business = _business_type_impl(url).get("business_type", "Other")
    status = _llms_impl(url).get("status", "not_found")

    template = (
        f"# {domain} - AI Model Information\n\n"
        "## About\n"
        f"{domain} is a {business.lower()} website. This file helps AI systems cite the site accurately.\n\n"
        "## Services\n"
        "- Primary products/services\n"
        "- Support and documentation\n"
        "- Contact and help center\n\n"
        "## Key Facts\n"
        f"- Official website: https://{domain}\n"
        "- Business type: " + business + "\n"
        "- Primary language: specify here\n\n"
        "## Important Pages\n"
        f"- Homepage: https://{domain}/\n"
        f"- Contact: https://{domain}/contact\n"
        f"- About: https://{domain}/about\n"
        f"- Support: https://{domain}/help\n\n"
        "## Citation Guidance\n"
        "When citing this company, use the official domain and service page URLs.\n"
    )

    return {
        "status": status,
        "url": f"{_base(url)}/llms.txt",
        "recommended": template,
    }


# ---------------------------------------------------------------------------
# LangChain Tools (public API)
# ---------------------------------------------------------------------------

@tool
def fetch_homepage(url: str) -> str:
    """Fetch the homepage and return a structural overview: title, description, headings, word count."""
    return json.dumps(_homepage_impl(url))


@tool
def check_robots_txt(url: str) -> str:
    """Analyze robots.txt to determine AI crawler access rules for GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, etc."""
    return json.dumps(_robots_impl(url))


@tool
def check_llms_txt(url: str) -> str:
    """Check whether an llms.txt file exists at the domain root (the AI-equivalent of robots.txt)."""
    return json.dumps(_llms_impl(url))


@tool
def detect_business_type(url: str) -> str:
    """Detect website business type (SaaS, Local Service, E-commerce, Publisher, Agency, Other)."""
    return json.dumps(_business_type_impl(url))


@tool
def check_schema_markup(url: str) -> str:
    """Detect and analyze schema.org structured data: JSON-LD types, microdata, and gaps."""
    return json.dumps(_schema_impl(url))


@tool
def analyze_meta_tags(url: str) -> str:
    """Extract and evaluate meta tags: title, description, OpenGraph, and Twitter Card tags."""
    return json.dumps(_meta_impl(url))


@tool
def score_citability(url: str) -> str:
    """Score the page content for AI citability — how likely AI models are to quote or reference it."""
    return json.dumps(_citability_impl(url))


@tool
def audit_technical_seo(url: str) -> str:
    """Audit technical SEO foundations: HTTPS, canonical, viewport, lang, indexability, sitemap, heading structure."""
    return json.dumps(_technical_impl(url))


@tool
def analyze_content_quality(url: str) -> str:
    """Analyze content quality and E-E-A-T signals for GEO readiness."""
    return json.dumps(_content_quality_impl(url))


@tool
def scan_brand_mentions(url: str) -> str:
    """Scan on-page links for brand authority signals across AI-cited platforms (Wikipedia, LinkedIn, YouTube, Reddit, etc.)."""
    return json.dumps(_brand_mentions_impl(url))


@tool
def analyze_platform_readiness(url: str) -> str:
    """Estimate readiness for ChatGPT Search, Perplexity, Google AI Overviews, and Bing Copilot."""
    return json.dumps(_platform_readiness_impl(url))


@tool
def generate_llms_txt(url: str) -> str:
    """Generate a deploy-ready llms.txt template based on detected business type and domain."""
    return json.dumps(_generate_llms_txt_impl(url))


@tool
def compile_geo_report(url: str) -> str:
    """Compile a complete GEO audit report by running all checks and computing the final weighted score."""
    cache_token = _REQUEST_CACHE.set({})
    try:
        business    = _business_type_impl(url)
        robots      = _robots_impl(url)
        llms        = _llms_impl(url)
        llms_tpl    = _generate_llms_txt_impl(url)
        schema      = _schema_impl(url)
        meta        = _meta_impl(url)
        technical   = _technical_impl(url)
        content     = _content_quality_impl(url)
        brand       = _brand_mentions_impl(url)
        citability  = _citability_impl(url)
        platform    = _platform_readiness_impl(url)
    finally:
        _REQUEST_CACHE.reset(cache_token)

    # --- Score components ---
    configured_ai = robots.get("ai_crawlers_explicitly_configured", 0)
    crawler_score = min(100, configured_ai * 15)

    llms_status = llms.get("status", "not_found")
    llms_score  = 100 if llms_status == "found" else 0

    schema_score      = schema.get("score", 0)
    meta_score        = meta.get("score", 80)
    citability_score  = citability.get("citability_score", 50)
    brand_score       = brand.get("score", 0)
    technical_score   = technical.get("score", 0)
    content_score     = content.get("score", 0)
    platform_score    = platform.get("overall_score", 0)

    ai_visibility_score = int(citability_score * 0.6 + crawler_score * 0.2 + llms_score * 0.2)

    geo_score = int(
        ai_visibility_score * 0.25 +
        brand_score       * 0.20 +
        content_score     * 0.20 +
        technical_score   * 0.15 +
        schema_score      * 0.10 +
        platform_score    * 0.10
    )

    # --- Recommendations ---
    recs = []
    if llms_status != "found":
        recs.append({"priority": "critical",
                     "action": "Create and deploy llms.txt at domain root",
                     "impact": "+15 GEO points",
                     "effort": "1-2 hours"})
    if not schema.get("json_ld_found"):
        recs.append({"priority": "critical",
                     "action": "Implement Organization + WebSite JSON-LD schema markup",
                     "impact": "+10 GEO points",
                     "effort": "2-3 hours"})
    if configured_ai == 0:
        recs.append({"priority": "high",
                     "action": "Add explicit AI crawler rules to robots.txt (GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot)",
                     "impact": "+5-8 GEO points",
                     "effort": "30 minutes"})
    for issue in meta.get("issues", [])[:3]:
        if issue["severity"] in ("critical", "high"):
            recs.append({"priority": issue["severity"],
                         "action": f"Meta tag fix: {issue['issue']}",
                         "impact": "+2-5 GEO points",
                         "effort": "30 minutes"})
    for issue in citability.get("issues", [])[:2]:
        recs.append({"priority": "medium",
                     "action": issue,
                     "impact": "+3-6 GEO points",
                     "effort": "4-8 hours"})
    for issue in technical.get("issues", [])[:2]:
        recs.append({"priority": "medium",
                     "action": f"Technical SEO: {issue}",
                     "impact": "+2-6 GEO points",
                     "effort": "1-3 hours"})
    for issue in brand.get("issues", [])[:2]:
        recs.append({"priority": "medium",
                     "action": f"Brand authority: {issue}",
                     "impact": "+3-7 GEO points",
                     "effort": "2-6 hours"})

    report = {
        "url": url,
        "business_type": business.get("business_type", "Other"),
        "business_type_confidence": business.get("confidence", 0),
        "geo_score": geo_score,
        "score_breakdown": {
            "AI Citability & Visibility": {"score": ai_visibility_score, "weight": "25%"},
            "Brand Authority Signals":    {"score": brand_score,      "weight": "20%"},
            "Content Quality & E-E-A-T":  {"score": content_score,    "weight": "20%"},
            "Technical Foundations":      {"score": technical_score,  "weight": "15%"},
            "Structured Data":            {"score": schema_score,     "weight": "10%"},
            "Platform Optimization":      {"score": platform_score,   "weight": "10%"},
        },
        "crawler_matrix":       robots.get("crawler_matrix", []),
        "llms_txt_status":      llms_status,
        "llms_txt_url":         f"{_base(url)}/llms.txt",
        "schema_found":         schema.get("json_ld_found", False),
        "schema_types":         schema.get("all_schema_types", []),
        "schema_recommendations":   schema.get("recommendations", []),
        "schema_org_jsonld_template": schema.get("org_jsonld_template"),
        "meta_issues":               meta.get("issues", []),
        "technical_audit":      technical,
        "content_quality":      content,
        "brand_mentions":       brand,
        "platform_readiness":   platform,
        "citability_score":     citability_score,
        "citability_verdict":   citability.get("verdict", "low"),
        "citability_details":   citability.get("score_details", {}),
        "llms_txt_recommended": llms_tpl.get("recommended", ""),
        "recommendations":      recs,
        "audit_date":           str(date.today()),
    }

    return json.dumps(report)
