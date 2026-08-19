import "server-only";

import type {
  Notification,
  NotificationChannel,
  NotificationType,
} from "@prisma/client";

export type DispatchMessage = {
  userId: string;
  email: string;
  name: string;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  body: string;
  dedupeKey?: string;
};

export interface NotificationProvider {
  channel: NotificationChannel;
  /** Send a message out of band (email/push/webhook). Should be idempotent. */
  send(message: DispatchMessage): Promise<boolean>;
}

/**
 * Noop provider: logs the message but never persists anything.
 * Used as a safe fallback when a real provider is not configured.
 */
export class NoopProvider implements NotificationProvider {
  channel: NotificationChannel;
  constructor(channel: NotificationChannel) {
    this.channel = channel;
  }
  async send(message: DispatchMessage) {
    console.log(
      `[${this.channel}][STUB] -> ${message.email}: ${message.title} — ${message.body}`
    );
    return true;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailTemplate(title: string, body: string, name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #e4e4e7;">
                <span style="font-size:18px;font-weight:700;color:#4f46e5;">StudySync</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 4px;color:#71717a;font-size:13px;">Hi ${escapeHtml(name)},</p>
                <h2 style="margin:0 0 12px;color:#18181b;font-size:18px;line-height:1.4;">${escapeHtml(title)}</h2>
                <p style="margin:0;color:#3f3f46;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(body)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#fafafa;border-top:1px solid #e4e4e7;">
                <p style="margin:0;color:#a1a1aa;font-size:12px;">Sent by StudySync · your smart study companion</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Email provider backed by Resend (https://resend.com).
 * Requires RESEND_API_KEY; EMAIL_FROM can be overridden (defaults to the
 * shared Resend onboarding domain, which only sends to the account owner
 * until you verify your own domain).
 *
 * Falls back to Noop-style logging when RESEND_API_KEY is absent so the
 * scheduler never crashes in environments where email isn't configured.
 */
export class EmailProvider implements NotificationProvider {
  channel: NotificationChannel = "EMAIL";
  private apiKey: string | undefined;
  private from: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.from =
      process.env.EMAIL_FROM ?? "StudySync <onboarding@resend.dev>";
  }

  async send(message: DispatchMessage) {
    if (!this.apiKey) {
      console.log(
        `[EMAIL][STUB] -> ${message.email}: ${message.title} — ${message.body} (set RESEND_API_KEY to enable)`
      );
      return true;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.email],
          subject: `${message.title} — StudySync`,
          html: emailTemplate(message.title, message.body, message.name),
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        console.error(
          `[EMAIL] Resend returned ${response.status} for ${message.email}: ${detail}`
        );
        return false;
      }
      return true;
    } catch (e) {
      console.error(`[EMAIL] Failed to send to ${message.email}:`, e);
      return false;
    }
  }
}

export function getProviders(): NotificationProvider[] {
  return [new EmailProvider(), new NoopProvider("PUSH"), new NoopProvider("WEBHOOK")];
}

/** Convenience for the engine: serialize a Notification row for transport. */
export type { Notification };