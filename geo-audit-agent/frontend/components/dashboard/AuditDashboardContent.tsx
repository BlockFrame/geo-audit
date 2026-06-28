"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import ActionPlanCards from "@/components/ActionPlanCards";
import BrandPresencePanel from "@/components/BrandPresencePanel";
import CitabilityPanel from "@/components/CitabilityPanel";
import CrawlerMatrix from "@/components/CrawlerMatrix";
import LlmsTxtPreview from "@/components/LlmsTxtPreview";
import SchemaReport from "@/components/SchemaReport";
import TechnicalChecksPanel from "@/components/TechnicalChecksPanel";
import VerboseReportPanel from "@/components/VerboseReportPanel";
import {
  trackAuditCompleted,
  trackReportViewed,
} from "@/lib/analytics";
import { GeoAuditState, GeoReport } from "@/lib/types";

type AppLocale = "it" | "en";

type DashboardText = {
  runningPrefix: string;
  noAuditTitle: string;
  noAuditBody: string;
  samplePrompt1: string;
  samplePrompt2: string;
};

type Props = {
  state: GeoAuditState;
  locale: AppLocale;
  text: DashboardText;
  defaultLlmsTxt: string;
  showEmptyState?: boolean;
};

function kpiTone(score?: number) {
  const value = score ?? -1;
  if (value >= 70) return "text-emerald-200 border-emerald-300/35 bg-emerald-400/10";
  if (value >= 45) return "text-amber-200 border-amber-300/35 bg-amber-400/10";
  if (value >= 0) return "text-rose-200 border-rose-300/35 bg-rose-400/10";
  return "text-slate-300 border-slate-500/35 bg-slate-500/10";
}

function scoreText(score?: number) {
  return typeof score === "number" ? `${score}/100` : "n/a";
}

function buildKpiCards(report?: GeoReport | null) {
  return [
    {
      key: "geo",
      label: "GEO Score",
      score: report?.geo_score,
      explainability: "Calculated by weighted aggregate of crawler access, technical checks, schema, metadata, content, and platform readiness.",
    },
    {
      key: "citability",
      label: "Citability",
      score: report?.citability_score,
      explainability: "Calculated from answer passages, factual density, authority signals, content length, structure, and unique data.",
    },
    {
      key: "technical",
      label: "Technical",
      score: report?.technical_audit?.score,
      explainability: "Calculated from pass/fail checks across core SEO, rendering, security headers, and performance/indexing.",
    },
    {
      key: "content",
      label: "Content",
      score: report?.content_quality?.score,
      explainability: "Provided by the report content-quality analyzer (E-E-A-T signals, structure, and depth). No inferred score when missing.",
    },
  ];
}

