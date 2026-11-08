"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError, FieldHint } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";

export function ProfileForm({
  name: initialName,
  phone: initialPhone,
  avatar: initialAvatar,
  email,
  emailVerified,
}: {
  name: string;
  phone: string;
  avatar: string;
  email: string;
  emailVerified: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, avatar }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      setSuccess("Profile updated.");
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    setSuccess(null);
    const response = await fetch("/api/auth/resend-verification", { method: "POST" });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setResending(false);
    if (payload.ok) setSuccess("Verification email sent. Check your inbox.");
    else setError(payload.error.message);
  }

  return (
    <div className="space-y-6">
      <section className="border border-line bg-white p-6">
        <h2 className="font-display text-xl">Personal details</h2>
        <p className="mt-1 text-sm text-muted">This is how you appear on orders and reviews.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name" required>Full name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled readOnly />
            <FieldHint>Email changes are not available in this release.</FieldHint>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} placeholder="+1 555 000 0000" />
          </div>
          <div>
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input id="avatar" value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://…" maxLength={500} />
            <FieldHint>Optional. Use a public HTTPS image URL.</FieldHint>
          </div>
          {error ? <Alert tone="error">{error}</Alert> : null}
          {success ? <Alert tone="success">{success}</Alert> : null}
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      </section>

      <section className="border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Email verification</h2>
            <p className="mt-1 text-sm text-muted">
              {emailVerified
                ? "Your email address is verified."
                : "Verify your email to secure your account and receive order updates."}
            </p>
          </div>
          {emailVerified ? (
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-success">Verified</span>
          ) : (
            <Button variant="outline" size="sm" onClick={resend} disabled={resending}>
              {resending ? "Sending…" : "Resend verification"}
            </Button>
          )}
        </div>
        <FieldError>{error}</FieldError>
      </section>
    </div>
  );
}
