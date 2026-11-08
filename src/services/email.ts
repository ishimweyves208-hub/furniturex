import { emailConfig } from "@/lib/env";

export interface EmailResult {
  sent: boolean;
  reason?: "not_configured" | "provider_error";
}

/**
 * Transactional email via Resend's HTTP API. If credentials are absent we
 * return an explicit not-configured result rather than pretending to send.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const config = emailConfig();
  if (!config.configured || !config.apiKey || !config.from) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!response.ok) {
      console.error("[email] Resend rejected the request", response.status);
      return { sent: false, reason: "provider_error" };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] failed to send", error);
    return { sent: false, reason: "provider_error" };
  }
}
