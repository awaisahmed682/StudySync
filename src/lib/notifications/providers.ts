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
 * Stub provider: logs the message but never persists anything.
 * Swap in a real implementation (Resend, Web-Push, Discord/TG/WhatsApp)
 * behind this same interface when credentials are available.
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

export function getProviders(): NotificationProvider[] {
  return [
    new NoopProvider("EMAIL"),
    new NoopProvider("PUSH"),
    new NoopProvider("WEBHOOK"),
  ];
}

/** Convenience for the engine: serialize a Notification row for transport. */
export type { Notification };