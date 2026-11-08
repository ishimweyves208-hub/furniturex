import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/ProfileForm";
import { requirePageUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const user = await requirePageUser({ next: "/account/profile" });
  return (
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl">Profile</h1>
      <p className="mt-2 text-sm text-muted">Keep your contact details up to date for deliveries.</p>
      <div className="mt-8">
        <ProfileForm
          name={user.name}
          phone={user.phone ?? ""}
          avatar={user.avatar ?? ""}
          email={user.email}
          emailVerified={user.emailVerified}
        />
      </div>
    </div>
  );
}
