"use client";

import { TechnicalAudit } from "@/lib/types";

type Props = { audit: TechnicalAudit; locale?: "it" | "en" };

type CheckEval = "good_if_true" | "bad_if_true" | "good_if_one" | "count_low_is_good";

type CheckConfig = {
    en: string;
    it: string;
    eval: CheckEval;
    group: "core" | "rendering" | "security" | "perf";
};

const CHECKS: Record<string, CheckConfig> = {
    https: { en: "HTTPS", it: "HTTPS", eval: "good_if_true", group: "core" },
    viewport: { en: "Viewport meta", it: "Viewport meta", eval: "good_if_true", group: "core" },
    canonical: { en: "Canonical tag", it: "Tag canonical", eval: "good_if_true", group: "core" },
    lang: { en: "HTML lang attr", it: "Attributo HTML lang", eval: "good_if_true", group: "core" },
    indexable: { en: "Indexable", it: "Indicizzabile", eval: "good_if_true", group: "core" },
    sitemap_declared: { en: "Sitemap declared", it: "Sitemap dichiarata", eval: "good_if_true", group: "core" },
    h1_count: { en: "Single H1", it: "H1 unico", eval: "good_if_one", group: "core" },
    ssr_ok: { en: "Server-side rendering", it: "SSR attivo", eval: "good_if_true", group: "rendering" },
    is_spa: { en: "SPA detected (risk)", it: "SPA rilevata (rischio)", eval: "bad_if_true", group: "rendering" },
    security_hsts: { en: "HSTS header", it: "Header HSTS", eval: "good_if_true", group: "security" },
    security_csp: { en: "Content-Security-Policy", it: "Content-Security-Policy", eval: "good_if_true", group: "security" },
    security_xcto: { en: "X-Content-Type-Options", it: "X-Content-Type-Options", eval: "good_if_true", group: "security" },
    security_xfo: { en: "X-Frame-Options", it: "X-Frame-Options", eval: "good_if_true", group: "security" },
    security_referrer: { en: "Referrer-Policy", it: "Referrer-Policy", eval: "good_if_true", group: "security" },
    indexnow: { en: "IndexNow protocol", it: "Protocollo IndexNow", eval: "good_if_true", group: "perf" },
    cls_risk: { en: "CLS risk", it: "Rischio CLS", eval: "bad_if_true", group: "perf" },
    images_without_dimensions: { en: "Images w/o dimensions", it: "Immagini senza dimensioni", eval: "count_low_is_good", group: "perf" },
};

const GROUPS: { key: "core" | "rendering" | "security" | "perf"; en: string; it: string }[] = [
    { key: "core", en: "Core SEO", it: "Core SEO" },
    { key: "rendering", en: "Rendering", it: "Rendering" },
    { key: "security", en: "Security Headers", it: "Header di Sicurezza" },
    { key: "perf", en: "Performance & Indexing", it: "Performance & Indicizzazione" },
];

function resolveStatus(key: string, value: boolean | number | string | undefined, evalType: CheckEval): "pass" | "fail" | "warn" {
    if (value === undefined) return "warn";
    if (evalType === "good_if_true") return value === true ? "pass" : "fail";
    if (evalType === "bad_if_true") return value === false ? "pass" : "fail";
    if (evalType === "good_if_one") return value === 1 ? "pass" : value === 0 ? "fail" : "warn";
    if (evalType === "count_low_is_good") return value === 0 ? "pass" : (value as number) <= 3 ? "warn" : "fail";
    return "warn";
}

function displayValue(key: string, value: boolean | number | string | undefined, evalType: CheckEval): string {
    if (value === undefined) return "–";
    if (evalType === "count_low_is_good") return String(value);
    if (evalType === "good_if_one") return String(value);
    return value ? "✓" : "✗";
}

const STATUS_STYLE: Record<"pass" | "fail" | "warn", string> = {
    pass: "bg-emerald-400/15 text-emerald-100 border-emerald-300/30",
    fail: "bg-rose-400/15   text-rose-100   border-rose-300/30",
    warn: "bg-amber-400/15  text-amber-100  border-amber-300/30",
};

const STATUS_DOT: Record<"pass" | "fail" | "warn", string> = {
    pass: "bg-emerald-400",
    fail: "bg-rose-400",
    warn: "bg-amber-400",
};

export default function TechnicalChecksPanel({ audit, locale = "en" }: Props) {
    const isIt = locale === "it";
    const checks = audit.checks ?? {};
    const issues = audit.issues ?? [];
    const score = audit.score ?? 0;
    const scoreColor = score >= 70 ? "#2dd4bf" : score >= 45 ? "#fbbf24" : "#fb7185";

    const passCount = Object.keys(CHECKS).filter((k) => {
        const cfg = CHECKS[k];
        return resolveStatus(k, checks[k], cfg.eval) === "pass";
    }).length;

    return (
        <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        {isIt ? "Controlli Tecnici" : "Technical Checks"}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        {passCount}/{Object.keys(CHECKS).length} {isIt ? "superati" : "passed"}
                    </p>
                </div>
                <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                    {score}<span className="text-sm text-slate-400">/100</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
                {GROUPS.map((group) => {
                    const keys = Object.entries(CHECKS).filter(([, cfg]) => cfg.group === group.key);
                    return (
                        <div key={group.key} className="glass-panel-strong rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                                {isIt ? group.it : group.en}
                            </p>
                            <div className="space-y-1.5">
                                {keys.map(([key, cfg]) => {
                                    const val = checks[key];
                                    const status = resolveStatus(key, val, cfg.eval);
                                    const disp = displayValue(key, val, cfg.eval);
                                    return (
                                        <div
                                            key={key}
                                            className={`flex items-center justify-between gap-2 text-[11px] px-2 py-1 rounded border ${STATUS_STYLE[status]}`}
                                        >
                                            <span className="flex items-center gap-1.5 truncate">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
                                                {isIt ? cfg.it : cfg.en}
                                            </span>
                                            <span className="font-mono shrink-0">{disp}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {issues.length > 0 && (
                <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-2">
                        {isIt ? "Problemi rilevati" : "Detected issues"}
                    </p>
                    <ul className="space-y-1">
                        {issues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-rose-100">
                                <span className="shrink-0 mt-0.5 text-rose-400">→</span>
                                {issue}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
