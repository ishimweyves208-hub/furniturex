"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: { message: string; details?: { message: string }[] } };
      if (payload.ok) {
        setDone(true);
        setTimeout(() => router.push("/login?notice=Password+updated.+Please+sign+in."), 1200);
      } else {
        setError(payload.error.details?.[0]?.message ?? payload.error.message);
      }
    });
  }

  if (!token) {
    return (
      <div>
        <p className="eyebrow">Password recovery</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Reset link required</h1>
        <Alert tone="error" className="mt-6">
          This page needs a valid reset link. Request a new one from the sign-in page.
        </Alert>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm underline underline-offset-4">
          Request a reset link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Password recovery</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-3 text-sm text-muted">Use a strong password you have not used elsewhere.</p>
      {done ? (
        <Alert tone="success" title="Password updated" className="mt-6">
          Redirecting you to sign in…
        </Alert>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="password" className="form-label">New password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}
