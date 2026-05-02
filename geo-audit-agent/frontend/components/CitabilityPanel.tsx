"use client";

type Props = {
    score: number;
    verdict?: "high" | "medium" | "low" | null;
    details?: Record<string, number> | null;
    locale?: "it" | "en";
};

const SUB_LABELS: Record<string, { en: string; desc_en: string }> = {
    answer_passages: { en: "Answer passages", desc_en: "Q&A / FAQ headers" },
    factual_density: { en: "Factual density", desc_en: "Numbers, stats, %" },
    authority_signals: { en: "Authority signals", desc_en: "Source citations" },
    content_length: { en: "Content length", desc_en: "Word count depth" },
    structured_content: { en: "Structure", desc_en: "Lists & tables" },
    unique_data: { en: "Unique data", desc_en: "Original statistics" },
};

const VERDICT_STYLE: Record<string, string> = {
    high: "bg-emerald-400/20 text-emerald-100 border-emerald-300/35",
    medium: "bg-amber-400/20 text-amber-100 border-amber-300/35",
    low: "bg-rose-400/20 text-rose-100 border-rose-300/35",
};

const BAR_COLOR = (v: number) =>
    v >= 7 ? "#2dd4bf" : v >= 4 ? "#fbbf24" : "#fb7185";

const SCORE_COLOR = (s: number) =>
    s >= 70 ? "#2dd4bf" : s >= 40 ? "#fbbf24" : "#fb7185";

export default function CitabilityPanel({ score, verdict, details, locale = "en" }: Props) {
    const entries = details ? Object.entries(details) : [];
    const verdictLabel: Record<string, string> = {
        high: "High citability",
        medium: "Medium citability",
        low: "Low citability",
    };

    return (
        <div className="glass-panel rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        AI Citability Score
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        How likely AI models are to quote or reference this content
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-2xl font-bold" style={{ color: SCORE_COLOR(score) }}>
                        {score}<span className="text-sm text-slate-400">/100</span>
                    </span>
                    {verdict && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${VERDICT_STYLE[verdict] ?? ""}`}>
                            {verdictLabel[verdict] ?? verdict}
                        </span>
                    )}
                </div>
            </div>

            {/* Sub-score bars */}
            {entries.length > 0 ? (
                <div className="space-y-3">
                    {entries.map(([key, value]) => {
                        const cfg = SUB_LABELS[key];
                        const pct = Math.min(100, value * 10);          // value is 0-10, scale to %
                        const color = BAR_COLOR(value);
                        return (
                            <div key={key}>
                                <div className="flex items-baseline justify-between mb-1 gap-2">
                                    <span className="text-xs text-slate-200 truncate">
                                        {cfg?.en ?? key}
                                    </span>
                                    <span className="text-[11px] text-slate-400 shrink-0">
                                        {value}/10 · {cfg?.desc_en ?? ""}
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-700/40 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, backgroundColor: color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-slate-400">
                    Detailed breakdown not available.
                </p>
            )}

            {/* Interpretation note */}
            <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-400/8 px-3 py-2">
                <p className="text-[11px] text-cyan-100/80 leading-relaxed">
                    AI models preferentially cite content with direct answers to questions, high statistical density, and clear structure.
                </p>
            </div>
        </div>
    );
}
