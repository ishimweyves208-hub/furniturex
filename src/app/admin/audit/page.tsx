import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { connectDb } from "@/lib/db/connect";
import { AuditLog } from "@/models/AuditLog";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  await connectDb();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const pageSize = 30;
  const q = typeof params.q === "string" ? params.q : undefined;
  const filter: Record<string, unknown> = {};
  if (q) {
    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100), "i");
    filter.$or = [{ action: pattern }, { actorEmail: pattern }, { targetType: pattern }];
  }
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    AuditLog.countDocuments(filter),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div>
        <p className="eyebrow">Governance</p>
        <h1 className="mt-2 text-3xl">Audit log</h1>
        <p className="mt-2 text-sm text-muted">Immutable record of administrative actions and security-relevant events.</p>
      </div>

      <form method="get" className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input name="q" defaultValue={q} placeholder="Search action, actor or target" className="w-full border border-line bg-white px-3 py-2 text-sm sm:min-w-[15rem] sm:flex-1" />
        <button type="submit" className={buttonClasses("outline", "sm", "justify-center")}>Search</button>
      </form>

      {items.length > 0 ? (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {items.map((entry) => (
              <div key={String(entry._id)} className="border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{entry.action}</p>
                  <span className="shrink-0 text-[11px] text-muted">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">By {entry.actorEmail ?? "System"} · {entry.targetType}</p>
                <p className="mt-1 break-all font-mono text-[10px] text-muted">{entry.targetId ?? "—"}</p>
                {entry.metadata ? (
                  <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[10px] text-muted">{JSON.stringify(entry.metadata)}</pre>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 hidden overflow-x-auto border border-line bg-white md:block">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Target</th>
                <th className="px-4 py-3 font-semibold">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((entry) => (
                <tr key={String(entry._id)}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDateTime(entry.createdAt)}</td>
                  <td className="px-4 py-3 font-medium">{entry.action}</td>
                  <td className="px-4 py-3 text-xs">{entry.actorEmail ?? "System"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-muted">{entry.targetType}</span>
                    <br />
                    <span className="font-mono text-[10px]">{entry.targetId ?? "—"}</span>
                  </td>
                  <td className="max-w-[24rem] px-4 py-3">
                    <pre className="overflow-hidden text-ellipsis whitespace-pre-wrap break-all font-mono text-[10px] text-muted">
                      {entry.metadata ? JSON.stringify(entry.metadata) : "—"}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <EmptyState className="mt-6" icon={<ScrollText className="h-7 w-7" />} title="No audit entries" description="Administrative actions will be recorded here." />
      )}

      <Pagination page={page} totalPages={totalPages} pathname="/admin/audit" searchParams={params} />
    </div>
  );
}
