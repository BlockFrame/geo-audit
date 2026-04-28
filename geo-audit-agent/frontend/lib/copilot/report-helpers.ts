import { GeoReport, Recommendation } from "@/lib/types";

const GEO_FOCUS_KEYWORDS: Record<string, string[]> = {
  quick_wins: ["30 minutes", "1-2 hours"],
  technical: ["technical seo", "hsts", "x-frame-options", "viewport", "canonical", "ssr", "indexnow"],
  content: ["faq", "content", "statistics", "tables", "author", "source", "depth"],
  schema: ["json-ld", "schema", "website", "organization", "breadcrumb", "faqpage"],
  authority: ["brand authority", "wikipedia", "linkedin", "youtube", "authority-platform"],
  crawlers: ["robots.txt", "crawler", "gptbot", "claudebot", "oai-searchbot", "perplexitybot"],
  llms: ["llms.txt"],
  platforms: ["gemini", "perplexity", "chatgpt", "bing copilot", "google ai"],
};

export function filterRecommendations(
  recommendations: Recommendation[],
  focus: string,
  maxItems: number,
): Recommendation[] {
  const normalizedFocus = focus.toLowerCase();

  if (normalizedFocus === "all") {
    return recommendations.slice(0, maxItems);
  }

  const keywords = GEO_FOCUS_KEYWORDS[normalizedFocus] ?? [];
  const filtered = recommendations.filter((item) => {
    const haystack = `${item.action} ${item.impact} ${item.effort}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  return (filtered.length > 0 ? filtered : recommendations).slice(0, maxItems);
}

export function extractPlatformGaps(report: GeoReport, platform: string) {
  const blockers: string[] = [];
  const actions: string[] = [];
  const platformScores = report.platform_readiness?.platform_scores ?? {};
  const score = platformScores[platform] ?? 0;
  const explicitCrawlerRules = report.crawler_matrix?.filter((item) => item.explicitly_configured).length ?? 0;
  const hasWikipedia = report.brand_mentions?.platform_presence?.wikipedia ?? false;
  const hasYoutube = report.brand_mentions?.platform_presence?.youtube ?? false;
  const highMetaIssues = (report.meta_issues ?? []).filter((item) => ["critical", "high"].includes(item.severity));

  if (report.llms_txt_status !== "found") {
    blockers.push("llms.txt missing or inaccessible");
    actions.push("Publish llms.txt at the domain root to improve AI retrieval confidence.");
  }

  if (!report.schema_found) {
    blockers.push("Structured data coverage is weak");
    actions.push("Implement Organization + WebSite JSON-LD before optimizing long-tail features.");
  }

  if (explicitCrawlerRules === 0) {
    blockers.push("No explicit AI crawler rules in robots.txt");
    actions.push("Add explicit robots.txt rules for GPTBot, ClaudeBot, OAI-SearchBot, and PerplexityBot.");
  }

  if (highMetaIssues.length > 0) {
    blockers.push(`${highMetaIssues.length} critical/high metadata issues detected`);
    actions.push("Fix title, description, OG, and Twitter preview issues to improve answer previews.");
  }

  if ((platform === "google_gemini" || platform === "google_ai_overviews") && !hasYoutube) {
    blockers.push("No YouTube entity signal detected");
    actions.push("Strengthen YouTube presence or connect the brand entity to Google-owned surfaces.");
  }

  if ((platform === "google_gemini" || platform === "chatgpt_search") && !hasWikipedia) {
    blockers.push("No Wikipedia entity signal detected");
    actions.push("Improve entity consistency across Wikipedia/Wikidata/LinkedIn when appropriate.");
  }

  if ((report.technical_audit?.checks?.ssr_ok as boolean | undefined) === false) {
    blockers.push("SSR/HTML rendering is weak for AI crawlers");
    actions.push("Ensure server-rendered HTML exposes the main content to crawlers.");
  }

  return {
    platform,
    score,
    blockers: blockers.slice(0, 5),
    recommendedActions: actions.slice(0, 5),
  };
}

export function buildReadableReportContext(
  report: GeoReport | undefined,
  status: string,
  url: string,
) {
  return report ?? {
    available: false,
    status,
    url,
  };
}