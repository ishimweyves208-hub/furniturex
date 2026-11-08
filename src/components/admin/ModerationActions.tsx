"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Feedback";

type ModerationAction = "approve" | "reject" | "request_changes" | "remove" | "suspend" | "restore";

const LABELS: Record<ModerationAction, string> = {
  approve: "Approve",
  reject: "Reject",
  request_changes: "Request changes",
  remove: "Remove",
  suspend: "Suspend",
  restore: "Restore",
};

export function ModerationActions({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<ModerationAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReason, setShowReason] = useState(false);

  const actions: ModerationAction[] =
    status === "pending"
      ? ["approve", "request_changes", "reject"]
      : status === "approved"
        ? ["suspend", "remove"]
        : status === "suspended" || status === "rejected" || status === "archived"
          ? ["restore", "remove"]
          : ["approve"];

  async function moderate(action: ModerationAction) {
    if ((action === "reject" || action === "request_changes" || action === "suspend" || action === "remove") && !reason.trim()) {
      setShowReason(true);
      setError("Add a reason before continuing.");
      return;
    }
    setPending(action);
    setError(null);
    const response = await fetch(`/api/admin/products/${productId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: reason.trim() || undefined }),
    });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(null);
    if (payload.ok) {
      setReason("");
      setShowReason(false);
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      {showReason || error ? (
        <div className="mb-3">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason shared with the seller"
            className="min-h-[70px]"
            maxLength={1000}
          />
        </div>
      ) : null}
      {error ? <Alert tone="error" className="mb-3">{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={action === "approve" || action === "restore" ? "primary" : action === "remove" ? "danger" : "outline"}
            onClick={() => moderate(action)}
            disabled={pending !== null}
            type="button"
          >
            {pending === action ? "Working…" : LABELS[action]}
          </Button>
        ))}
        <Button size="sm" variant="ghost" type="button" onClick={() => setShowReason((value) => !value)}>
          {showReason ? "Hide reason" : "Add reason"}
        </Button>
      </div>
    </div>
  );
}
