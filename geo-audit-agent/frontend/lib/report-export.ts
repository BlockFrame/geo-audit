import { GeoReport } from "@/lib/types";

const yesNo = (value: boolean | number | string | undefined) => {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === undefined || value === null || value === "") {
    return "n/a";
  }

  return String(value);
};

const formatNumber = (value: number | undefined) => (
  value === undefined || Number.isNaN(value) ? "n/a" : String(value)
);

const escapePipes = (value: string) => value.replace(/\|/g, "\\|");

const table = (headers: string[], rows: string[][]) => {
  if (rows.length === 0) {
    return "";
  }

  const head = `| ${headers.map(escapePipes).join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => escapePipes(cell)).join(" | ")} |`).join("\n");
  return [head, separator, body].join("\n");
};

const bullets = (items: string[] | undefined) => {
  if (!items || items.length === 0) {
    return "- None\n";
  }

  return `${items.map((item) => `- ${item}`).join("\n")}\n`;
};

const recommendationBullets = (report: GeoReport) => {
  if (!report.recommendations || report.recommendations.length === 0) {
    return "- None\n";
  }

  return `${report.recommendations
    .map((recommendation) => {
      const priority = recommendation.priority.toUpperCase();
      return `- [${priority}] ${recommendation.action} | Impact: ${recommendation.impact} | Effort: ${recommendation.effort}`;
    })
    .join("\n")}\n`;
};

export const createReportFileNameBase = (report: GeoReport) => {
  const rawHost = report.url
    ? (() => {
      try {
        return new URL(report.url).hostname;
      } catch {
        return report.url;
      }
    })()
    : "geo-audit-report";

  const slug = rawHost
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const date = (report.audit_date ?? new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, "");
  return `${slug || "geo-audit-report"}-${date}`;
};

export const buildVerboseReportMarkdown = (report: GeoReport) => {
  const scoreBreakdownRows = Object.entries(report.score_breakdown ?? {}).map(([category, details]) => [
    category,
    formatNumber(details?.score),
    details?.weight ?? "n/a",
  ]);

  const crawlerRows = (report.crawler_matrix ?? []).map((crawler) => [
    crawler.name,
    crawler.company,
    crawler.type,
    crawler.access,
    crawler.explicitly_configured ? "Yes" : "No",
    crawler.rules?.join(", ") || "-",
  ]);

  const metaRows = (report.meta_issues ?? []).map((issue) => [issue.severity, issue.issue]);
  const technicalChecksRows = Object.entries(report.technical_audit?.checks ?? {}).map(([check, value]) => [check, yesNo(value)]);
  const eeatRows = Object.entries(report.content_quality?.eeat_signals ?? {}).map(([signal, value]) => [signal, yesNo(value)]);
  const brandRows = Object.entries(report.brand_mentions?.platform_presence ?? {}).map(([platform, value]) => [platform, yesNo(value)]);
  const platformRows = Object.entries(report.platform_readiness?.platform_scores ?? {}).map(([platform, score]) => [platform, formatNumber(score)]);

  const sections = [
    `# GEO Audit Report`,
    "",
    `Generated from the complete audit payload with the full verbose output structure used by the app.`,
    "",
    `## Executive Summary`,
    "",
    `- URL: ${report.url ?? "n/a"}`,
    `- Audit date: ${report.audit_date ?? "n/a"}`,
    `- GEO score: ${formatNumber(report.geo_score)}/100`,
    `- Business type: ${report.business_type ?? "n/a"}`,
    `- Business type confidence: ${formatNumber(report.business_type_confidence)}`,
    `- llms.txt status: ${report.llms_txt_status ?? "n/a"}`,
    `- llms.txt URL: ${report.llms_txt_url ?? "n/a"}`,
    `- JSON-LD found: ${report.schema_found ? "Yes" : "No"}`,
    `- Citability score: ${formatNumber(report.citability_score)}/100`,
    `- Platform readiness: ${formatNumber(report.platform_readiness?.overall_score)}/100`,
    "",
    `## Score Breakdown`,
    "",
    table(["Category", "Score", "Weight"], scoreBreakdownRows) || "No score breakdown available.",
    "",
    `## Prioritized Action Plan`,
    "",
    recommendationBullets(report),
    "",
    `## AI Crawler Access Matrix`,
    "",
    table(["Crawler", "Company", "Type", "Access", "Configured", "Rules"], crawlerRows) || "No crawler data available.",
    "",
    `## llms.txt`,
    "",
    `Status: ${report.llms_txt_status ?? "n/a"}`,
    "",
    "```text",
    report.llms_txt_recommended ?? "No llms.txt recommendation available.",
    "```",
    "",
    `## Schema Markup`,
    "",
    `- Found: ${report.schema_found ? "Yes" : "No"}`,
    `- Types: ${report.schema_types?.join(", ") || "None"}`,
    "",
    bullets(report.schema_recommendations),
    "",
    `## Meta Issues`,
    "",
    table(["Severity", "Issue"], metaRows) || "No meta issues available.",
    "",
    `## Technical SEO`,
    "",
    `- Technical score: ${formatNumber(report.technical_audit?.score)}/100`,
    "",
    table(["Check", "Value"], technicalChecksRows) || "No technical checks available.",
    "",
    bullets(report.technical_audit?.issues),
    "",
    `## Content Quality & E-E-A-T`,
    "",
    `- Content score: ${formatNumber(report.content_quality?.score)}/100`,
    `- Word count: ${formatNumber(report.content_quality?.word_count)}`,
    `- Average sentence length: ${formatNumber(report.content_quality?.avg_sentence_length)}`,
    "",
    table(["Signal", "Present"], eeatRows) || "No E-E-A-T signals available.",
    "",
    bullets(report.content_quality?.issues),
    "",
    `## Brand Authority Signals`,
    "",
    `- Brand authority score: ${formatNumber(report.brand_mentions?.score)}/100`,
    "",
    table(["Platform", "Present"], brandRows) || "No brand authority data available.",
    "",
    bullets(report.brand_mentions?.issues),
    "",
    `## Platform Readiness`,
    "",
    `- Overall platform readiness: ${formatNumber(report.platform_readiness?.overall_score)}/100`,
    "",
    table(["Platform", "Score"], platformRows) || "No platform readiness data available.",
    "",
    `## Appendix: Raw Report JSON`,
    "",
    "```json",
    JSON.stringify(report, null, 2),
    "```",
    "",
  ];

  return sections.join("\n");
};