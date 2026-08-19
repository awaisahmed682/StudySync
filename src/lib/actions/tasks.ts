"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { taskSchema, taskUpdateSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import { generateSubtasks } from "@/lib/scheduling/subtasks";

async function getTaskOrThrow(taskId: string, userId: string) {
  const task = await prisma.academicTask.findFirst({
    where: { id: taskId, course: { userId } },
  });
  if (!task) throw new Error("Task not found");
  return task;
}

export async function createTask(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const user = await requireUser();
  const parsed = taskSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    type: formData.get("type"),
    dueDate: formData.get("dueDate"),
    portalUrl: formData.get("portalUrl") || undefined,
    weightPercentage: formData.get("weightPercentage") || 0,
    difficulty: formData.get("difficulty") || 3,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid task" };

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, userId: user.id },
  });
  if (!course) throw new Error("Course not found");

  const data = parsed.data;
  const task = await prisma.academicTask.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      type: data.type,
      dueDate: data.dueDate,
      portalUrl: data.portalUrl || null,
      weightPercentage: data.weightPercentage,
      difficulty: data.difficulty,
      notes: data.notes || null,
    },
  });

  const autoSub = formData.get("autoSubtasks");
  if (autoSub === "true") await generateSubtasks(task.id);

  revalidatePath(`/courses/${data.courseId}`);
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/calendar");
  return { error: undefined };
}

export async function updateTask(taskId: string, formData: FormData) {
  const user = await requireUser();
  await getTaskOrThrow(taskId, user.id);

  const parsed = taskUpdateSchema.safeParse({
    courseId: formData.get("courseId") || undefined,
    title: formData.get("title") || undefined,
    type: formData.get("type") || undefined,
    dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : undefined,
    portalUrl: formData.get("portalUrl") || undefined,
    weightPercentage: formData.get("weightPercentage")
      ? Number(formData.get("weightPercentage"))
      : undefined,
    difficulty: formData.get("difficulty")
      ? Number(formData.get("difficulty"))
      : undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status") || undefined,
    gradeAchieved:
      formData.get("gradeAchieved") !== null && formData.get("gradeAchieved") !== ""
        ? Number(formData.get("gradeAchieved"))
        : null,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid task");

  const task = await prisma.academicTask.update({
    where: { id: taskId },
    data: {
      ...(parsed.data.courseId && { courseId: parsed.data.courseId }),
      ...(parsed.data.title && { title: parsed.data.title }),
      ...(parsed.data.type && { type: parsed.data.type }),
      ...(parsed.data.dueDate && { dueDate: parsed.data.dueDate }),
      ...(parsed.data.portalUrl !== undefined && { portalUrl: parsed.data.portalUrl || null }),
      ...(parsed.data.weightPercentage !== undefined && {
        weightPercentage: parsed.data.weightPercentage,
      }),
      ...(parsed.data.difficulty !== undefined && { difficulty: parsed.data.difficulty }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes || null }),
      ...(parsed.data.status && { status: parsed.data.status }),
      ...(parsed.data.gradeAchieved !== undefined && {
        gradeAchieved: parsed.data.gradeAchieved,
      }),
    },
  });

  revalidatePath(`/courses/${task.courseId}`);
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function updateTaskStatus(taskId: string, status: string) {
  const user = await requireUser();
  await getTaskOrThrow(taskId, user.id);
  await prisma.academicTask.update({ where: { id: taskId }, data: { status: status as never } });
  revalidatePath("/tasks");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const task = await getTaskOrThrow(taskId, user.id);
  await prisma.academicTask.delete({ where: { id: taskId } });
  revalidatePath(`/courses/${task.courseId}`);
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function generateTaskSubtasks(taskId: string) {
  const user = await requireUser();
  await getTaskOrThrow(taskId, user.id);
  await generateSubtasks(taskId);
  revalidatePath("/tasks");
  revalidatePath(`/courses/*`);
}