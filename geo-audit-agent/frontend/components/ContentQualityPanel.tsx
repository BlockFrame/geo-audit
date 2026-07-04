"use client";

import ExplainabilityHint from "@/components/ui/explainability-hint";
import { ContentQuality } from "@/lib/types";

type Props = {
  content?: ContentQuality;
  impactScore?: number;
  impactWeight?: string;
  locale?: "it" | "en";
};

const EEAT_LABELS: Record<string, string> = {
  about_page_link: "About page link",
  contact_page_link: "Contact page link",
  author_signal: "Author attribution",
  freshness_signal: "Content freshness",
  source_signal: "Source citations",
};
const SCORE_COLOR = (s: number) =>
  s >= 70 ? "#2dd4bf" : s >= 45 ? "#fbbf24" : "#fb7185";

export default function ContentQualityPanel({
  content,
  impactScore,
  impactWeight,
  locale = "en",
}: Props) {
  const eeat = content?.eeat_signals ?? {};
  const eeatCount = Object.values(eeat).filter(Boolean).length;
  const wordCount = content?.word_count;
  const avgSentenceLength = content?.avg_sentence_length;
  const issues = content?.issues ?? [];
  const displayScore = typeof impactScore === "number" ? impactScore : 0;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Content Quality & E-E-A-T
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Content depth, structure, and trust signals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExplainabilityHint
            label="How content quality score is calculated"
            description={`Content Quality & E-E-A-T shown here is the direct GEO component from score_breakdown (${displayScore}/100${impactWeight ? `, ${impactWeight}` : ""}), informed by depth/readability and E-E-A-T signals.`}
          />
          <span className="text-2xl font-bold" style={{ color: SCORE_COLOR(displayScore) }}>
            {displayScore}<span className="text-sm text-slate-400">/100</span>
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-500/25 bg-slate-900/35 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Word count</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {typeof wordCount === "number" ? wordCount.toLocaleString() : "n/a"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-500/25 bg-slate-900/35 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Avg sentence length</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {typeof avgSentenceLength === "number" ? avgSentenceLength : "n/a"}
          </p>
        </div>
      </div>

      {Object.keys(eeat).length > 0 && (
        <div className="mb-4">
          <p className="mb-2.5 text-[10px] uppercase tracking-wider text-slate-400">
            {`E-E-A-T signals (${eeatCount}/5)`}
          </p>
          <div className="space-y-1.5">
            {Object.entries(eeat).map(([key, val]) => (
              <div
                key={key}
                className={`flex items-center justify-between gap-2 rounded border px-2.5 py-1.5 text-[11px] ${val
                  ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                  : "border-rose-300/20 bg-rose-400/10 text-rose-200"
                  }`}
              >
                <span>{EEAT_LABELS[key] ?? key}</span>
                <span className="font-mono">{val ? "✓" : "✗"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <ul className="space-y-1">
          {issues.slice(0, 4).map((issue, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-amber-100">
              <span className="mt-0.5 shrink-0 text-amber-400">→</span>
              {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
