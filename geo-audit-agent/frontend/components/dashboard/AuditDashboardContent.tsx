"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import ActionPlanCards from "@/components/ActionPlanCards";
import BrandPresencePanel from "@/components/BrandPresencePanel";
import CitabilityPanel from "@/components/CitabilityPanel";
import CrawlerMatrix from "@/components/CrawlerMatrix";
import ImmersiveMotionScene from "@/components/ImmersiveMotionScene";
import LlmsTxtPreview from "@/components/LlmsTxtPreview";
import SchemaReport from "@/components/SchemaReport";
import TechnicalChecksPanel from "@/components/TechnicalChecksPanel";
import VerboseReportPanel from "@/components/VerboseReportPanel";
import {
  trackAuditCompleted,
  trackReportViewed,
} from "@/lib/analytics";
import { GeoAuditState } from "@/lib/types";

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
};

export default function AuditDashboardContent({ state, locale, text, defaultLlmsTxt }: Props) {
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
            className="grid grid-cols-1 gap-5 xl:grid-cols-2"
            aria-live="polite"
          >
            {state.report && (
              <motion.div layout className="xl:col-span-2 card-hover">
                <VerboseReportPanel report={state.report} locale={locale} />
              </motion.div>
            )}
            {state.crawler_matrix && state.crawler_matrix.length > 0 && (
              <motion.div layout {...cardMotion} className="card-hover">
                <CrawlerMatrix crawlers={state.crawler_matrix} locale={locale} />
              </motion.div>
            )}
            {state.recommendations && state.recommendations.length > 0 && (
              <motion.div layout {...cardMotion} className="card-hover">
                <ActionPlanCards recommendations={state.recommendations} locale={locale} />
              </motion.div>
            )}
            {state.report?.technical_audit && (
              <motion.div layout {...cardMotion} className="xl:col-span-2 card-hover">
                <TechnicalChecksPanel audit={state.report.technical_audit} locale={locale} />
              </motion.div>
            )}
            {state.report?.citability_score !== undefined && (
              <motion.div layout {...cardMotion} className="card-hover">
                <CitabilityPanel
                  score={state.report.citability_score}
                  verdict={state.report.citability_verdict}
                  details={state.report.citability_details}
                  locale={locale}
                />
              </motion.div>
            )}
            {(state.report?.brand_mentions || state.report?.content_quality) && (
              <motion.div layout {...cardMotion} className="card-hover">
                <BrandPresencePanel
                  brand={state.report.brand_mentions}
                  content={state.report.content_quality}
                  locale={locale}
                />
              </motion.div>
            )}
            {state.schema_types !== undefined && (
              <motion.div layout {...cardMotion} className="xl:col-span-2 card-hover">
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
              <motion.div layout {...cardMotion} className="xl:col-span-2 card-hover">
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
        {!isRunning && !hasReport && (
          <motion.div
            key="empty"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={fadeUpTransition}
            className="relative flex min-h-[26rem] flex-col py-2 lg:min-h-[38rem] lg:h-full"
            aria-live="polite"
          >
            <ImmersiveMotionScene free className="h-[22rem] w-full sm:h-[28rem] lg:h-[34rem] xl:h-[38rem]" />
            <span className="sr-only">{text.noAuditTitle}. {text.noAuditBody}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}