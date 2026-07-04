"use client";

import ExplainabilityHint from "@/components/ui/explainability-hint";
import { BrandMentions } from "@/lib/types";

type Props = {
    brand?: BrandMentions;
    impactScore?: number;
    impactWeight?: string;
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

export default function BrandPresencePanel({ brand, impactScore, impactWeight, locale = "en" }: Props) {
    const presence = brand?.platform_presence ?? {};
    const presCount = Object.values(presence).filter(Boolean).length;

    return (
        <div className="glass-panel rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Brand Authority Signals
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        AI platform presence & trust signals
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ExplainabilityHint
                        label="How brand and content score is calculated"
                        description="Brand/content score comes from platform presence signals plus E-E-A-T indicators and content depth provided in the report."
                    />
                    {typeof impactScore === "number" && (
                        <span className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                            {impactScore}/100{impactWeight ? ` · ${impactWeight}` : ""}
                        </span>
                    )}
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
