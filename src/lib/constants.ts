import type { TaskStatus, TaskType } from "@prisma/client";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
  LAB: "Lab Report",
  PAPER: "Paper",
  MIDTERM: "Midterm",
  FINAL: "Final",
  PROJECT: "Group Project",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  GRADED: "Graded",
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  QUIZ: "#f59e0b",
  ASSIGNMENT: "#3b82f6",
  LAB: "#10b981",
  PAPER: "#8b5cf6",
  MIDTERM: "#ef4444",
  FINAL: "#dc2626",
  PROJECT: "#06b6d4",
};

export const ROUTINE_MODES = [
  { value: "STANDARD", label: "Standard Week" },
  { value: "EXAM", label: "Exam Season" },
  { value: "HOLIDAY", label: "Holiday / Break" },
] as const;

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const COURSE_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

export function formatTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(d));
}

export function hoursUntil(d: Date | string) {
  return (new Date(d).getTime() - Date.now()) / 36e5;
}

export function daysUntil(d: Date | string) {
  return hoursUntil(d) / 24;
}

export function relativeDue(d: Date | string) {
  const h = hoursUntil(d);
  if (h < 0) return "Overdue";
  if (h < 1) return `${Math.round(h * 60)}m left`;
  if (h < 24) return `${Math.round(h)}h left`;
  return `${Math.round(h / 24)}d left`;
}

export function timeToMinutes(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

export function isSameDay(a: Date | string, b: Date | string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
