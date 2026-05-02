"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

import ActionPlanCards from "@/components/ActionPlanCards";
import CrawlerMatrix from "@/components/CrawlerMatrix";
import LlmsTxtPreview from "@/components/LlmsTxtPreview";
import SchemaReport from "@/components/SchemaReport";
import ScoreGauge from "@/components/ScoreGauge";
import {
  buildReadableReportContext,
  extractPlatformGaps,
  filterRecommendations,
} from "@/lib/copilot/report-helpers";
import { GeoAuditState } from "@/lib/types";

type AppLocale = "it" | "en";

type CopilotLabels = {
  copilotReadable: string;
  loadingScore: string;
  loadingCrawlers: string;
  loadingPlan: string;
  loadingLlms: string;
  loadingSchema: string;
};

type Props = {
  state: GeoAuditState;
  locale: AppLocale;
  labels: CopilotLabels;
};

const Pulse = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 py-3 text-cyan-300 animate-pulse text-sm">
    <div className="w-2 h-2 rounded-full bg-cyan-300" />
    {label}
  </div>
);

export function useGeoAuditCopilot({ state, locale, labels }: Props) {
  const readableReportContext = buildReadableReportContext(state.report, state.status, state.url);

  useCopilotReadable({
    description: labels.copilotReadable,
    value: state,
  });

  useCopilotReadable({
    description: "The report contains prioritized recommendations, AI platform scores, brand signals, technical checks, schema markup findings, and a reusable JSON-LD template.",
    value: readableReportContext,
  });

  useCopilotAction({
    name: "display_geo_score",
    available: "frontend",
    description: "Render the overall GEO score gauge with category breakdown",
    parameters: [
      { name: "score", type: "number", description: "Overall GEO score 0-100", required: true },
      { name: "breakdown", type: "object", description: "Score per category with weight", required: false },
    ],
    render: ({ status, args = {} }) => {
      const typedArgs = args as any;
      return status === "inProgress"
        ? <Pulse label={labels.loadingScore} />
        : <ScoreGauge
          score={typedArgs.score ?? 0}
          breakdown={typedArgs.breakdown}
          locale={locale}
        />;
    },
  });

  useCopilotAction({
    name: "display_crawler_matrix",
    available: "frontend",
    description: "Render the AI crawler access matrix (robots.txt analysis)",
    parameters: [
      { name: "crawlers", type: "object[]", description: "Array of crawler objects", required: true },
    ],
    render: ({ status, args = {} }) => {
      const typedArgs = args as any;
      return status === "inProgress"
        ? <Pulse label={labels.loadingCrawlers} />
        : <CrawlerMatrix crawlers={typedArgs.crawlers ?? []} locale={locale} />;
    },
  });

  useCopilotAction({
    name: "display_action_plan",
    available: "frontend",
    description: "Render the prioritized GEO action plan",
    parameters: [
      { name: "recommendations", type: "object[]", description: "Array of recommendations", required: true },
    ],
    render: ({ status, args = {} }) => {
      const typedArgs = args as any;
      return status === "inProgress"
        ? <Pulse label={labels.loadingPlan} />
        : <ActionPlanCards recommendations={typedArgs.recommendations ?? []} locale={locale} />;
    },
  });

  useCopilotAction({
    name: "display_llms_txt",
    available: "frontend",
    description: "Show the recommended llms.txt file content",
    parameters: [
      { name: "content", type: "string", description: "Recommended llms.txt content", required: true },
      { name: "status", type: "string", description: "Current status: found|not_found|blocked", required: true },
    ],
    render: ({ status: actionStatus, args = {} }) => {
      const typedArgs = args as any;
      return actionStatus === "inProgress"
        ? <Pulse label={labels.loadingLlms} />
        : <LlmsTxtPreview content={typedArgs.content ?? ""} status={typedArgs.status ?? ""} locale={locale} />;
    },
  });

  useCopilotAction({
    name: "display_schema_report",
    available: "frontend",
    description: "Show schema markup findings and recommendations",
    parameters: [
      { name: "found", type: "boolean", description: "Whether JSON-LD was found", required: true },
      { name: "types", type: "string[]", description: "Detected schema types", required: false },
      { name: "recommendations", type: "string[]", description: "Schema recommendations", required: false },
    ],
    render: ({ status, args = {} }) => {
      const typedArgs = args as any;
      return status === "inProgress"
        ? <Pulse label={labels.loadingSchema} />
        : <SchemaReport
          found={typedArgs.found ?? false}
          types={typedArgs.types ?? []}
          recommendations={typedArgs.recommendations ?? []}
          locale={locale}
        />;
    },
  });

  useCopilotAction({
    name: "prioritize_recommendations",
    description: "Filter and prioritize the current GEO recommendations by focus area such as quick wins, technical, schema, content, authority, crawlers, llms, or platforms.",
    available: "enabled",
    parameters: [
      {
        name: "focus",
        type: "string",
        description: "Focus area: quick_wins, technical, content, schema, authority, crawlers, llms, platforms, or all.",
        required: true,
      },
      {
        name: "maxItems",
        type: "number",
        description: "Maximum number of recommendations to return.",
        required: false,
      },
    ],
    handler: ({ focus, maxItems }) => {
      const recommendations = state.report?.recommendations ?? [];
      if (recommendations.length === 0) {
        return { error: "No audit recommendations are available yet." };
      }

      const cappedMaxItems = Math.max(1, Math.min(6, Math.round(maxItems ?? 3)));
      const items = filterRecommendations(recommendations, focus, cappedMaxItems);

      return {
        url: state.report?.url ?? state.url,
        focus,
        totalAvailable: recommendations.length,
        items,
      };
    },
  }, [state.report, state.url]);

  useCopilotAction({
    name: "analyze_platform_gap",
    description: "Explain the biggest blockers and next actions for one AI answer platform using the current audit report.",
    available: "enabled",
    parameters: [
      {
        name: "platform",
        type: "string",
        description: "One of: chatgpt_search, perplexity, google_ai_overviews, google_gemini, bing_copilot.",
        required: true,
      },
    ],
    handler: ({ platform }) => {
      if (!state.report) {
        return { error: "No audit report is available yet." };
      }

      return extractPlatformGaps(state.report, platform);
    },
  }, [state.report]);

  useCopilotAction({
    name: "get_schema_template",
    description: "Return the generated Organization JSON-LD template from the current audit report, when available.",
    available: "enabled",
    parameters: [
      {
        name: "entityType",
        type: "string",
        description: "Currently supported: organization.",
        required: false,
      },
    ],
    handler: ({ entityType }) => {
      const requestedType = (entityType ?? "organization").toLowerCase();
      const template = state.report?.schema_org_jsonld_template ?? null;

      if (requestedType !== "organization") {
        return { error: `Unsupported entityType '${requestedType}'. Only organization is available right now.` };
      }

      if (!template) {
        return {
          error: "No Organization schema template is available in the current report.",
          schemaFound: state.report?.schema_found ?? false,
        };
      }

      return {
        entityType: requestedType,
        url: state.report?.url ?? state.url,
        template,
      };
    },
  }, [state.report, state.url]);
}