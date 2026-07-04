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
const scoreTag = (value: number) => {
  if (value >= 70) {
    return "Strength";
  }

  if (value >= 45) {
    return "Watch";
  }

  return "Weakness";
};

export default function VerboseReportPanel({ report, locale = "en" }: Props) {
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
  const orderedBreakdown = [
    ...componentConfig
      .map((item) => [item.key, breakdownMap[item.key]] as const)
      .filter(([, details]) => details && typeof details.score === "number"),
    ...Object.entries(breakdownMap).filter(
      ([label]) => !componentConfig.some((component) => component.key === label),
    ),
  ];
  const chartItems = orderedBreakdown.map(([label, details]) => ({
    label,
    value: scoreValue(details?.score),
    weight: details?.weight ?? "n/a",
  }));
  const radarItems = chartItems.slice(0, 6);
  const radarSize = 260;
  const radarCenter = radarSize / 2;
  const radarMaxRadius = 82;
  const radarLabelRadius = 110;
  const pointFor = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const radius = (Math.max(0, Math.min(100, value)) / 100) * radarMaxRadius;
    const x = radarCenter + Math.cos(angle) * radius;
    const y = radarCenter + Math.sin(angle) * radius;
    return { x, y };
  };
  const axisFor = (index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const x = radarCenter + Math.cos(angle) * radarLabelRadius;
    const y = radarCenter + Math.sin(angle) * radarLabelRadius;
    return { x, y };
  };
  const levelPolygon = (level: number) => {
    const radius = radarMaxRadius * level;
    return radarItems
      .map((_, index) => {
        const angle = (Math.PI * 2 * index) / radarItems.length - Math.PI / 2;
        const x = radarCenter + Math.cos(angle) * radius;
        const y = radarCenter + Math.sin(angle) * radius;
        return `${x},${y}`;
      })
      .join(" ");
  };
  const radarPolygon = radarItems
    .map((item, index) => {
      const point = pointFor(item.value, index, radarItems.length);
      return `${point.x},${point.y}`;
    })
    .join(" ");
  const radarLabels = radarItems.map((item, index) => {
    const axis = axisFor(index, radarItems.length);
    return {
      ...item,
      left: `${(axis.x / radarSize) * 100}%`,
      top: `${(axis.y / radarSize) * 100}%`,
      tag: scoreTag(item.value),
      tone: scoreTone(item.value),
    };
  });

  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="glass-panel-strong h-full rounded-2xl p-5">
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
                <div key={metric.label} className="glass-chip flex h-full flex-col rounded-xl px-4 py-3.5">
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
        </div>
        <div className="xl:col-span-4">
          <ReportDownloads report={report} locale={locale} className="h-full" />
        </div>
        <div className="xl:col-span-12">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="glass-panel-strong rounded-2xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Score Breakdown</h3>
              <div className="mt-4 space-y-2.5">
                {orderedBreakdown.length === 0 && <p className="text-sm text-slate-400">No data available.</p>}
                {orderedBreakdown.map(([label, details]) => {
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
            <div className="glass-panel-strong rounded-2xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Score Shape</h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Radar of the same components, with labels around the chart to show strengths and weaknesses.
              </p>
              {radarItems.length >= 3 ? (
                <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/35 p-3 sm:p-5">
                  <div className="relative mx-auto aspect-square w-full max-w-[540px]">
                    <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="h-full w-full">
                      {[0.25, 0.5, 0.75, 1].map((level) => (
                        <polygon
                          key={level}
                          points={levelPolygon(level)}
                          fill="none"
                          stroke="rgba(148,163,184,0.2)"
                          strokeWidth="1"
                        />
                      ))}
                      {radarItems.map((_, index) => {
                        const axis = axisFor(index, radarItems.length);
                        return (
                          <line
                            key={index}
                            x1={radarCenter}
                            y1={radarCenter}
                            x2={axis.x}
                            y2={axis.y}
                            stroke="rgba(148,163,184,0.25)"
                            strokeWidth="1"
                          />
                        );
                      })}
                      <polygon points={radarPolygon} fill="rgba(45,212,191,0.25)" stroke="#2dd4bf" strokeWidth="2" />
                      {radarItems.map((item, index) => {
                        const point = pointFor(item.value, index, radarItems.length);
                        return <circle key={item.label} cx={point.x} cy={point.y} r="3.5" fill="#67e8f9" />;
                      })}
                    </svg>
                    <div className="pointer-events-none absolute inset-0">
                      {radarLabels.map((item) => (
                        <div
                          key={item.label}
                          className={`absolute w-36 -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2 py-1.5 text-center ${item.tone}`}
                          style={{ left: item.left, top: item.top }}
                        >
                          <p className="text-[10px] leading-tight">{item.label}</p>
                          <p className="mt-0.5 text-[10px] font-semibold">
                            {item.value}/100 · {item.tag}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">Not enough data to render chart.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}