"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Spinner } from "@/components/ui/Feedback";

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<{ status: "loading" | "success" | "error"; message?: string }>({
    status: token ? "loading" : "error",
    message: token ? undefined : "This verification link is missing its token.",
  });

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as
          | { ok: true; data: { email: string } }
          | { ok: false; error: { message: string } };
        if (payload.ok) {
          setState({
            status: "success",
            message: `${payload.data.email} is verified. You are all set.`,
          });
        } else {
          setState({ status: "error", message: payload.error.message });
        }
      } catch {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: "We could not verify this link. Please try again." });
      }
    })();
    return () => controller.abort();
  }, [token]);

  return (
    <div>
      <p className="eyebrow">Email verification</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Confirm your email</h1>
      <div className="mt-6">
        {state.status === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> Verifying your email…
          </p>
        ) : state.status === "success" ? (
          <Alert tone="success" title="Email verified">{state.message}</Alert>
        ) : (
          <Alert tone="error" title="Verification failed">{state.message}</Alert>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/account" className="text-charcoal underline underline-offset-4">Go to account</Link>
        <Link href="/marketplace" className="text-muted underline underline-offset-4">Browse marketplace</Link>
      </div>
    </div>
  );
}
