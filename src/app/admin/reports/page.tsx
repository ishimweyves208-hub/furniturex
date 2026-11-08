import type { Metadata } from "next";
import { Download } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { generateReport } from "@/services/analytics";
import { REPORT_TYPES, type ReportType } from "@/lib/constants";

export const metadata: Metadata = { title: "Reports" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(params: Record<string, string | string[] | undefined>, key: string) {
  return typeof params[key] === "string" ? params[key] : undefined;
}

export default async function AdminReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = REPORT_TYPES.includes(param(params, "type") as ReportType)
    ? (param(params, "type") as ReportType)
    : "sales";
  const from = param(params, "from");
  const to = param(params, "to");
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;
  const report = await generateReport(
    type,
    fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
    toDate && !Number.isNaN(toDate.getTime()) ? new Date(toDate.setUTCHours(23, 59, 59, 999)) : undefined,
  );

  const exportParams = new URLSearchParams({ type, format: "csv" });
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  return (
    <div>
      <div>
        <p className="eyebrow">Insights</p>
        <h1 className="mt-2 text-3xl">Reports</h1>
        <p className="mt-2 text-sm text-muted">Export marketplace data for finance, catalogue and growth analysis.</p>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="type" className="form-label">Report</label>
          <select id="type" name="type" defaultValue={type} className="border border-line bg-white px-3 py-2 text-sm">
            {REPORT_TYPES.map((value) => (<option key={value} value={value}>{value}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="form-label">From</label>
          <input id="from" type="date" name="from" defaultValue={from} className="border border-line bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="to" className="form-label">To</label>
          <input id="to" type="date" name="to" defaultValue={to} className="border border-line bg-white px-3 py-2 text-sm" />
        </div>
        <button type="submit" className={buttonClasses("outline", "sm")}>Run report</button>
        <a href={`/api/admin/reports?${exportParams.toString()}`} className={buttonClasses("primary", "sm")}>
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </form>

      <div className="mt-8 border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-xl">{report.title}</h2>
          <p className="mt-1 text-xs text-muted">
            {report.rows.length} row{report.rows.length === 1 ? "" : "s"}
            {report.from ? ` · from ${report.from.slice(0, 10)}` : ""}
            {report.to ? ` · to ${report.to.slice(0, 10)}` : ""}
          </p>
        </div>
        {report.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
                <tr>
                  {report.columns.map((column) => (<th key={column.key} className="whitespace-nowrap px-5 py-3 font-semibold">{column.label}</th>))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row, index) => (
                  <tr key={index}>
                    {report.columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-5 py-3">{row[column.key] ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState className="border-0" title="No data" description="No records match the selected range." />
        )}
      </div>
    </div>
  );
}
