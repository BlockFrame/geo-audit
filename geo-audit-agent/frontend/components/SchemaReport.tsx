"use client";

import ExplainabilityHint from "@/components/ui/explainability-hint";

type Props = {
  found: boolean;
  types: string[];
  recommendations: string[];
  orgJsonldTemplate?: Record<string, unknown> | null;
  impactScore?: number;
  impactWeight?: string;
  locale?: "it" | "en";
};
const SCORE_COLOR = (s: number) =>
  s >= 70 ? "#2dd4bf" : s >= 45 ? "#fbbf24" : "#fb7185";

export default function SchemaReport({ found, types, recommendations, orgJsonldTemplate, impactScore, impactWeight, locale = "en" }: Props) {
  const labels = {
    title: "Structured Data",
    found: "✓ JSON-LD Detected",
    notFound: "✗ JSON-LD Missing",
    types: "Detected types:",
    recs: "Recommendations:",
    tplTitle: "Generated Organization JSON-LD template",
    tplHint: "Paste this snippet inside your site's <head>",
    empty: "No data available.",
  };
  const displayScore = typeof impactScore === "number" ? impactScore : 0;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {labels.title}
        </h2>
        <div className="flex items-center gap-2">
          <ExplainabilityHint
            label="How schema metrics are calculated"
            description={`Structured Data shown here is the direct GEO component from score_breakdown (${displayScore}/100${impactWeight ? `, ${impactWeight}` : ""}), based on JSON-LD detection, schema coverage, and remediation analysis.`}
          />
          <span className="text-2xl font-bold" style={{ color: SCORE_COLOR(displayScore) }}>
            {displayScore}<span className="text-sm text-slate-400">/100</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {found ? "found" : "missing"} · {types.length} types
          </span>
        </div>
      </div>

      {/* JSON-LD status */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`text-xs px-2 py-1 rounded border ${found
            ? "bg-emerald-400/20 text-emerald-100 border-emerald-300/35"
            : "bg-rose-400/20 text-rose-100 border-rose-300/35"
            }`}
        >
          {found ? labels.found : labels.notFound}
        </span>
      </div>

      {/* Found types */}
      {types.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2">{labels.types}</p>
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <span
                key={t}
                className="glass-chip text-cyan-100 text-xs px-2 py-0.5 rounded font-mono"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">{labels.recs}</p>
          <ul className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-100">
                <span className="shrink-0 mt-0.5">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generated JSON-LD Organization template */}
      {orgJsonldTemplate && (
        <div className="mt-4">
          <p className="text-xs text-slate-400 mb-1">{labels.tplTitle}</p>
          <pre className="text-[11px] text-emerald-100 bg-slate-900/60 border border-emerald-400/20 rounded-lg p-3 overflow-x-auto max-h-52 leading-relaxed">
            {JSON.stringify(orgJsonldTemplate, null, 2)}
          </pre>
          <p className="text-[10px] text-slate-400/70 mt-1">💡 {labels.tplHint}</p>
        </div>
      )}

      {types.length === 0 && recommendations.length === 0 && !orgJsonldTemplate && (
        <p className="text-xs text-slate-400">{labels.empty}</p>
      )}
    </div>
  );
}
