"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/utils";

export interface SessionSummary {
  id: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export function SessionsList({ initial, current }: { initial: SessionSummary[]; current: string }) {
  const [sessions, setSessions] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();

  async function revoke(id: string) {
    setPending(id);
    setError(null);
    const response = await fetch(`/api/account/sessions?id=${id}`, { method: "DELETE" });
    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: { message: string } };
    setPending(null);
    if (payload.ok) {
      setSessions((current) => current.filter((session) => session.id !== id));
      router.refresh();
    } else {
      setError(payload.error.message);
    }
  }

  return (
    <div>
      {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
      <ul className="divide-y divide-line border border-line bg-white">
        {sessions.map((session) => {
          const isCurrent = session.id === current;
          const mobile = /mobile|android|iphone/i.test(session.userAgent);
          return (
            <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-muted">
                  {mobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-sm">
                    {session.userAgent}
                    {isCurrent ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-success">This device</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Last active {formatDateTime(session.lastUsedAt)} · Expires {formatDateTime(session.expiresAt)}
                  </p>
                </div>
              </div>
              {!isCurrent ? (
                <Button variant="ghost" size="sm" onClick={() => revoke(session.id)} disabled={pending === session.id}>
                  {pending === session.id ? "Revoking…" : "Sign out"}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
