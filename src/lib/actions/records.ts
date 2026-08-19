"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { attendanceSchema, resourceSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

export async function recordAttendance(formData: FormData) {
  const user = await requireUser();
  const parsed = attendanceSchema.safeParse({
    courseId: formData.get("courseId"),
    date: formData.get("date"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid record");

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, userId: user.id },
  });
  if (!course) throw new Error("Course not found");

  const date = new Date(parsed.data.date);
  date.setHours(0, 0, 0, 0);

  await prisma.attendanceRecord.upsert({
    where: { courseId_date: { courseId: parsed.data.courseId, date } },
    create: { courseId: parsed.data.courseId, date, status: parsed.data.status },
    update: { status: parsed.data.status },
  });

  revalidatePath(`/courses/${parsed.data.courseId}`);
  revalidatePath("/attendance");
}

export async function deleteAttendance(courseId: string, date: string) {
  const user = await requireUser();
  await prisma.attendanceRecord.deleteMany({
    where: { courseId, date: new Date(date), course: { userId: user.id } },
  });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/attendance");
}

export async function addResource(formData: FormData) {
  const user = await requireUser();
  const parsed = resourceSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    url: formData.get("url"),
    type: formData.get("type") || "LINK",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid resource");

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, userId: user.id },
  });
  if (!course) throw new Error("Course not found");

  await prisma.resource.create({ data: parsed.data });
  revalidatePath(`/courses/${parsed.data.courseId}`);
}

export async function deleteResource(resourceId: string) {
  const user = await requireUser();
  const res = await prisma.resource.findFirst({
    where: { id: resourceId, course: { userId: user.id } },
  });
  if (!res) throw new Error("Resource not found");
  await prisma.resource.delete({ where: { id: resourceId } });
  revalidatePath(`/courses/${res.courseId}`);
}

export async function endFocusSession(input: {
  taskId?: string | null;
  durationMinutes: number;
  pomodoros: number;
}) {
  const user = await requireUser();
  await prisma.focusSession.create({
    data: {
      userId: user.id,
      taskId: input.taskId || null,
      durationMinutes: input.durationMinutes,
      pomodoros: input.pomodoros,
      startedAt: new Date(Date.now() - input.durationMinutes * 60_000),
      endedAt: new Date(),
    },
  });
  revalidatePath("/focus");
  revalidatePath("/");
}