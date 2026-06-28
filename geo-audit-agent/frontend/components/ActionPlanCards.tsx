"use client";

import { Recommendation } from "@/lib/types";

type Props = { recommendations: Recommendation[]; locale?: "it" | "en" };

const PRIORITY_CONFIG = {
  critical: {
    label: "Critical",
    ring: "border-red-800",
    bg: "bg-red-950/60",
    badge: "bg-red-700 text-white",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    ring: "border-orange-800",
    bg: "bg-orange-950/60",
    badge: "bg-orange-600 text-white",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    ring: "border-yellow-800",
    bg: "bg-yellow-950/60",
    badge: "bg-yellow-600 text-white",
    dot: "bg-yellow-500",
  },
  low: {
    label: "Low",
    ring: "border-blue-800",
    bg: "bg-blue-950/60",
    badge: "bg-blue-700 text-white",
    dot: "bg-blue-500",
  },
} as const;

export default function ActionPlanCards({ recommendations, locale = "en" }: Props) {
  const labels = {
    title: "Prioritized Action Plan",
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  const priorityLabels = {
    critical: labels.critical,
    high: labels.high,
    medium: labels.medium,
    low: labels.low,
  } as const;
  const criticalCount = recommendations.filter((item) => item.priority === "critical").length;
  const highCount = recommendations.filter((item) => item.priority === "high").length;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {labels.title}
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="cursor-help text-xs text-slate-300/80"
            title="Action plan is prioritized from report recommendations using priority, impact, and effort metadata."
            aria-label="How action plan metrics are calculated"
          >
            ℹ
          </span>
          <span className="text-[11px] text-slate-400">
            {criticalCount} critical · {highCount} high
          </span>
        </div>
      </div>

      <ol className="space-y-3">
        {recommendations.map((rec, i) => {
          const cfg = PRIORITY_CONFIG[rec.priority] ?? PRIORITY_CONFIG.low;
          return (
            <li
              key={i}
              className={`border ${cfg.ring} ${cfg.bg} rounded-xl p-4 flex gap-3 backdrop-blur-sm`}
            >
              {/* Number + dot */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-xs text-slate-400 font-mono">{String(i + 1).padStart(2, "0")}</span>
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.badge}`}>
                    {priorityLabels[rec.priority] ?? cfg.label}
                  </span>
                  <span className="text-xs text-slate-300/85">{rec.impact}</span>
                </div>
                <p className="text-sm text-slate-100 leading-snug">{rec.action}</p>
                <p className="text-xs text-slate-400 mt-1">⏱ {rec.effort}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
