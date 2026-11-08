import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { dashboardPathForRole, getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(dashboardPathForRole(user.role));
  const next = typeof params.next === "string" ? params.next : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  return <LoginForm next={next} notice={notice} />;
}
