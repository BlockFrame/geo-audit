"use client";

import { BrandMentions, ContentQuality } from "@/lib/types";

type Props = {
    brand?: BrandMentions;
    content?: ContentQuality;
    locale?: "it" | "en";
};

type PlatformConfig = {
    en: string;
    icon: string;
    why_en: string;
};

const PLATFORMS: Record<string, PlatformConfig> = {
    wikipedia: { en: "Wikipedia", icon: "📖", why_en: "Strongest AI entity signal" },
    linkedin: { en: "LinkedIn", icon: "💼", why_en: "Professional authority" },
    youtube: { en: "YouTube", icon: "▶️", why_en: "Gemini / Google AIO boost" },
    reddit: { en: "Reddit", icon: "🟠", why_en: "Community citation signal" },
    x_twitter: { en: "X / Twitter", icon: "𝕏", why_en: "Real-time brand signal" },
    facebook: { en: "Facebook", icon: "𝔣", why_en: "Social entity recognition" },
};

const EEAT_LABELS: Record<string, { en: string }> = {
    about_page_link: { en: "About page link" },
    contact_page_link: { en: "Contact page link" },
    author_signal: { en: "Author attribution" },
    freshness_signal: { en: "Content freshness" },
    source_signal: { en: "Source citations" },
};

const SCORE_COLOR = (s: number) =>
    s >= 70 ? "#2dd4bf" : s >= 40 ? "#fbbf24" : "#fb7185";

export default function BrandPresencePanel({ brand, content, locale = "en" }: Props) {
    const presence = brand?.platform_presence ?? {};
    const score = brand?.score ?? 0;
    const eeat = content?.eeat_signals ?? {};
    const wordCount = content?.word_count;
    const eeatCount = Object.values(eeat).filter(Boolean).length;
    const presCount = Object.values(presence).filter(Boolean).length;

    return (
        <div className="glass-panel rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Brand Authority & E-E-A-T
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        AI platform presence & trust signals
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="cursor-help text-xs text-slate-300/80"
                        title="Brand/content score comes from platform presence signals plus E-E-A-T indicators and content depth provided in the report."
                        aria-label="How brand and content score is calculated"
                    >
                        ℹ
                    </span>
                    <span className="text-2xl font-bold" style={{ color: SCORE_COLOR(score) }}>
                        {score}<span className="text-sm text-slate-400">/100</span>
                    </span>
                </div>
            </div>

            {/* Platform presence grid */}
            <div className="mb-5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2.5">
                    {`Platform presence (${presCount}/6)`}
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(PLATFORMS).map(([key, cfg]) => {
                        const present = !!presence[key];
                        return (
                            <div
                                key={key}
                                className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-[11px] ${present
                                    ? "bg-emerald-400/15 border-emerald-300/30 text-emerald-100"
                                    : "bg-slate-700/30 border-slate-600/20 text-slate-400"
                                    }`}
                            >
                                <span className="text-base leading-none shrink-0">{cfg.icon}</span>
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{cfg.en}</p>
                                    <p className="text-[10px] opacity-70 truncate">
                                        {cfg.why_en}
                                    </p>
                                </div>
                                <span className="ml-auto shrink-0 font-mono">{present ? "✓" : "–"}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* E-E-A-T signals */}
            {Object.keys(eeat).length > 0 && (
                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2.5">
                        {`E-E-A-T signals (${eeatCount}/5)`}
                    </p>
                    <div className="space-y-1.5">
                        {Object.entries(eeat).map(([key, val]) => {
                            const label = EEAT_LABELS[key];
                            return (
                                <div
                                    key={key}
                                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-[11px] ${val
                                        ? "bg-emerald-400/10 border-emerald-300/25 text-emerald-100"
                                        : "bg-rose-400/10 border-rose-300/20 text-rose-200"
                                        }`}
                                >
                                    <span>{label?.en ?? key}</span>
                                    <span className="font-mono">{val ? "✓" : "✗"}</span>
                                </div>
                            );
                        })}
                    </div>

                    {wordCount !== undefined && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                            <span>Word count:</span>
                            <span
                                className={`font-mono ${wordCount >= 1200 ? "text-emerald-300" :
                                    wordCount >= 700 ? "text-amber-300" : "text-rose-300"
                                    }`}
                            >
                                {wordCount.toLocaleString()}
                            </span>
                            <span className="text-slate-500">
                                (target ≥1,200)
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Brand issues */}
            {(brand?.issues?.length ?? 0) > 0 && (
                <div className="mt-4">
                    <ul className="space-y-1">
                        {brand!.issues!.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-amber-100">
                                <span className="shrink-0 mt-0.5 text-amber-400">→</span>
                                {issue}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
