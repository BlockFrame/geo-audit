"use client";

import { CrawlerInfo } from "@/lib/types";

type Props = { crawlers: CrawlerInfo[]; locale?: "it" | "en" };

const ACCESS_STYLES: Record<string, { label: string; className: string }> = {
  blocked: { label: "Blocked", className: "bg-rose-500/20 text-rose-200 border border-rose-300/35" },
  blocked_via_wildcard: { label: "Blocked (*)", className: "bg-rose-500/15 text-rose-200 border border-rose-300/25" },
  partial: { label: "Partial", className: "bg-amber-400/20 text-amber-100 border border-amber-300/35" },
  partial_via_wildcard: { label: "Partial (*)", className: "bg-amber-400/15 text-amber-100 border border-amber-300/25" },
  allowed: { label: "Allowed", className: "bg-emerald-400/20 text-emerald-100 border border-emerald-300/35" },
  allowed_via_wildcard: { label: "Allowed (*)", className: "bg-emerald-400/15 text-emerald-100 border border-emerald-300/25" },
  unknown: { label: "Unknown", className: "bg-slate-500/20 text-slate-200 border border-slate-300/25" },
};

const TYPE_BADGE: Record<string, string> = {
  training: "bg-indigo-400/20 text-indigo-100 border border-indigo-300/35",
  search: "bg-cyan-400/20 text-cyan-100 border border-cyan-300/35",
};

export default function CrawlerMatrix({ crawlers, locale = "en" }: Props) {
  const configured = crawlers.filter((c) => c.explicitly_configured).length;
  const tableText = {
    title: "AI Crawler Access Matrix",
    configured: "configured",
    crawler: "Crawler",
    company: "Company",
    type: "Type",
    access: "Access",
    config: "Config.",
    tier: "Tier",
    explicit: "Explicit",
    wildcard: "Wildcard",
    warning: "No AI crawler is explicitly configured in robots.txt - add dedicated crawler rules.",
  };

  const accessLabels = {
    blocked: "Blocked",
    blocked_via_wildcard: "Blocked (*)",
    partial: "Partial",
    partial_via_wildcard: "Partial (*)",
    allowed: "Allowed",
    allowed_via_wildcard: "Allowed (*)",
    unknown: "Unknown",
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          {tableText.title}
        </h2>
        <span className={`text-xs px-2 py-1 rounded glass-chip ${configured === 0 ? "text-amber-200" : "text-emerald-200"}`}>
          {configured}/{crawlers.length} {tableText.configured}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-300/70 border-b border-slate-400/20">
              <th className="text-left pb-2 font-medium">{tableText.crawler}</th>
              <th className="text-left pb-2 font-medium">{tableText.company}</th>
              <th className="text-left pb-2 font-medium">{tableText.type}</th>
              <th className="text-left pb-2 font-medium">{tableText.tier}</th>
              <th className="text-left pb-2 font-medium">{tableText.access}</th>
              <th className="text-left pb-2 font-medium">{tableText.config}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-400/15">
            {crawlers.map((c) => {
              const style = ACCESS_STYLES[c.access] ?? ACCESS_STYLES.unknown;
              return (
                <tr key={c.name} className="hover:bg-slate-400/10 transition-colors">
                  <td className="py-2 font-mono text-xs text-slate-100">{c.name}</td>
                  <td className="py-2 text-slate-300/80 text-xs">{c.company}</td>
                  <td className="py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_BADGE[c.type] ?? ""}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="py-2">
                    {c.tier && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${c.tier === 1 ? "bg-emerald-400/20 text-emerald-100 border-emerald-300/40" :
                        c.tier === 2 ? "bg-sky-400/20 text-sky-100 border-sky-300/40" :
                          "bg-slate-400/20 text-slate-300 border-slate-300/30"
                        }`}>T{c.tier}</span>
                    )}
                  </td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${style.className}`}>
                      {accessLabels[c.access as keyof typeof accessLabels] ?? style.label}
                    </span>
                  </td>
                  <td className="py-2 text-xs">
                    {c.explicitly_configured
                      ? <span className="text-emerald-200">✓ {tableText.explicit}</span>
                      : <span className="text-slate-400">{tableText.wildcard}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {configured === 0 && (
        <p className="mt-3 text-xs text-amber-100 bg-amber-300/15 border border-amber-300/30 rounded px-3 py-2">
          ⚠ {tableText.warning}
        </p>
      )}
    </div>
  );
}
