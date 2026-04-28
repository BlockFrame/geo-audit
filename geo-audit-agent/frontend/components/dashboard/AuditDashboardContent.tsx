"use client";

import ActionPlanCards from "@/components/ActionPlanCards";
import BrandPresencePanel from "@/components/BrandPresencePanel";
import CitabilityPanel from "@/components/CitabilityPanel";
import CrawlerMatrix from "@/components/CrawlerMatrix";
import LlmsTxtPreview from "@/components/LlmsTxtPreview";
import SchemaReport from "@/components/SchemaReport";
import TechnicalChecksPanel from "@/components/TechnicalChecksPanel";
import VerboseReportPanel from "@/components/VerboseReportPanel";
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

  return (
    <>
      {isRunning && (
        <div className="mb-6 flex items-center gap-3 p-3 glass-chip rounded-xl slide-up">
          <div className="w-2 h-2 bg-cyan-300 rounded-full animate-ping" />
          <span className="text-cyan-200 text-sm">
            {text.runningPrefix}{state.url ? <> su <span className="font-mono text-xs">{state.url}</span></> : ""}...
          </span>
        </div>
      )}

      {hasReport && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {state.report && (
            <div className="xl:col-span-2 card-hover slide-up-1">
              <VerboseReportPanel report={state.report} locale={locale} />
            </div>
          )}
          {state.crawler_matrix && state.crawler_matrix.length > 0 && (
            <div className="card-hover slide-up-2">
              <CrawlerMatrix crawlers={state.crawler_matrix} locale={locale} />
            </div>
          )}
          {state.recommendations && state.recommendations.length > 0 && (
            <div className="card-hover slide-up-3">
              <ActionPlanCards recommendations={state.recommendations} locale={locale} />
            </div>
          )}
          {state.report?.technical_audit && (
            <div className="xl:col-span-2 card-hover slide-up-4">
              <TechnicalChecksPanel audit={state.report.technical_audit} locale={locale} />
            </div>
          )}
          {state.report?.citability_score !== undefined && (
            <div className="card-hover slide-up-4">
              <CitabilityPanel
                score={state.report.citability_score}
                verdict={state.report.citability_verdict}
                details={state.report.citability_details}
                locale={locale}
              />
            </div>
          )}
          {(state.report?.brand_mentions || state.report?.content_quality) && (
            <div className="card-hover slide-up-4">
              <BrandPresencePanel
                brand={state.report.brand_mentions}
                content={state.report.content_quality}
                locale={locale}
              />
            </div>
          )}
          {state.schema_types !== undefined && (
            <div className="xl:col-span-2 card-hover slide-up-5">
              <SchemaReport
                found={state.schema_found ?? false}
                types={state.schema_types ?? []}
                recommendations={state.schema_recommendations ?? []}
                orgJsonldTemplate={state.report?.schema_org_jsonld_template}
                locale={locale}
              />
            </div>
          )}
          {state.llms_txt_status && state.llms_txt_status !== "found" && (
            <div className="xl:col-span-2 card-hover slide-up-5">
              <LlmsTxtPreview
                content={state.llms_txt_recommended ?? defaultLlmsTxt}
                status={state.llms_txt_status}
                locale={locale}
              />
            </div>
          )}
        </div>
      )}

      {!isRunning && !hasReport && (
        <div className="glass-panel-strong rounded-2xl flex flex-col items-center justify-center h-64 text-center text-slate-300">
          <div className="text-5xl mb-3 bounce-in float-y">🔍</div>
          <p className="text-base font-medium text-slate-200">{text.noAuditTitle}</p>
          <p className="text-sm mt-1 text-slate-400 px-4 max-w-2xl">
            {text.noAuditBody}
          </p>
          <div className="mt-3 flex flex-col gap-2 items-center">
            <code className="text-xs glass-chip social-chip rounded px-3 py-1.5 text-cyan-300 slide-up-1">
              {text.samplePrompt1}
            </code>
            <code className="text-xs glass-chip social-chip rounded px-3 py-1.5 text-cyan-300 slide-up-2">
              {text.samplePrompt2}
            </code>
          </div>
        </div>
      )}
    </>
  );
}