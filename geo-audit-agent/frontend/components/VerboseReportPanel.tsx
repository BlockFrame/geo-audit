"use client";

import ReportDownloads from "@/components/ReportDownloads";
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

  const topMetrics = [
    { label: "GEO Score", value: `${report.geo_score ?? "n/a"}/100` },
    { label: "Citability", value: `${report.citability_score ?? "n/a"}/100` },
    { label: "Technical", value: `${report.technical_audit?.score ?? "n/a"}/100` },
    { label: "Content", value: `${report.content_quality?.score ?? "n/a"}/100` },
  ];

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">Full verbose report</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-100 sm:text-xl">Detailed GEO audit</h2>
          <p className="mt-2 text-sm text-slate-300/80">
            Consolidated view of the final report with score breakdown, platform readiness, and direct export access.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3 lg:grid-cols-4">
            {topMetrics.map((metric) => (
              <div key={metric.label} className="glass-chip rounded-xl px-3 py-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full max-w-full lg:max-w-md">
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
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">AI Platform Readiness</h3>
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