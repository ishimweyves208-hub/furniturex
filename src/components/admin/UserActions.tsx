"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Select, Label } from "@/components/ui/Input";
import type { UserSummaryDTO } from "@/types";

export function UserActions({ user }: { user: UserSummaryDTO }) {
  const [accountStatus, setAccountStatus] = useState(user.accountStatus);
  const [sellerStatus, setSellerStatus] = useState(user.sellerStatus ?? "pending");
  const [role, setRole] = useState(user.role);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    setPending(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountStatus,
        role,
        ...(role === "seller" ? { sellerStatus } : {}),
      }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(false);
    if (payload.ok) {
      setNotice("User updated.");
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor={`role-${user.id}`}>Role</Label>
          <Select id={`role-${user.id}`} value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
            {user.role === "superadmin" ? <option value="superadmin">Superadmin</option> : null}
          </Select>
        </div>
        <div>
          <Label htmlFor={`status-${user.id}`}>Account</Label>
          <Select id={`status-${user.id}`} value={accountStatus} onChange={(event) => setAccountStatus(event.target.value as typeof accountStatus)}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>
        {role === "seller" ? (
          <div>
            <Label htmlFor={`seller-${user.id}`}>Seller</Label>
            <Select id={`seller-${user.id}`} value={sellerStatus} onChange={(event) => setSellerStatus(event.target.value as typeof sellerStatus)}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>
        ) : null}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <Button size="sm" onClick={save} disabled={pending}>{pending ? "Saving…" : "Update user"}</Button>
    </div>
  );
}
