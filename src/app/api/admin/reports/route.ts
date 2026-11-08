import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { generateReport, type ReportType } from "@/services/analytics";
import { REPORT_TYPES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDate(value: string | null, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
}

function csvValue(value: string | number | undefined): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: NextRequest) {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "sales";
    if (!REPORT_TYPES.includes(type as ReportType)) {
      throw ApiError.badRequest("Unknown report type.");
    }
    const from = parseDate(searchParams.get("from"));
    const to = parseDate(searchParams.get("to"), true);
    if (from && to && from > to) throw ApiError.badRequest("The start date must precede the end date.");
    const report = await generateReport(type as ReportType, from, to);

    if (searchParams.get("format") === "csv") {
      const header = report.columns.map((column) => csvValue(column.label)).join(",");
      const lines = report.rows.map((row) =>
        report.columns.map((column) => csvValue(row[column.key])).join(","),
      );
      const csv = [header, ...lines].join("\r\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="furniturex-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return jsonOk(report);
  } catch (error) {
    return jsonError(error);
  }
}
