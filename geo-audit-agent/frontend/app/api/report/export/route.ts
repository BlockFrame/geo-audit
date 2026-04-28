import { buildVerboseReportMarkdown, createReportFileNameBase } from "@/lib/report-export";
import { GeoReport } from "@/lib/types";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EXPORT_REQUEST_BYTES = 512 * 1024;
const MAX_MARKDOWN_CHARS = 200_000;
const MAX_ARRAY_ITEMS = 200;
const MAX_STRING_CHARS = 20_000;

type ExportRequestBody = {
  format?: "md" | "pdf";
  report?: GeoReport;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const isBoundedString = (value: unknown, maxLength = MAX_STRING_CHARS): value is string => (
  typeof value === "string" && value.length <= maxLength
);

const isBoundedStringArray = (value: unknown): value is string[] => (
  Array.isArray(value)
  && value.length <= MAX_ARRAY_ITEMS
  && value.every((item) => isBoundedString(item))
);

const isValidExportFormat = (value: unknown): value is "md" | "pdf" => value === "md" || value === "pdf";

const isValidReportPayload = (value: unknown): value is GeoReport => {
  if (!isPlainObject(value)) {
    return false;
  }

  const report = value as Record<string, unknown>;

  if (report.url !== undefined && !isBoundedString(report.url, 2048)) {
    return false;
  }
  if (report.business_type !== undefined && !isBoundedString(report.business_type, 256)) {
    return false;
  }
  if (report.llms_txt_status !== undefined && !isBoundedString(report.llms_txt_status, 128)) {
    return false;
  }
  if (report.llms_txt_url !== undefined && !isBoundedString(report.llms_txt_url, 2048)) {
    return false;
  }
  if (report.llms_txt_recommended !== undefined && !isBoundedString(report.llms_txt_recommended)) {
    return false;
  }
  if (report.audit_date !== undefined && !isBoundedString(report.audit_date, 64)) {
    return false;
  }
  if (report.schema_types !== undefined && !isBoundedStringArray(report.schema_types)) {
    return false;
  }
  if (report.schema_recommendations !== undefined && !isBoundedStringArray(report.schema_recommendations)) {
    return false;
  }

  if (report.crawler_matrix !== undefined) {
    if (!Array.isArray(report.crawler_matrix) || report.crawler_matrix.length > MAX_ARRAY_ITEMS) {
      return false;
    }
  }
  if (report.meta_issues !== undefined) {
    if (!Array.isArray(report.meta_issues) || report.meta_issues.length > MAX_ARRAY_ITEMS) {
      return false;
    }
  }
  if (report.recommendations !== undefined) {
    if (!Array.isArray(report.recommendations) || report.recommendations.length > MAX_ARRAY_ITEMS) {
      return false;
    }
  }

  return true;
};

const wrapText = (text: string, maxChars: number) => {
  const wrapped: string[] = [];

  for (const rawLine of text.split("\n")) {
    if (rawLine.length <= maxChars) {
      wrapped.push(rawLine);
      continue;
    }

    let current = "";
    for (const word of rawLine.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxChars && current) {
        wrapped.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    wrapped.push(current);
  }

  return wrapped;
};

const buildPdf = async (markdown: string, title: string) => {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const document = await PDFDocument.create();
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const titleSize = 18;
  const bodySize = 9;
  const lineHeight = 12;
  const maxChars = 92;

  let page = document.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  const addPage = () => {
    page = document.addPage([pageWidth, pageHeight]);
    cursorY = pageHeight - margin;
  };

  page.drawText(title, {
    x: margin,
    y: cursorY,
    size: titleSize,
    font: boldFont,
    color: rgb(0.08, 0.14, 0.24),
  });
  cursorY -= 26;

  for (const line of wrapText(markdown, maxChars)) {
    if (cursorY <= margin) {
      addPage();
    }

    const font = line.startsWith("#") ? boldFont : regularFont;
    const size = line.startsWith("# ") ? 14 : line.startsWith("## ") ? 11 : bodySize;
    page.drawText(line, {
      x: margin,
      y: cursorY,
      size,
      font,
      color: rgb(0.12, 0.16, 0.24),
    });
    cursorY -= line.startsWith("#") ? 16 : lineHeight;
  }

  return document.save();
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_EXPORT_REQUEST_BYTES) {
    return Response.json({ error: "Export payload too large" }, { status: 413 });
  }

  let body: ExportRequestBody;
  try {
    body = JSON.parse(rawBody) as ExportRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const format = body.format ?? "md";
  const report = body.report;

  if (!isValidExportFormat(format)) {
    return Response.json({ error: "Unsupported export format" }, { status: 400 });
  }

  if (!isValidReportPayload(report)) {
    return Response.json({ error: "Missing report payload" }, { status: 400 });
  }

  const markdown = buildVerboseReportMarkdown(report);
  if (markdown.length > MAX_MARKDOWN_CHARS) {
    return Response.json({ error: "Export content too large" }, { status: 413 });
  }

  const fileNameBase = createReportFileNameBase(report);

  if (format === "pdf") {
    const pdfBytes = await buildPdf(markdown, `${fileNameBase}.pdf`);
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileNameBase}.pdf"`,
      },
    });
  }

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileNameBase}.md"`,
    },
  });
}