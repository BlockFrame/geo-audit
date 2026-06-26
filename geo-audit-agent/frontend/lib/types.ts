export type CrawlerInfo = {
  name: string;
  company: string;
  type: "training" | "search";
  tier?: 1 | 2 | 3;
  access: string;
  explicitly_configured: boolean;
  rules?: string[];
};

export type Recommendation = {
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  impact: string;
  effort: string;
};

export type ScoreBreakdown = Record<string, { score: number; weight: string }>;

export type MetaIssue = {
  severity: "critical" | "high" | "medium" | "warning";
  issue: string;
};

export type TechnicalAudit = {
  score?: number;
  checks?: Record<string, boolean | number | string>;
  issues?: string[];
};

export type ContentQuality = {
  score?: number;
  word_count?: number;
  avg_sentence_length?: number;
  eeat_signals?: Record<string, boolean>;
  issues?: string[];
};

export type BrandMentions = {
  score?: number;
  platform_presence?: Record<string, boolean>;
  issues?: string[];
};

export type PlatformReadiness = {
  overall_score?: number;
  platform_scores?: Record<string, number>;
};

export type GeoReport = {
  url?: string;
  business_type?: string;
  business_type_confidence?: number;
  geo_score?: number;
  score_breakdown?: ScoreBreakdown;
  crawler_matrix?: CrawlerInfo[];
  llms_txt_status?: string;
  llms_txt_url?: string;
  schema_found?: boolean;
  schema_types?: string[];
  schema_recommendations?: string[];
  schema_org_jsonld_template?: Record<string, unknown> | null;
  meta_issues?: MetaIssue[];
  technical_audit?: TechnicalAudit;
  content_quality?: ContentQuality;
  brand_mentions?: BrandMentions;
  platform_readiness?: PlatformReadiness;
  citability_score?: number;
  citability_verdict?: "high" | "medium" | "low";
  citability_details?: Record<string, number>;
  llms_txt_recommended?: string;
  recommendations?: Recommendation[];
  audit_date?: string;
};

export type GeoAuditState = {
  url: string;
  status: "idle" | "fetching" | "analyzing" | "complete" | "error";
  geo_score?: number;
  score_breakdown?: ScoreBreakdown;
  crawler_matrix?: CrawlerInfo[];
  llms_txt_status?: string;
  llms_txt_recommended?: string;
  schema_found?: boolean;
  schema_types?: string[];
  schema_recommendations?: string[];
  meta_issues?: MetaIssue[];
  recommendations?: Recommendation[];
  report?: GeoReport;
  messages: unknown[];
};
