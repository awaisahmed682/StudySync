"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scheduleSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { generateStudyPlan } from "@/lib/scheduling/allocation";

export async function createSchedule(formData: FormData) {
  const user = await requireUser();
  const parsed = scheduleSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type") || "FIXED",
    dayOfWeek: formData.get("dayOfWeek") ?? null,
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    isRecurring: formData.get("isRecurring") === "true" || formData.get("isRecurring") === "on",
    relatedTaskId: formData.get("relatedTaskId") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid schedule");

  // For recurring slots, normalize the date portion to a fixed epoch day (time-of-day matters only).
  const start = new Date(parsed.data.startTime);
  const end = new Date(parsed.data.endTime);
  if (parsed.data.isRecurring && parsed.data.dayOfWeek != null) {
    start.setFullYear(1970, 0, 1);
    end.setFullYear(1970, 0, 1);
  }

  await prisma.studySchedule.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: start,
      endTime: end,
      isRecurring: parsed.data.isRecurring,
      relatedTaskId: parsed.data.relatedTaskId || null,
    },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function updateSchedule(scheduleId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = scheduleSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type") || "FIXED",
    dayOfWeek: formData.get("dayOfWeek") ?? null,
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    isRecurring: formData.get("isRecurring") === "true" || formData.get("isRecurring") === "on",
    relatedTaskId: formData.get("relatedTaskId") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid schedule");

  const start = new Date(parsed.data.startTime);
  const end = new Date(parsed.data.endTime);
  if (parsed.data.isRecurring && parsed.data.dayOfWeek != null) {
    start.setFullYear(1970, 0, 1);
    end.setFullYear(1970, 0, 1);
  }

  await prisma.studySchedule.updateMany({
    where: { id: scheduleId, userId: user.id },
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: start,
      endTime: end,
      isRecurring: parsed.data.isRecurring,
      relatedTaskId: parsed.data.relatedTaskId || null,
    },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function deleteSchedule(scheduleId: string) {
  const user = await requireUser();
  await prisma.studySchedule.deleteMany({ where: { id: scheduleId, userId: user.id } });
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function moveSchedule(
  scheduleId: string,
  start: string,
  end: string
) {
  const user = await requireUser();
  await prisma.studySchedule.updateMany({
    where: { id: scheduleId, userId: user.id },
    data: { startTime: new Date(start), endTime: new Date(end) },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function runAutoScheduler(previewOnly = false) {
  const user = await requireUser();
  const blocks = await generateStudyPlan(user.id, { preview: previewOnly });
  revalidatePath("/calendar");
  revalidatePath("/");
  return blocks.map((b) => ({
    id: `preview-${b.taskId}-${b.startMs}`,
    title: b.title,
    start: new Date(b.startMs).toISOString(),
    end: new Date(b.endMs).toISOString(),
  }));
}

export async function createScheduleFromCalendar(input: {
  title: string;
  start: string;
  end: string;
}) {
  const user = await requireUser();
  await prisma.studySchedule.create({
    data: {
      userId: user.id,
      title: input.title,
      type: "DYNAMIC",
      startTime: new Date(input.start),
      endTime: new Date(input.end),
      isRecurring: false,
    },
  });
  revalidatePath("/calendar");
}