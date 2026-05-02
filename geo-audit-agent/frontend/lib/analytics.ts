import { Analytics } from "@vercel/analytics/react";

/**
 * Utility per tracciare eventi custom con Vercel Analytics
 * Tutti gli eventi sono tracciati lato client e inviati a Vercel
 */

export type EventName =
    | "audit_started"
    | "audit_completed"
    | "audit_failed"
    | "export_downloaded"
    | "export_mode_changed"
    | "export_audience_changed"
    | "chat_message_sent"
    | "chat_refusal_triggered"
    | "report_viewed"
    | "schema_recommendation_applied";

export type AuditStatus = "strong" | "moderate" | "at_risk";

export interface AuditEventProps {
    url?: string;
    business_type?: string;
    geo_score?: number;
    status?: AuditStatus;
    duration_ms?: number;
    error?: string;
}

export interface ExportEventProps {
    format: "md" | "pdf";
    mode: "verbose" | "executive" | "checklist";
    audience: "executive" | "marketing" | "technical";
    geo_score?: number;
}

export interface AnalyticsEventProps {
    [key: string]: string | number | boolean | undefined;
}

/**
 * Track custom event with Vercel Analytics
 * Automatically captures URL pathname, timestamp
 */
export const trackEvent = (
    eventName: EventName,
    properties?: AnalyticsEventProps
) => {
    if (typeof window === "undefined") {
        console.warn(`[Analytics] Event tracked server-side: ${eventName}`);
        return;
    }

    try {
        // Use window.va if available (injected by Vercel Analytics)
        if (window.va) {
            window.va.track(eventName, properties || {});
        }

        // Fallback: log to console in development
        if (process.env.NODE_ENV === "development") {
            console.log(`[Analytics Event] ${eventName}`, properties || {});
        }
    } catch (error) {
        console.error(`[Analytics] Failed to track event ${eventName}:`, error);
    }
};

/**
 * Track audit lifecycle events
 */
export const trackAuditStarted = (url: string) => {
    trackEvent("audit_started", {
        url: sanitizeUrl(url),
    });
};

export const trackAuditCompleted = (props: AuditEventProps) => {
    trackEvent("audit_completed", {
        url: props.url ? sanitizeUrl(props.url) : undefined,
        business_type: props.business_type,
        geo_score: props.geo_score,
        status: props.status,
        duration_ms: props.duration_ms,
    });
};

export const trackAuditFailed = (error: string, url?: string) => {
    trackEvent("audit_failed", {
        error_type: extractErrorType(error),
        url: url ? sanitizeUrl(url) : undefined,
    });
};

/**
 * Track export events
 */
export const trackExportDownloaded = (props: ExportEventProps) => {
    trackEvent("export_downloaded", {
        format: props.format,
        mode: props.mode,
        audience: props.audience,
        geo_score: props.geo_score,
    });
};

export const trackExportModeChanged = (
    mode: "verbose" | "executive" | "checklist"
) => {
    trackEvent("export_mode_changed", { mode });
};

export const trackExportAudienceChanged = (
    audience: "executive" | "marketing" | "technical"
) => {
    trackEvent("export_audience_changed", { audience });
};

/**
 * Track chat/copilot interactions
 */
export const trackChatMessageSent = (messageLength: number) => {
    trackEvent("chat_message_sent", {
        message_length: messageLength,
    });
};

export const trackChatRefusalTriggered = (reason: string) => {
    trackEvent("chat_refusal_triggered", {
        reason_type: sanitizeReason(reason),
    });
};

/**
 * Track report viewing
 */
export const trackReportViewed = (reportType: string) => {
    trackEvent("report_viewed", {
        report_type: reportType,
    });
};

/**
 * Helper functions
 */
const sanitizeUrl = (url: string): string => {
    try {
        const parsed = new URL(url);
        return parsed.hostname || url;
    } catch {
        return "invalid_url";
    }
};

const sanitizeReason = (reason: string): string => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes("safety")) return "content_safety";
    if (lowerReason.includes("jailbreak")) return "jailbreak_detection";
    if (lowerReason.includes("malicious")) return "malicious_intent";
    if (lowerReason.includes("privacy")) return "privacy_concern";
    return "other";
};

const extractErrorType = (error: string): string => {
    const lowerError = error.toLowerCase();
    if (lowerError.includes("timeout")) return "timeout";
    if (lowerError.includes("network")) return "network_error";
    if (lowerError.includes("invalid")) return "invalid_input";
    if (lowerError.includes("not found")) return "not_found";
    if (lowerError.includes("auth")) return "auth_error";
    return "unknown_error";
};

/**
 * Global type augmentation for window.va
 */
declare global {
    interface Window {
        va?: {
            track: (eventName: string, properties?: Record<string, any>) => void;
        };
    }
}

export { Analytics };

