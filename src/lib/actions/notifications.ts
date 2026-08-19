"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  runDailyDigest,
  runUserReminderCheck,
} from "@/lib/notifications/engine";

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function clearNotifications() {
  const user = await requireUser();
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  revalidatePath("/notifications");
}

/** On-demand engine run so reminders stay fresh even without the background job. */
export async function runReminderCheck() {
  const user = await requireUser();
  await runUserReminderCheck(user.id);
  revalidatePath("/notifications");
}

export async function runDigestCheck() {
  const user = await requireUser();
  await runDailyDigest(user.id);
  revalidatePath("/notifications");
}