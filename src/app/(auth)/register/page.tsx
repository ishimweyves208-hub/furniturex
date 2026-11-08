import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { dashboardPathForRole, getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(dashboardPathForRole(user.role));
  const next = typeof params.next === "string" ? params.next : undefined;
  const role = params.role === "seller" ? "seller" : "customer";
  return <RegisterForm next={next} initialRole={role} />;
}
