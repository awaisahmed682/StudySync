"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

export async function updateSettings(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse({
    targetGpa: formData.get("targetGpa") || 3.0,
    routineMode: formData.get("routineMode") || "STANDARD",
    timezone: formData.get("timezone") || "UTC",
    attendanceThreshold: formData.get("attendanceThreshold") || 75,
    gpaScale: formData.get("gpaScale") || 4,
    pomodoroWork: formData.get("pomodoroWork") || 25,
    pomodoroBreak: formData.get("pomodoroBreak") || 5,
    digestEnabled: formData.get("digestEnabled") === "true" || formData.get("digestEnabled") === "on",
    emailEnabled: formData.get("emailEnabled") === "true" || formData.get("emailEnabled") === "on",
    reminderLead24h: formData.get("reminderLead24h") === "true" || formData.get("reminderLead24h") === "on",
    reminderLead3h: formData.get("reminderLead3h") === "true" || formData.get("reminderLead3h") === "on",
    reminderLead1h: formData.get("reminderLead1h") === "true" || formData.get("reminderLead1h") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid settings" };

  const { targetGpa, ...settingsData } = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: { targetGpa },
  });
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { ...settingsData, userId: user.id },
    update: settingsData,
  });
  revalidatePath("/settings");
  revalidatePath("/");
}