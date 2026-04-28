"use client";

import { BrandMentions, ContentQuality } from "@/lib/types";

type Props = {
    brand?: BrandMentions;
    content?: ContentQuality;
    locale?: "it" | "en";
};

type PlatformConfig = {
    en: string;
    it: string;
    icon: string;
    why_en: string;
    why_it: string;
};

const PLATFORMS: Record<string, PlatformConfig> = {
    wikipedia: { en: "Wikipedia", it: "Wikipedia", icon: "📖", why_en: "Strongest AI entity signal", why_it: "Massimo segnale entità AI" },
    linkedin: { en: "LinkedIn", it: "LinkedIn", icon: "💼", why_en: "Professional authority", why_it: "Autorità professionale" },
    youtube: { en: "YouTube", it: "YouTube", icon: "▶️", why_en: "Gemini / Google AIO boost", why_it: "Boost Gemini / Google AIO" },
    reddit: { en: "Reddit", it: "Reddit", icon: "🟠", why_en: "Community citation signal", why_it: "Segnale citazione community" },
    x_twitter: { en: "X / Twitter", it: "X / Twitter", icon: "𝕏", why_en: "Real-time brand signal", why_it: "Segnale brand real-time" },
    facebook: { en: "Facebook", it: "Facebook", icon: "𝔣", why_en: "Social entity recognition", why_it: "Riconoscimento entità social" },
};

const EEAT_LABELS: Record<string, { en: string; it: string }> = {
    about_page_link: { en: "About page link", it: "Link pagina About" },
    contact_page_link: { en: "Contact page link", it: "Link pagina Contact" },
    author_signal: { en: "Author attribution", it: "Attributo autore" },
    freshness_signal: { en: "Content freshness", it: "Freschezza contenuto" },
    source_signal: { en: "Source citations", it: "Citazioni fonti" },
};

const SCORE_COLOR = (s: number) =>
    s >= 70 ? "#2dd4bf" : s >= 40 ? "#fbbf24" : "#fb7185";

export default function BrandPresencePanel({ brand, content, locale = "en" }: Props) {
    const isIt = locale === "it";
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
                        {isIt ? "Brand Authority & E-E-A-T" : "Brand Authority & E-E-A-T"}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        {isIt ? "Presenza piattaforme AI e segnali di fiducia" : "AI platform presence & trust signals"}
                    </p>
                </div>
                <span className="text-2xl font-bold" style={{ color: SCORE_COLOR(score) }}>
                    {score}<span className="text-sm text-slate-400">/100</span>
                </span>
            </div>

            {/* Platform presence grid */}
            <div className="mb-5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2.5">
                    {isIt ? `Presenza piattaforme (${presCount}/6)` : `Platform presence (${presCount}/6)`}
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
                                    <p className="font-medium truncate">{isIt ? cfg.it : cfg.en}</p>
                                    <p className="text-[10px] opacity-70 truncate">
                                        {isIt ? cfg.why_it : cfg.why_en}
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
                        {isIt ? `E-E-A-T segnali (${eeatCount}/5)` : `E-E-A-T signals (${eeatCount}/5)`}
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
                                    <span>{isIt ? (label?.it ?? key) : (label?.en ?? key)}</span>
                                    <span className="font-mono">{val ? "✓" : "✗"}</span>
                                </div>
                            );
                        })}
                    </div>

                    {wordCount !== undefined && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                            <span>
                                {isIt ? "Parole:" : "Word count:"}
                            </span>
                            <span
                                className={`font-mono ${wordCount >= 1200 ? "text-emerald-300" :
                                        wordCount >= 700 ? "text-amber-300" : "text-rose-300"
                                    }`}
                            >
                                {wordCount.toLocaleString()}
                            </span>
                            <span className="text-slate-500">
                                ({isIt ? "obiettivo ≥1.200" : "target ≥1,200"})
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
