import type { NextRequest } from "next/server";
import { ApiError, jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit, getClientIp } from "@/lib/security";
import { contactSchema } from "@/lib/validation/product";
import { sendEmail } from "@/services/email";
import { getPlatformSettings } from "@/services/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`contact:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      message: "Too many messages sent. Please try again later.",
    });
    const input = contactSchema.parse(await parseJsonBody(request));
    const settings = await getPlatformSettings();
    const result = await sendEmail({
      to: settings.supportEmail,
      subject: `[FurnitureX contact] ${input.subject}`,
      text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p><p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>`,
      replyTo: input.email,
    });
    if (!result.sent) {
      throw new ApiError(
        503,
        "CONFIGURATION_REQUIRED",
        "Email delivery is not configured. Please contact support directly.",
      );
    }
    return jsonOk({ received: true });
  } catch (error) {
    return jsonError(error);
  }
}
