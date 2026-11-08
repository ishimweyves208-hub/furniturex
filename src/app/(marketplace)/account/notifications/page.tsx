import type { Metadata } from "next";
import { NotificationList } from "@/components/account/NotificationList";
import { requirePageUser } from "@/lib/auth/session";
import { listNotifications } from "@/services/notifications";

export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };

export default async function NotificationsPage() {
  const user = await requirePageUser({ next: "/account/notifications" });
  const result = await listNotifications(user.id, { pageSize: 50 }).catch(() => ({
    items: [],
    total: 0,
    unread: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  }));
  return (
    <div>
      <p className="eyebrow">Inbox</p>
      <h1 className="mt-2 text-3xl">Notifications</h1>
      <p className="mt-2 text-sm text-muted">Updates about orders, products and your account.</p>
      <div className="mt-8">
        <NotificationList initial={result.items} />
      </div>
    </div>
  );
}
