"use client";

import ReportDownloads from "@/components/ReportDownloads";
import ExplainabilityHint from "@/components/ui/explainability-hint";
import { GeoReport } from "@/lib/types";

type Props = {
  report: GeoReport;
  locale?: "it" | "en";
};

const getBarColor = (value: number) => {
  if (value >= 70) {
    return "#2dd4bf";
  }

  if (value >= 45) {
    return "#fbbf24";
  }

  return "#fb7185";
};

const scoreValue = (value: number | undefined) => value ?? 0;

export default function VerboseReportPanel({ report, locale = "en" }: Props) {
  const breakdown = Object.entries(report.score_breakdown ?? {});
  const platformScores = Object.entries(report.platform_readiness?.platform_scores ?? {});
  const platformComponent = report.score_breakdown?.["Platform Optimization"];

  const topMetrics = [
    {
      label: "GEO Score",
      value: `${report.geo_score ?? "n/a"}/100`,
      explainability:
        "Final weighted GEO score from the backend score breakdown: AI Citability & Visibility 25%, Brand Authority Signals 20%, Content Quality & E-E-A-T 20%, Technical Foundations 15%, Structured Data 10%, Platform Optimization 10%.",
    },
    {
      label: "Citability",
      value: `${report.citability_score ?? "n/a"}/100`,
      explainability:
        "Weighted citability score from six 0-10 sub-signals: answer passages 25%, factual density 20%, authority signals 20%, content length 15%, structured content 10%, and unique data 10%.",
    },
    {
      label: "Technical",
      value: `${report.technical_audit?.score ?? "n/a"}/100`,
      explainability:
        "Technical score from weighted checks: HTTPS 10, viewport 8, canonical 8, lang 5, indexable 12, sitemap 5, H1 up to 8, security headers up to 10, SSR up to 15, CLS stability 5, and IndexNow 5. Total is capped at 100.",
    },
    {
      label: "Content",
      value: `${report.content_quality?.score ?? "n/a"}/100`,
      explainability:
        "Content score from the content-quality analyzer: word count depth up to 30 points, sentence readability up to 20, five E-E-A-T signals up to 40 total, and lists/tables 10. Shows n/a when content_quality.score is missing from the report.",
    },
  ];

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.95fr)]">
        <div className="glass-panel-strong rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Full verbose report</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">Detailed GEO audit</h2>
                <ExplainabilityHint
                  label="How detailed GEO audit metrics are calculated"
                  description="The four KPI cards below read directly from report fields: geo_score, citability_score, technical_audit.score, and content_quality.score. Hover each card icon for the exact formula behind that metric."
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-300/80">
            Consolidated view of the final report with score breakdown, platform readiness, and direct export access.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3 lg:grid-cols-4">
            {topMetrics.map((metric) => (
              <div key={metric.label} className="glass-chip rounded-xl px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">{metric.label}</p>
                  <ExplainabilityHint
                    label={`How ${metric.label} is calculated`}
                    description={metric.explainability}
                  />
                </div>
                <p className="mt-1 text-lg font-semibold text-slate-100">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-full">
          <ReportDownloads report={report} locale={locale} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="glass-panel-strong rounded-2xl p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Score Breakdown</h3>
          <div className="mt-4 space-y-3">
            {breakdown.length === 0 && <p className="text-sm text-slate-400">No data available.</p>}
            {breakdown.map(([label, details]) => {
              const value = scoreValue(details?.score);
              return (
                <div key={label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="text-sm text-slate-200">{label}</span>
                    <span className="text-xs text-slate-400">{value}/100 · {details?.weight ?? "n/a"}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700/40">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${value}%`, backgroundColor: getBarColor(value) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel-strong rounded-2xl p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">AI Platform Readiness</h3>
            {typeof platformComponent?.score === "number" && (
              <span className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                {platformComponent.score}/100{platformComponent.weight ? ` · ${platformComponent.weight}` : ""}
              </span>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {platformScores.length === 0 && <p className="text-sm text-slate-400">No data available.</p>}
            {platformScores.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-sm text-slate-200">{label}</span>
                  <span className="text-xs text-slate-400">{value}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700/40">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, backgroundColor: getBarColor(value) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}