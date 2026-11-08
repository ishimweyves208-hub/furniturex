import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getPlatformSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  return (
    <div>
      <p className="eyebrow">Configuration</p>
      <h1 className="mt-2 text-3xl">Platform settings</h1>
      <p className="mt-2 text-sm text-muted">Commerce rules and public marketplace copy.</p>
      <div className="mt-8">
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
