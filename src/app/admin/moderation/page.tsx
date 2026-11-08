import type { Metadata } from "next";
import { ContentModeration } from "@/components/admin/ContentModeration";
import { getReviewModerationQueue } from "@/services/analytics";

export const metadata: Metadata = { title: "Moderation" };

export default async function AdminModerationPage() {
  const queue = await getReviewModerationQueue(100);
  return (
    <div>
      <p className="eyebrow">Community</p>
      <h1 className="mt-2 text-3xl">Content moderation</h1>
      <p className="mt-2 text-sm text-muted">Hide abusive or off-topic comments and reviews. Hidden content is removed from public pages.</p>
      <div className="mt-8">
        <ContentModeration
          comments={queue.comments.map((entry) => ({ ...entry, status: entry.status as "visible" | "hidden" }))}
          reviews={queue.reviews.map((entry) => ({ ...entry, status: entry.status as "visible" | "hidden" }))}
        />
      </div>
    </div>
  );
}
