import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_BACKEND_COPILOTKIT_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000/copilotkit";
const BACKEND_AGUI_URL = process.env.BACKEND_AGUI_URL ?? "http://127.0.0.1:8000/agui/default";
const BACKEND_COPILOTKIT_URL = RAW_BACKEND_COPILOTKIT_URL.endsWith("/")
    ? RAW_BACKEND_COPILOTKIT_URL
    : `${RAW_BACKEND_COPILOTKIT_URL}/`;
const MAX_PROXY_REQUEST_BYTES = 1024 * 1024;

const isInfoEndpoint = (req: NextRequest) => req.nextUrl.pathname.endsWith("/info");
const isRunEndpoint = (req: NextRequest) => /\/agent\/[^/]+\/run$/.test(req.nextUrl.pathname);

const buildBackendCopilotKitUrl = (req: NextRequest) => {
    const suffix = req.nextUrl.pathname.replace(/^.*\/api\/copilotkit/, "");
    const normalizedSuffix = suffix.replace(/^\//, "");
    return `${BACKEND_COPILOTKIT_URL}${normalizedSuffix}${req.nextUrl.search}`;
};

const payloadTooLargeResponse = () => Response.json(
    { error: "Request payload too large" },
    { status: 413 },
);

const readBoundedBody = async (req: NextRequest) => {
    if (req.method === "GET" || req.method === "HEAD") {
        return undefined;
    }

    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_PROXY_REQUEST_BYTES) {
        throw payloadTooLargeResponse();
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_PROXY_REQUEST_BYTES) {
        throw payloadTooLargeResponse();
    }

    return rawBody;
};

const proxyCopilotKitRequest = async (req: NextRequest) => {
    const contentType = req.headers.get("content-type");
    const accept = req.headers.get("accept");
    const authorization = req.headers.get("authorization");
    let rawBody: string | undefined;
    try {
        rawBody = await readBoundedBody(req);
    } catch (response) {
        if (response instanceof Response) {
            return response;
        }
        throw response;
    }

    const backendResponse = await fetch(buildBackendCopilotKitUrl(req), {
        method: req.method,
        headers: {
            ...(contentType ? { "Content-Type": contentType } : {}),
            ...(accept ? { Accept: accept } : {}),
            ...(authorization ? { Authorization: authorization } : {}),
        },
        body: rawBody,
    });

    return new Response(backendResponse.body, {
        status: backendResponse.status,
        headers: {
            "Content-Type": backendResponse.headers.get("content-type") ?? "application/json",
            "Cache-Control": backendResponse.headers.get("cache-control") ?? "no-cache, no-transform",
        },
    });
};

type RuntimeInfoPayload = {
    version?: string;
    sdkVersion?: string;
    agents?:
    | Record<string, { description?: string; capabilities?: Record<string, unknown> }>
    | Array<{
        id?: string;
        name?: string;
        description?: string;
        capabilities?: Record<string, unknown>;
    }>;
    audioFileTranscriptionEnabled?: boolean;
    mode?: string;
    intelligence?: unknown;
    a2uiEnabled?: boolean;
    openGenerativeUIEnabled?: boolean;
    licenseStatus?: string;
};

type SingleRouteEnvelope = {
    method?: string;
    params?: {
        agentId?: string;
    };
    body?: unknown;
};

const normalizeRuntimeInfo = (payload: RuntimeInfoPayload) => {
    const normalizedAgents = Array.isArray(payload.agents)
        ? Object.fromEntries(
            payload.agents
                .map((agent) => {
                    const id = agent.id ?? agent.name;
                    if (!id) {
                        return null;
                    }

                    return [
                        id,
                        {
                            description: agent.description ?? "",
                            capabilities: agent.capabilities ?? {},
                        },
                    ] as const;
                })
                .filter((entry): entry is readonly [string, { description: string; capabilities: Record<string, unknown> }] => entry !== null),
        )
        : payload.agents ?? {};

    return {
        version: payload.version ?? payload.sdkVersion,
        agents: normalizedAgents,
        audioFileTranscriptionEnabled: payload.audioFileTranscriptionEnabled ?? false,
        mode: payload.mode,
        intelligence: payload.intelligence,
        a2uiEnabled: payload.a2uiEnabled ?? false,
        openGenerativeUIEnabled: payload.openGenerativeUIEnabled ?? false,
        licenseStatus: payload.licenseStatus,
    };
};

const proxyInfo = async (req: NextRequest) => {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    let rawBody = "{}";
    if (req.method === "POST") {
        try {
            rawBody = (await readBoundedBody(req)) || "{}";
        } catch (response) {
            if (response instanceof Response) {
                return response;
            }
            throw response;
        }
    }

    const backendResponse = await fetch(`${BACKEND_COPILOTKIT_URL}info`, {
        method: "POST",
        headers,
        body: rawBody,
    });

    const payload = (await backendResponse.json()) as RuntimeInfoPayload;
    const normalizedPayload = normalizeRuntimeInfo(payload);

    return Response.json(normalizedPayload, {
        status: backendResponse.status,
    });
};

const proxyRun = async (req: NextRequest) => {
    let rawBody: string;
    try {
        rawBody = (await readBoundedBody(req)) || "{}";
    } catch (response) {
        if (response instanceof Response) {
            return response;
        }
        throw response;
    }
    let requestBody = rawBody;

    try {
        const envelope = JSON.parse(rawBody) as SingleRouteEnvelope;
        if (envelope.method === "agent/run") {
            requestBody = JSON.stringify(envelope.body ?? {});
        }
    } catch {
        // Keep the original request body for legacy path-based run requests.
    }

    const backendResponse = await fetch(BACKEND_AGUI_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: req.headers.get("accept") ?? "text/event-stream",
        },
        body: requestBody,
    });

    return new Response(backendResponse.body, {
        status: backendResponse.status,
        headers: {
            "Content-Type": backendResponse.headers.get("content-type") ?? "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
};

const isSingleInfoRequest = async (req: NextRequest) => {
    if (!req.nextUrl.pathname.endsWith("/copilotkit") || req.method !== "POST") {
        return false;
    }

    try {
        const json = (await req.clone().json()) as SingleRouteEnvelope;
        return json.method === "info";
    } catch {
        return false;
    }
};

const isSingleRunRequest = async (req: NextRequest) => {
    if (!req.nextUrl.pathname.endsWith("/copilotkit") || req.method !== "POST") {
        return false;
    }

    try {
        const json = (await req.clone().json()) as SingleRouteEnvelope;
        return json.method === "agent/run";
    } catch {
        return false;
    }
};

const isSingleConnectRequest = async (req: NextRequest) => {
    if (!req.nextUrl.pathname.endsWith("/copilotkit") || req.method !== "POST") {
        return false;
    }

    try {
        const json = (await req.clone().json()) as SingleRouteEnvelope;
        return json.method === "agent/connect";
    } catch {
        return false;
    }
};

export const GET = async (req: NextRequest) => {
    if (isInfoEndpoint(req)) {
        return proxyInfo(req);
    }

    return proxyCopilotKitRequest(req);
};

export const POST = async (req: NextRequest) => {
    if (isInfoEndpoint(req) || (await isSingleInfoRequest(req))) {
        return proxyInfo(req);
    }

    if (await isSingleConnectRequest(req)) {
        return new Response(null, { status: 204 });
    }

    if (isRunEndpoint(req) || (await isSingleRunRequest(req))) {
        return proxyRun(req);
    }

    return proxyCopilotKitRequest(req);
};