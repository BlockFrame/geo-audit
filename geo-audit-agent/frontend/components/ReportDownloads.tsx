"use client";

import {
  trackExportDownloaded,
  trackExportModeChanged,
  trackExportAudienceChanged,
} from "@/lib/analytics";
import { GeoReport } from "@/lib/types";
import { useState } from "react";

type Props = {
  report?: GeoReport;
  locale?: "it" | "en";
};

type ExportFormat = "md" | "pdf";
type ReportMode = "verbose" | "executive" | "checklist";
type ExportAudience = "executive" | "marketing" | "technical";

export default function ReportDownloads({ report, locale = "en" }: Props) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ReportMode>("executive");
  const [audience, setAudience] = useState<ExportAudience>("executive");
  const [brandName, setBrandName] = useState("GEO Audit Agent");
  const isIt = locale === "it";

  const labels = {
    reportTitle: isIt ? "Report completo" : "Full report",
    exportTitle: isIt ? "Export dalla chat" : "Export from chat",
    exportBody: isIt
      ? "Scarica report business-oriented in Markdown o PDF con template, audience e modalita."
      : "Download business-oriented reports in Markdown or PDF with template, audience, and mode.",
    score: isIt ? "Score" : "Score",
    preparing: isIt ? "Preparazione" : "Preparing",
    downloadMd: isIt ? "Scarica MD" : "Download MD",
    downloadPdf: isIt ? "Scarica PDF" : "Download PDF",
    exportFailed: isIt ? "Export non riuscito" : "Export failed",
    audience: isIt ? "Audience" : "Audience",
    mode: isIt ? "Modalita" : "Mode",
    brandTemplate: isIt ? "Template brand" : "Brand template",
  };

  const audienceLabels: Record<ExportAudience, string> = {
    executive: isIt ? "Executive" : "Executive",
    marketing: isIt ? "Marketing" : "Marketing",
    technical: isIt ? "Technical" : "Technical",
  };

  const modeLabels: Record<ReportMode, string> = {
    verbose: isIt ? "Completo" : "Verbose",
    executive: isIt ? "Executive summary" : "Executive summary",
    checklist: isIt ? "Checklist" : "Checklist",
  };

  const buttonLabels: Record<ExportFormat, string> = {
    md: labels.downloadMd,
    pdf: labels.downloadPdf,
  };

  if (!report) {
    return null;
  }

  const handleDownload = async (format: ExportFormat) => {
    try {
      setActiveFormat(format);
      setError(null);

      const payload = {
        format,
        report,
        mode,
        audience,
        brandName: brandName.trim() || undefined,
      };

      // Track export event
      trackExportDownloaded({
        format,
        mode,
        audience,
        geo_score: report.geo_score,
      });

      const response = await fetch("/api/report/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`${labels.exportFailed} (status ${response.status})`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition") ?? "";
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const fileName = fileNameMatch?.[1] ?? `geo-audit-report.${format}`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : labels.exportFailed);
    } finally {
      setActiveFormat(null);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-300/80 uppercase tracking-wider">{labels.reportTitle}</p>
          <h2 className="mt-1 text-sm font-semibold text-slate-100">{labels.exportTitle}</h2>
          <p className="mt-1 text-xs text-slate-400">
            {labels.exportBody}
          </p>
        </div>
        <div className="glass-chip rounded-xl px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">{labels.score}</p>
          <p className="text-lg font-semibold text-cyan-200">{report.geo_score ?? "n/a"}/100</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="min-w-[170px] flex-1">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">{labels.audience}</span>
          <select
            value={audience}
            onChange={(event) => {
              const newAudience = event.target.value as ExportAudience;
              setAudience(newAudience);
              trackExportAudienceChanged(newAudience);
            }}
            className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
          >
            {(Object.keys(audienceLabels) as ExportAudience[]).map((value) => (
              <option key={value} value={value} className="bg-slate-900 text-slate-100">
                {audienceLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[170px] flex-1">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">{labels.mode}</span>
          <select
            value={mode}
            onChange={(event) => {
              const newMode = event.target.value as ReportMode;
              setMode(newMode);
              trackExportModeChanged(newMode);
            }}
            className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
          >
            {(Object.keys(modeLabels) as ReportMode[]).map((value) => (
              <option key={value} value={value} className="bg-slate-900 text-slate-100">
                {modeLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="w-full">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">{labels.brandTemplate}</span>
          <input
            type="text"
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
            className="w-full rounded-xl border border-cyan-300/25 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
            placeholder="GEO Audit Agent"
            maxLength={120}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["md", "pdf"] as const).map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => handleDownload(format)}
            disabled={activeFormat !== null}
            className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {activeFormat === format ? `${labels.preparing} ${format.toUpperCase()}...` : buttonLabels[format]}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
    </div>
  );
}