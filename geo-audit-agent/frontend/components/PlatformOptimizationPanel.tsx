"use client";

import ExplainabilityHint from "@/components/ui/explainability-hint";
import { PlatformReadiness } from "@/lib/types";

type Props = {
  platform?: PlatformReadiness;
  impactScore?: number;
  impactWeight?: string;
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

export default function PlatformOptimizationPanel({
  platform,
  impactScore,
  impactWeight,
  locale = "en",
}: Props) {
  const entries = Object.entries(platform?.platform_scores ?? {});

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Platform Optimization
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            AI platform readiness breakdown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExplainabilityHint
            label="How platform optimization score is calculated"
            description="Platform Optimization shown here is the direct GEO component from score_breakdown, based on platform readiness sub-KPIs."
          />
          {typeof impactScore === "number" && (
            <span className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
              {impactScore}/100{impactWeight ? ` · ${impactWeight}` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {entries.length === 0 && <p className="text-sm text-slate-400">No data available.</p>}
        {entries.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-slate-200">{label}</span>
                <ExplainabilityHint
                  label={`How ${label} platform KPI is calculated`}
                  description={`${label} readiness is one platform-level KPI that contributes to Platform Optimization in the final GEO score.`}
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
  );
}
