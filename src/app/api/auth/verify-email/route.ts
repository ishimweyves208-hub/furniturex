import type { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit, getClientIp } from "@/lib/security";
import { verifyEmailToken } from "@/services/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(20).max(200) });

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`verify-email:${getClientIp(request)}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    const input = schema.parse(await parseJsonBody(request));
    const email = await verifyEmailToken(input.token);
    return jsonOk({ email, verified: true });
  } catch (error) {
    return jsonError(error);
  }
}
