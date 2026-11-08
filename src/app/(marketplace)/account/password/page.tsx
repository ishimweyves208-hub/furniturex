import type { Metadata } from "next";
import { PasswordForm } from "@/components/account/PasswordForm";
import { requirePageUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Password", robots: { index: false, follow: false } };

export default async function PasswordPage() {
  await requirePageUser({ next: "/account/password" });
  return (
    <div>
      <p className="eyebrow">Security</p>
      <h1 className="mt-2 text-3xl">Password</h1>
      <p className="mt-2 text-sm text-muted">Choose a strong, unique password for your account.</p>
      <div className="mt-8">
        <PasswordForm />
      </div>
    </div>
  );
}
