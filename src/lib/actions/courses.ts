"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string } | undefined;

export async function createCourse(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = courseSchema.safeParse({
    courseCode: formData.get("courseCode"),
    courseName: formData.get("courseName"),
    colorHex: formData.get("colorHex"),
    creditHours: formData.get("creditHours"),
    instructorEmail: formData.get("instructorEmail") || undefined,
    officeHours: formData.get("officeHours") || undefined,
    syllabusUrl: formData.get("syllabusUrl") || undefined,
    gradingCriteria: formData.get("gradingCriteria") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid course" };

  const data = parsed.data;
  await prisma.course.create({
    data: {
      userId: user.id,
      courseCode: data.courseCode,
      courseName: data.courseName,
      colorHex: data.colorHex,
      creditHours: data.creditHours,
      instructorEmail: data.instructorEmail || null,
      officeHours: data.officeHours || null,
      syllabusUrl: data.syllabusUrl || null,
      gradingCriteria: data.gradingCriteria || null,
    },
  });
  revalidatePath("/courses");
  revalidatePath("/");
  return { error: undefined };
}

export async function updateCourse(courseId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = courseSchema.safeParse({
    courseCode: formData.get("courseCode"),
    courseName: formData.get("courseName"),
    colorHex: formData.get("colorHex"),
    creditHours: formData.get("creditHours"),
    instructorEmail: formData.get("instructorEmail") || undefined,
    officeHours: formData.get("officeHours") || undefined,
    syllabusUrl: formData.get("syllabusUrl") || undefined,
    gradingCriteria: formData.get("gradingCriteria") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid course");

  const data = parsed.data;
  await prisma.course.updateMany({
    where: { id: courseId, userId: user.id },
    data: {
      courseCode: data.courseCode,
      courseName: data.courseName,
      colorHex: data.colorHex,
      creditHours: data.creditHours,
      instructorEmail: data.instructorEmail || null,
      officeHours: data.officeHours || null,
      syllabusUrl: data.syllabusUrl || null,
      gradingCriteria: data.gradingCriteria || null,
    },
  });
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath("/");
}

export async function deleteCourse(courseId: string) {
  const user = await requireUser();
  await prisma.course.deleteMany({ where: { id: courseId, userId: user.id } });
  revalidatePath("/courses");
  revalidatePath("/");
}