export default function AuditDashboardContent({
  state,
  locale,
  text,
  defaultLlmsTxt,
  showEmptyState = true,
}: Props) {
  const isRunning = state.status === "fetching" || state.status === "analyzing";
  const hasReport = Boolean(state.report);
  const lastTrackedReportKey = useRef<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const reportTrackingKey = state.report
    ? [state.report.url, state.report.audit_date, state.report.geo_score].join("|")
    : "";
  const fadeUpTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };
  const cardMotion = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: fadeUpTransition };
  const kpiCards = buildKpiCards(state.report);

  useEffect(() => {
    const report = state.report;
    if (!report || !reportTrackingKey || lastTrackedReportKey.current === reportTrackingKey) {
      return;
    }
    lastTrackedReportKey.current = reportTrackingKey;

    const status =
      (report.geo_score ?? 0) >= 75
        ? "strong"
        : (report.geo_score ?? 0) >= 50
          ? "moderate"
          : "at_risk";

    trackAuditCompleted({
      url: report.url,
      business_type: report.business_type,
      geo_score: report.geo_score,
      status,
    });

    trackReportViewed("full_dashboard");
  }, [reportTrackingKey, state.report]);

  return (
    <>
      <AnimatePresence initial={false} mode="wait">
        {isRunning && (
          <motion.div
            key="running"
            {...cardMotion}
            className="mb-6 flex items-center gap-3 p-3 glass-chip rounded-xl"
            role="status"
            aria-live="polite"
          >
            <div className="w-2 h-2 bg-cyan-300 rounded-full animate-ping" />
            <span className="text-cyan-200 text-sm">
              {text.runningPrefix}{state.url ? <> on <span className="font-mono text-xs">{state.url}</span></> : ""}...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        {hasReport && (
          <motion.div
            key={reportTrackingKey || "report"}
            layout
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={fadeUpTransition}
            className="grid grid-cols-1 gap-5 xl:grid-cols-12"
            aria-live="polite"
          >
            <motion.div layout {...cardMotion} className="xl:col-span-12">
              <div className="glass-panel rounded-2xl p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    KPI Cluster (macro metrics)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Directly mapped from report fields
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {kpiCards.map((kpi, index) => (
                    <motion.div
                      key={kpi.key}
                      className={`rounded-xl border px-3 py-3 ${kpiTone(kpi.score)}`}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, delay: 0.05 * index }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] uppercase tracking-wider">{kpi.label}</p>
                        <span className="cursor-help text-xs" aria-label={`${kpi.label} explainability`} title={kpi.explainability}>
                          ℹ
                        </span>
                      </div>
                      <p className="mt-1 text-xl font-semibold">{scoreText(kpi.score)}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {state.report && (
              <motion.div layout className="xl:col-span-12 card-hover">
                <VerboseReportPanel report={state.report} locale={locale} />
              </motion.div>
            )}
            {state.crawler_matrix && state.crawler_matrix.length > 0 && (
              <motion.div layout {...cardMotion} className="xl:col-span-6 card-hover">
                <CrawlerMatrix crawlers={state.crawler_matrix} locale={locale} />
              </motion.div>
            )}
            {state.recommendations && state.recommendations.length > 0 && (
              <motion.div layout {...cardMotion} className="xl:col-span-6 card-hover">
                <ActionPlanCards recommendations={state.recommendations} locale={locale} />
              </motion.div>
            )}
            {state.report?.technical_audit && (
              <motion.div layout {...cardMotion} className="xl:col-span-6 card-hover">
                <TechnicalChecksPanel audit={state.report.technical_audit} locale={locale} />
              </motion.div>
            )}
            {state.report?.citability_score !== undefined && (
              <motion.div layout {...cardMotion} className="xl:col-span-6 card-hover">
                <CitabilityPanel
                  score={state.report.citability_score}
                  verdict={state.report.citability_verdict}
                  details={state.report.citability_details}
                  locale={locale}
                />
              </motion.div>
            )}
            {(state.report?.brand_mentions || state.report?.content_quality) && (
              <motion.div layout {...cardMotion} className="xl:col-span-6 card-hover">
                <BrandPresencePanel
                  brand={state.report.brand_mentions}
                  content={state.report.content_quality}
                  locale={locale}
                />
              </motion.div>
            )}
            {state.schema_types !== undefined && (
              <motion.div layout {...cardMotion} className="xl:col-span-6 card-hover">
                <SchemaReport
                  found={state.schema_found ?? false}
                  types={state.schema_types ?? []}
                  recommendations={state.schema_recommendations ?? []}
                  orgJsonldTemplate={state.report?.schema_org_jsonld_template}
                  locale={locale}
                />
              </motion.div>
            )}
            {state.llms_txt_status && state.llms_txt_status !== "found" && (
              <motion.div layout {...cardMotion} className="xl:col-span-12 card-hover">
                <LlmsTxtPreview
                  content={state.llms_txt_recommended ?? defaultLlmsTxt}
                  status={state.llms_txt_status}
                  locale={locale}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        {showEmptyState && !isRunning && !hasReport && (
          <motion.div
            key="empty"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={fadeUpTransition}
            className="relative flex min-h-[16rem] flex-col py-2 lg:min-h-[20rem]"
            aria-live="polite"
          >
            <div className="h-full min-h-[14rem] w-full rounded-2xl border border-cyan-300/10 bg-gradient-to-br from-slate-950/70 via-slate-900/55 to-slate-950/70 sm:min-h-[18rem] lg:min-h-[20rem]" aria-hidden="true" />
            <span className="sr-only">{text.noAuditTitle}. {text.noAuditBody}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}