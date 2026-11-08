"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as
        | { ok: true; data: { message: string } }
        | { ok: false; error: { message: string } };
      if (payload.ok) setMessage(payload.data.message);
      else setError(payload.error.message);
    });
  }

  return (
    <div>
      <p className="eyebrow">Password recovery</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-3 text-sm text-muted">
        Enter the email on your account and we will send a reset link if it exists.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="form-label">Email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        {message ? <Alert tone="success">{message}</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-charcoal underline underline-offset-4">Back to sign in</Link>
      </p>
    </div>
  );
}
