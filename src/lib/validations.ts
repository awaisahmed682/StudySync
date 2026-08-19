import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const courseSchema = z.object({
  courseCode: z.string().min(1).max(20),
  courseName: z.string().min(1).max(100),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  creditHours: z.coerce.number().int().min(1).max(10).default(3),
  instructorEmail: z.string().email().optional().or(z.literal("")),
  officeHours: z.string().max(200).optional().or(z.literal("")),
  syllabusUrl: z.string().url().optional().or(z.literal("")),
  gradingCriteria: z.string().max(2000).optional().or(z.literal("")),
});

export const taskSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(150),
  type: z.enum(["QUIZ", "ASSIGNMENT", "LAB", "PAPER", "MIDTERM", "FINAL", "PROJECT"]),
  dueDate: z.coerce.date(),
  portalUrl: z.string().url().optional().or(z.literal("")),
  weightPercentage: z.coerce.number().min(0).max(100).default(0),
  difficulty: z.coerce.number().int().min(1).max(5).default(3),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const taskUpdateSchema = taskSchema.partial().extend({
  status: z
    .enum(["PENDING", "IN_PROGRESS", "SUBMITTED", "GRADED"])
    .optional(),
  gradeAchieved: z.coerce.number().min(0).max(100).nullable().optional(),
});

export const scheduleSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(["FIXED", "DYNAMIC"]).default("FIXED"),
  dayOfWeek: z.coerce.number().int().min(0).max(6).nullable().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isRecurring: z.coerce.boolean().default(false),
  relatedTaskId: z.string().optional().or(z.literal("")),
});

export const focusSessionSchema = z.object({
  taskId: z.string().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  pomodoros: z.coerce.number().int().min(0).max(100).default(0),
});

export const attendanceSchema = z.object({
  courseId: z.string().min(1),
  date: z.coerce.date(),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
});

export const resourceSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(150),
  url: z.string().url(),
  type: z.enum(["NOTES", "PAST_PAPER", "LINK", "FILE"]).default("LINK"),
});

export const settingsSchema = z.object({
  targetGpa: z.coerce.number().min(0).max(4.5).default(3.0),
  routineMode: z.enum(["STANDARD", "EXAM", "HOLIDAY"]).default("STANDARD"),
  timezone: z.string().min(1).default("UTC"),
  attendanceThreshold: z.coerce.number().min(0).max(100).default(75),
  gpaScale: z.coerce.number().min(1).max(5).default(4),
  pomodoroWork: z.coerce.number().int().min(5).max(120).default(25),
  pomodoroBreak: z.coerce.number().int().min(1).max(60).default(5),
  digestEnabled: z.coerce.boolean().default(true),
  reminderLead24h: z.coerce.boolean().default(true),
  reminderLead3h: z.coerce.boolean().default(true),
  reminderLead1h: z.coerce.boolean().default(true),
});

export type TaskStatusValue = "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
export type TaskTypeValue =
  | "QUIZ"
  | "ASSIGNMENT"
  | "LAB"
  | "PAPER"
  | "MIDTERM"
  | "FINAL"
  | "PROJECT";
