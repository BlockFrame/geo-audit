import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000";

function trimTrailingSlash(value: string) {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveBackendBaseUrl() {
    const explicitAuditUrl = process.env.BACKEND_AUDIT_URL?.trim();
    if (explicitAuditUrl) {
        return trimTrailingSlash(explicitAuditUrl);
    }

    const copilotKitUrl = process.env.BACKEND_URL?.trim();
    if (copilotKitUrl) {
        return `${trimTrailingSlash(copilotKitUrl).replace(/\/copilotkit$/, "")}/audit`;
    }

    const aguiUrl = process.env.BACKEND_AGUI_URL?.trim();
    if (aguiUrl) {
        return `${trimTrailingSlash(aguiUrl).replace(/\/agui\/default$/, "")}/audit`;
    }

    return `${DEFAULT_BACKEND_BASE_URL}/audit`;
}

const BACKEND_AUDIT_URL = resolveBackendBaseUrl();
const MAX_AUDIT_REQUEST_BYTES = 8 * 1024;

export async function POST(req: NextRequest) {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_AUDIT_REQUEST_BYTES) {
        return Response.json({ error: "Audit request too large" }, { status: 413 });
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_AUDIT_REQUEST_BYTES) {
        return Response.json({ error: "Audit request too large" }, { status: 413 });
    }

    let payload: unknown;
    try {
        payload = JSON.parse(rawBody || "{}");
    } catch {
        return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    let response: Response;
    try {
        response = await fetch(BACKEND_AUDIT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch {
        return Response.json(
            { error: "Backend unreachable. Make sure the backend server is running." },
            { status: 503 }
        );
    }

    const responseText = await response.text();
    const isJson = (response.headers.get("content-type") ?? "").includes("application/json");
    const safebody = responseText.trim() || (isJson ? "{}" : "");
    const contentType = response.headers.get("content-type") ?? "application/json";

    return new Response(safebody, {
        status: response.status,
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store",
        },
    });
}