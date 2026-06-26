import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_AUDIT_URL = process.env.BACKEND_AUDIT_URL ?? "http://127.0.0.1:8000/audit";
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

    const response = await fetch(BACKEND_AUDIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    const contentType = response.headers.get("content-type") ?? "application/json";

    return new Response(responseText, {
        status: response.status,
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store",
        },
    });
}