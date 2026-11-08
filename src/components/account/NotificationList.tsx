"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/utils";
import type { NotificationDTO } from "@/types";

export function NotificationList({ initial }: { initial: NotificationDTO[] }) {
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const unread = items.filter((item) => !item.readAt).length;

  async function markAll() {
    setPending(true);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
    setPending(false);
    router.refresh();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item)),
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="h-7 w-7" />}
        title="Nothing new"
        description="Order updates, moderation decisions and account notices will appear here."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{unread} unread</p>
        <Button variant="outline" size="sm" onClick={markAll} disabled={pending || unread === 0}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </div>
      <ul className="mt-4 divide-y divide-line border border-line bg-white">
        {items.map((item) => (
          <li key={item.id} className={`p-4 ${item.readAt ? "" : "bg-primary-soft"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {!item.readAt ? <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-label="Unread" /> : null}
                  <p className="text-sm font-medium">{item.title}</p>
                  <Badge tone="default">{item.type}</Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.message}</p>
                <p className="mt-1 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                {!item.readAt ? (
                  <button type="button" onClick={() => markOne(item.id)} className="text-xs text-muted underline underline-offset-4 hover:text-charcoal">
                    Mark read
                  </button>
                ) : null}
                {item.link ? (
                  <Link href={item.link} onClick={() => markOne(item.id)} className="text-xs text-charcoal underline underline-offset-4">
                    Open
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
