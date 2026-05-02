"use client";

import { useState } from "react";

type Props = {
  content: string;
  status: string;   // "found" | "not_found" | "blocked"
  locale?: "it" | "en";
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  found: { label: "✓ Found", className: "bg-emerald-400/18 text-emerald-100 border border-emerald-300/35" },
  not_found: { label: "✗ Missing (404)", className: "bg-rose-400/18 text-rose-100 border border-rose-300/35" },
  blocked: { label: "⚠ Blocked (403)", className: "bg-amber-300/20 text-amber-100 border border-amber-300/35" },
  error: { label: "⚠ Error", className: "bg-slate-500/18 text-slate-200 border border-slate-300/30" },
};

export default function LlmsTxtPreview({ content, status, locale = "en" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.error;
  const labels = {
    subtitle: "Robots.txt equivalent for AI models",
    copy: "Copy",
    copied: "✓ Copied",
    deployHint: "Deploy this file to",
    deployHint2: "to be discovered by AI models.",
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            llms.txt
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {labels.subtitle}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded glass-chip ${cfg.className}`}>{cfg.label}</span>
      </div>

      {/* Code block */}
      <div className="relative">
        <pre className="bg-slate-950/55 border border-slate-300/20 rounded-lg p-4 text-xs text-emerald-200
                        font-mono overflow-auto max-h-60 leading-relaxed whitespace-pre-wrap">
          {content}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 glass-chip hover:bg-slate-700/65 text-slate-200 text-xs
                     px-3 py-1 rounded transition-colors"
        >
          {copied ? labels.copied : labels.copy}
        </button>
      </div>

      {status !== "found" && (
        <div className="mt-3 text-xs text-amber-100 bg-amber-300/15 border border-amber-300/30 rounded px-3 py-2">
          {labels.deployHint}{" "}
          <code className="text-amber-200 font-mono">yourdomain.com/llms.txt</code>{" "}
          {labels.deployHint2}
        </div>
      )}
    </div>
  );
}
