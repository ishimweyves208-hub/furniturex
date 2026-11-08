"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function dashboardFor(role: string) {
  if (role === "superadmin") return "/admin";
  if (role === "seller") return "/seller";
  return "/account";
}

function safeNext(value: string | undefined): string | null {
  if (!value) return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as
        | { ok: true; data: { user: { role: string } } }
        | { ok: false; error: { message: string } };
      if (payload.ok) {
        router.push(safeNext(next) ?? dashboardFor(payload.data.user.role));
        router.refresh();
      } else {
        setError(payload.error.message);
      }
    });
  }

  return (
    <div className="max-w-md mx-auto">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Welcome back</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">Sign in</h1>
      <p className="mt-3 text-sm text-text-secondary">
        Access your orders, wishlist and seller studio.
      </p>
      {notice ? (
        <div className="mt-5 p-3 border border-border bg-background rounded-lg text-sm text-text-secondary">{notice}</div>
      ) : null}
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
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="form-label">Password</label>
            <Link href="/forgot-password" className="text-xs text-text-secondary hover:text-text-primary">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-text-secondary">
        New to FurnitureX?{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="text-text-primary underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
