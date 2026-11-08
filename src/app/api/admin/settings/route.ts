import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { platformSettingSchema } from "@/lib/validation/product";
import { getPlatformSettings, updatePlatformSettings } from "@/services/settings";
import { recordAudit } from "@/services/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    return jsonOk({ settings: await getPlatformSettings() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser({ roles: ["superadmin"] });
    const input = platformSettingSchema.parse(await parseJsonBody(request));
    const before = await getPlatformSettings();
    const settings = await updatePlatformSettings(input, user.id);
    await recordAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "settings.updated",
      targetType: "platform_setting",
      targetId: "platform",
      metadata: { before, after: settings },
    });
    return jsonOk({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
