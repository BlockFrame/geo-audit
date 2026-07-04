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
const scoreTone = (value: number) => {
  if (value >= 70) {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  }

  if (value >= 45) {
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }

  return "border-rose-300/30 bg-rose-400/10 text-rose-100";
};

export default function VerboseReportPanel({ report, locale = "en" }: Props) {
  const breakdown = Object.entries(report.score_breakdown ?? {});
  const platformScores = Object.entries(report.platform_readiness?.platform_scores ?? {});
  const platformComponent = report.score_breakdown?.["Platform Optimization"];
  const breakdownMap = report.score_breakdown ?? {};

  const componentConfig = [
    {
      key: "AI Citability & Visibility",
      explainability:
        "Composite score used in GEO formula, built from citability score, crawler accessibility, and llms.txt readiness.",
    },
    {
      key: "Brand Authority Signals",
      explainability:
        "Score from authority-platform presence and entity trust signals extracted by the brand analysis module.",
    },
    {
      key: "Content Quality & E-E-A-T",
      explainability:
        "Score from content depth, readability, and E-E-A-T indicators (author/source/trust/freshness signals).",
    },
    {
      key: "Technical Foundations",
      explainability:
        "Score from technical checks (indexability, rendering, metadata, security headers, and performance/indexing factors).",
    },
    {
      key: "Structured Data",
      explainability:
        "Score from structured data detection/coverage and schema remediation analysis.",
    },
    {
      key: "Platform Optimization",
      explainability:
        "Score from AI platform readiness analysis used directly in final GEO computation.",
    },
  ] as const;

  const topMetrics = componentConfig.map((item) => {
    const entry = breakdownMap[item.key];
    const score = typeof entry?.score === "number" ? Math.max(0, Math.min(100, entry.score)) : undefined;
    return {
      label: item.key,
      value: typeof score === "number" ? `${score}/100` : "n/a",
      weight: entry?.weight ?? "n/a",
      explainability: item.explainability,
    };
  });

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <div className="glass-panel-strong rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Full verbose report</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">Detailed GEO audit</h2>
                <ExplainabilityHint
                  label="How detailed GEO audit metrics are calculated"
                  description="These KPI cards map 1:1 to the backend score_breakdown components that directly compose the final GEO score. Each card shows exact component score and weight used in the weighted formula."
                />
              </div>
            </div>
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-300/80">GEO score total</p>
              <p className="text-xl font-semibold text-cyan-100 sm:text-2xl">
                {typeof report.geo_score === "number" ? report.geo_score : "n/a"}
                <span className="text-sm text-slate-300/80">/100</span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-300/80">
            Consolidated view of the final report with direct GEO scoring components.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {topMetrics.map((metric) => (
              <div key={metric.label} className="glass-chip rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">{metric.label}</p>
                  <ExplainabilityHint
                    label={`How ${metric.label} is calculated`}
                    description={metric.explainability}
                  />
                </div>
                <p className="mt-1.5 text-xl font-semibold text-slate-100">{metric.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Weight: {metric.weight}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel-strong rounded-2xl p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Score Breakdown</h3>
          <div className="mt-4 space-y-2.5">
            {breakdown.length === 0 && <p className="text-sm text-slate-400">No data available.</p>}
            {breakdown.map(([label, details]) => {
              const value = scoreValue(details?.score);
              const tone = scoreTone(value);
              return (
                <div key={label} className={`rounded-xl border px-3 py-2.5 ${tone}`}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-sm">{label}</span>
                    <span className="text-xs">{value}/100 · {details?.weight ?? "n/a"}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900/35">
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
        </div>

        <div className="space-y-5 xl:col-span-4">
          <div className="h-full">
            <ReportDownloads report={report} locale={locale} />
          </div>
          <div className="glass-panel-strong rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Platform Optimization</h3>
              {typeof platformComponent?.score === "number" && (
                <span className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                  {platformComponent.score}/100{platformComponent.weight ? ` · ${platformComponent.weight}` : ""}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">AI platform readiness breakdown</p>
            <div className="mt-4 space-y-3">
              {platformScores.length === 0 && <p className="text-sm text-slate-400">No data available.</p>}
              {platformScores.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-slate-200">{label}</span>
                      <ExplainabilityHint
                        label={`How ${label} platform KPI is calculated`}
                        description={`${label} readiness is one of the platform-level sub-KPIs. It contributes to the Platform Optimization component used in the final GEO score.`}
                      />
                    </div>
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
      </div>
    </section>
  );
}