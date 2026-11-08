import type { Metadata } from "next";
import { SessionsList } from "@/components/account/SessionsList";
import { requirePageUser } from "@/lib/auth/session";
import { listActiveSessions } from "@/services/users";

export const metadata: Metadata = { title: "Devices", robots: { index: false, follow: false } };

export default async function SessionsPage() {
  const user = await requirePageUser({ next: "/account/sessions" });
  const sessions = await listActiveSessions(user.id).catch(() => []);
  return (
    <div>
      <p className="eyebrow">Security</p>
      <h1 className="mt-2 text-3xl">Signed-in devices</h1>
      <p className="mt-2 text-sm text-muted">Review sessions and sign out devices you do not recognise.</p>
      <div className="mt-8">
        <SessionsList initial={sessions} current={user.sessionId} />
      </div>
    </div>
  );
}
