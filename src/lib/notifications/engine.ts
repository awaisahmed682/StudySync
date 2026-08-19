import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  NotificationChannel,
  NotificationType,
  TaskStatus,
} from "@prisma/client";
import {
  getProviders,
  type DispatchMessage,
} from "@/lib/notifications/providers";
import { dayKey, weekKey } from "@/lib/utils";

const THRESHOLDS_HOURS = [24, 3, 1] as const;

type DispatchInput = Omit<
  DispatchMessage,
  "email" | "name" | "userId" | "channel"
> & { taskId?: string };

async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId?: string;
  channel?: NotificationChannel;
  dedupeKey: string;
}) {
  const existing = await prisma.notification.findUnique({
    where: { dedupeKey: input.dedupeKey },
  });
  if (existing) return false;

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      taskId: input.taskId,
      channel: input.channel ?? "IN_APP",
      dedupeKey: input.dedupeKey,
    },
  });
  return notification ? true : false;
}

async function dispatch(userId: string, message: DispatchInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return;

  const providers = getProviders();
  for (const provider of providers) {
    await provider.send({
      userId,
      email: user.email,
      name: user.name,
      channel: provider.channel,
      type: message.type,
      title: message.title,
      body: message.body,
      dedupeKey: message.dedupeKey,
    });
  }
}

export async function runUserReminderCheck(userId: string) {
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);
  if (!user) return;

  const activeStatuses: TaskStatus[] = ["PENDING", "IN_PROGRESS"];
  const tasks = await prisma.academicTask.findMany({
    where: { course: { userId }, status: { in: activeStatuses } },
    include: { course: true },
  });

  const now = Date.now();

  for (const task of tasks) {
    const due = new Date(task.dueDate).getTime();
    if (due <= now) continue;

    const leads = {
      24: settings?.reminderLead24h ?? true,
      3: settings?.reminderLead3h ?? true,
      1: settings?.reminderLead1h ?? true,
    };

    for (const h of THRESHOLDS_HOURS) {
      if (!leads[h]) continue;
      const diffHours = (due - now) / 36e5;
      if (diffHours > h || diffHours <= 0) continue;

      const dedupe = `deadline-${task.id}-${h}h`;
      const created = await createNotification({
        userId,
        type: "DEADLINE",
        title: `Coming up: ${task.title}`,
        body: `${task.title} for ${task.course.courseCode} is due ${
          h === 1 ? "in 1 hour" : `in ${h} hours`
        } (${new Date(task.dueDate).toLocaleString()}).`,
        taskId: task.id,
        channel: "IN_APP",
        dedupeKey: dedupe,
      });
      if (created) {
        await dispatch(userId, {
          type: "DEADLINE",
          title: `Reminder: ${task.title}`,
          body: bodyForTask(task.title, task.course.courseCode, h, task.dueDate),
          taskId: task.id,
          dedupeKey: dedupe,
        });
      }
    }
  }

  await runAttendanceCheck(userId);
  await runGpaCheck(userId);
}

function bodyForTask(
  title: string,
  courseCode: string,
  h: number,
  due: Date
) {
  return `${title} (${courseCode}) due ${
    h === 1 ? "in 1 hour" : `in ${h} hours`
  } — ${due.toLocaleString()}`;
}

export async function runAttendanceCheck(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const threshold = settings?.attendanceThreshold ?? 75;

  const courses = await prisma.course.findMany({
    where: { userId },
    include: { attendance: true },
  });

  for (const course of courses) {
    const present = course.attendance.filter(
      (a) => a.status === "PRESENT"
    ).length;
    const total = course.attendance.length;
    if (total === 0) continue;
    const pct = (present / total) * 100;
    if (pct >= threshold) continue;

    const dedupe = `attendance-${course.id}-${weekKey(new Date())}`;
    await createNotification({
      userId,
      type: "ATTENDANCE",
      title: `Attendance warning: ${course.courseCode}`,
      body: `Your attendance is at ${pct.toFixed(1)}% (${present}/${total}), below the ${threshold}% policy threshold.`,
      channel: "IN_APP",
      dedupeKey: dedupe,
    });
  }
}

export async function runGpaCheck(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.targetGpa) return;
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const scale = settings?.gpaScale ?? 4;

  const tasks = await prisma.academicTask.count({
    where: { course: { userId }, status: "GRADED" },
  });
  if (tasks === 0) return;

  const { getEstimatedGpa } = await import("@/lib/gpa");
  const gpa = await getEstimatedGpa(userId, scale);
  if (gpa == null || gpa >= user.targetGpa) return;

  const dedupe = `gpa-${userId}-${weekKey(new Date())}`;
  await createNotification({
    userId,
    type: "GPA",
    title: "GPA below target",
    body: `Estimated GPA is ${gpa.toFixed(2)} against your target of ${user.targetGpa.toFixed(2)}.`,
    channel: "IN_APP",
    dedupeKey: dedupe,
  });
}

export async function runDailyDigest(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (settings?.digestEnabled === false) return;

  const now = new Date();
  const in24 = new Date(now.getTime() + 24 * 36e5);

  const tasks = await prisma.academicTask.findMany({
    where: {
      course: { userId },
      dueDate: { gte: now, lte: in24 },
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: { course: true },
    orderBy: { dueDate: "asc" },
  });

  const dedupe = `digest-${userId}-${dayKey(now)}`;
  if (tasks.length === 0) return;

  const lines = tasks
    .map(
      (t) =>
        `• ${t.course.courseCode} — ${t.title} (${new Date(t.dueDate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})`
    )
    .join("\n");

  await createNotification({
    userId,
    type: "DIGEST",
    title: "Daily digest — tasks due in the next 24h",
    body: lines,
    channel: "IN_APP",
    dedupeKey: dedupe,
  });

  await dispatch(userId, {
    type: "DIGEST",
    title: "Daily study digest",
    body: lines,
    dedupeKey: dedupe,
  });
}

export async function runAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    try {
      await runUserReminderCheck(u.id);
    } catch (e) {
      console.error(`Reminder check failed for ${u.id}`, e);
    }
  }
}

export async function runAllDigests() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    try {
      await runDailyDigest(u.id);
    } catch (e) {
      console.error(`Digest failed for ${u.id}`, e);
    }
  }
}