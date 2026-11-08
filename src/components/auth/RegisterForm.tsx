"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

function safeNext(value: string | undefined): string | null {
  if (!value) return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function RegisterForm({
  next,
  initialRole = "customer",
}: {
  next?: string;
  initialRole?: "customer" | "seller";
}) {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    acceptTerms: false,
  });
  const [role, setRole] = useState<"customer" | "seller">(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function update(key: keyof typeof fields, value: string | boolean) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, role }),
      });
      const payload = (await response.json()) as
        | { ok: true; data: { user: { role: string }; verificationEmailSent: boolean } }
        | { ok: false; error: { message: string; details?: { path: string; message: string }[] } };
      if (payload.ok) {
        const destination =
          safeNext(next) ?? (payload.data.user.role === "seller" ? "/seller" : "/account");
        router.push(destination);
        router.refresh();
      } else {
        const detail = payload.error.details?.[0]?.message;
        setError(detail ?? payload.error.message);
      }
    });
  }

  return (
    <div className="max-w-md mx-auto">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Join FurnitureX</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">Create an account</h1>
      <p className="mt-3 text-sm text-text-secondary">
        Save pieces, place Cash on Delivery orders, or open a seller studio.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-background-alternate p-1">
        {(["customer", "seller"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              role === value
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {value === "customer" ? "Shop furniture" : "Sell furniture"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="form-label">Full name</label>
          <Input
            id="name"
            value={fields.name}
            onChange={(event) => update("name", event.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="form-label">Email</label>
          <Input
            id="email"
            type="email"
            value={fields.email}
            onChange={(event) => update("email", event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        {role === "seller" ? (
          <div>
            <label htmlFor="shopName" className="form-label">Shop name</label>
            <Input
              id="shopName"
              value={fields.shopName}
              onChange={(event) => update("shopName", event.target.value)}
              placeholder="e.g. Northline Woodworks"
              required
            />
          </div>
        ) : null}
        <div>
          <label htmlFor="phone" className="form-label">Phone (optional)</label>
          <Input
            id="phone"
            value={fields.phone}
            onChange={(event) => update("phone", event.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <Input
              id="password"
              type="password"
              value={fields.password}
              onChange={(event) => update("password", event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
            <Input
              id="confirmPassword"
              type="password"
              value={fields.confirmPassword}
              onChange={(event) => update("confirmPassword", event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">
          Use at least 8 characters with a mix of letters and numbers.
        </p>
        <label className="flex items-start gap-2 text-xs leading-relaxed text-text-secondary">
          <input
            type="checkbox"
            checked={fields.acceptTerms}
            onChange={(event) => update("acceptTerms", event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            required
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-text-primary underline underline-offset-4">terms</Link> and{" "}
            <Link href="/privacy" className="text-text-primary underline underline-offset-4">privacy policy</Link>.
          </span>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : role === "seller" ? "Create seller account" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-text-primary underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
