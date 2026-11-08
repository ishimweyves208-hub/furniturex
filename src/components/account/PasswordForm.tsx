"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldHint } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      setSuccess("Password changed. Other sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <section className="border border-line bg-white p-6">
      <h2 className="font-display text-xl">Change password</h2>
      <p className="mt-1 text-sm text-muted">Use at least 8 characters with a mix of letters and numbers.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="current" required>Current password</Label>
          <Input id="current" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="new" required>New password</Label>
          <Input id="new" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="confirm" required>Confirm new password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {success ? <Alert tone="success">{success}</Alert> : null}
        <Button type="submit" disabled={pending}>{pending ? "Updating…" : "Update password"}</Button>
        <FieldHint>You will remain signed in on this device.</FieldHint>
      </form>
    </section>
  );
}
