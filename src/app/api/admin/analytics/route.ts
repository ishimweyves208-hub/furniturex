import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { getAdminOverview } from "@/services/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    return jsonOk(await getAdminOverview());
  } catch (error) {
    return jsonError(error);
  }
}
