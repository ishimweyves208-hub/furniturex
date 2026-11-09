import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { Pagination } from "@/components/ui/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { listUsers } from "@/services/users";
import { USER_ROLES, ACCOUNT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);
  const role = typeof params.role === "string" && USER_ROLES.includes(params.role as never) ? params.role : undefined;
  const status = typeof params.status === "string" && ACCOUNT_STATUSES.includes(params.status as never) ? params.status : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const result = await listUsers({ page, pageSize: 20, role, status, q });

  return (
    <div>
      <div>
        <p className="eyebrow">Accounts</p>
        <h1 className="mt-2 text-3xl">Users</h1>
        <p className="mt-2 text-sm text-muted">{result.total} account{result.total === 1 ? "" : "s"} on the platform.</p>
      </div>

      <form method="get" className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input name="q" defaultValue={q} placeholder="Search name, email or shop" className="w-full border border-line bg-white px-3 py-2 text-sm sm:min-w-[14rem] sm:flex-1" />
        <select name="role" defaultValue={role ?? ""} className="w-full border border-line bg-white px-3 py-2 text-sm sm:w-auto">
          <option value="">All roles</option>
          {USER_ROLES.map((value) => (<option key={value} value={value}>{value}</option>))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="w-full border border-line bg-white px-3 py-2 text-sm sm:w-auto">
          <option value="">All statuses</option>
          {ACCOUNT_STATUSES.map((value) => (<option key={value} value={value}>{value}</option>))}
        </select>
        <button type="submit" className={buttonClasses("outline", "sm", "justify-center")}>Filter</button>
      </form>

      {result.items.length > 0 ? (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {result.items.map((user) => (
              <div key={user.id} className="border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                    {user.shopName ? <p className="truncate text-xs text-muted">Shop: {user.shopName}</p> : null}
                  </div>
                  <Link href={`/admin/users/${user.id}`} className={buttonClasses("ghost", "sm")}>Open</Link>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="default">{user.role}</Badge>
                  <Badge tone={user.accountStatus}>{user.accountStatus}</Badge>
                  {user.sellerStatus ? <Badge tone={user.sellerStatus}>{user.sellerStatus}</Badge> : null}
                  <span className="ml-auto text-[11px] text-muted">Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 hidden overflow-x-auto border border-line bg-white md:block">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                    {user.shopName ? <p className="text-xs text-muted">Shop: {user.shopName}</p> : null}
                  </td>
                  <td className="px-4 py-3"><Badge tone="default">{user.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge tone={user.accountStatus}>{user.accountStatus}</Badge>
                    {user.sellerStatus ? <p className="mt-1 text-[11px] text-muted">Seller: {user.sellerStatus}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/users/${user.id}`} className={buttonClasses("ghost", "sm")}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <EmptyState className="mt-6" icon={<Users className="h-7 w-7" />} title="No users found" description="Try changing the filters." />
      )}

      <Pagination page={result.page} totalPages={result.totalPages} pathname="/admin/users" searchParams={params} />
    </div>
  );
}
