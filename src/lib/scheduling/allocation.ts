import "server-only";

import { prisma } from "@/lib/prisma";
import type { AcademicTask, Course, RoutineMode } from "@prisma/client";

export type TimeWindow = { startMs: number; endMs: number };

export type AllocatableTask = AcademicTask & { course: Course };

export type StudyBlock = {
  taskId: string | null;
  title: string;
  startMs: number;
  endMs: number;
  mins: number;
};

export const HOUR_MS = 36e5;
export const MIN_MS = 60_000;

export const DAY_BOUNDARIES = {
  startHour: 7, // free window search starts at 07:00
  endHour: 23, // ...and ends at 23:00
};

export function routineBias(mode: RoutineMode) {
  switch (mode) {
    case "EXAM":
      return { blockMins: 60, maxBlocksPerTask: 6 };
    case "HOLIDAY":
      return { blockMins: 35, maxBlocksPerTask: 2 };
    case "STANDARD":
    default:
      return { blockMins: 50, maxBlocksPerTask: 4 };
  }
}

function dayStart(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Core allocation algorithm (pure, unit-testable).
 * Greedily assigns urgent tasks to the earliest free study windows.
 */
export function allocateStudyBlocks(params: {
  freeWindows: TimeWindow[];
  tasks: AllocatableTask[];
  blockMins: number;
  maxBlocksPerTask: number;
}): StudyBlock[] {
  const { freeWindows, tasks, blockMins, maxBlocksPerTask } = params;
  const now = Date.now();
  const blockMs = blockMins * MIN_MS;
  const blocks: StudyBlock[] = [];

  // Score: higher weight + difficulty, closer to deadline => higher priority.
  const available = tasks
    .filter((t) => t.status !== "SUBMITTED" && t.status !== "GRADED")
    .map((t) => {
      const daysLeft = Math.max((new Date(t.dueDate).getTime() - now) / (24 * HOUR_MS), 0.4);
      const urgency = ((t.weightPercentage + 1) * t.difficulty) / daysLeft;
      return { t, urgency };
    })
    .sort((a, b) => b.urgency - a.urgency);

  // Track how many windows are "used" so allocations don't overlap.
  const used: TimeWindow[] = [];

  for (const { t } of available) {
    const dueMs = new Date(t.dueDate).getTime();
    const assignedMins = 0; // reserved for future weighting

    let allocated = 0;
    for (const win of freeWindows) {
      if (allocated >= maxBlocksPerTask) break;
      // Block must be before the deadline (with a 1-day buffer) and in the future.
      if (win.startMs >= dueMs - 24 * HOUR_MS) break;

      // Find a candidate interval inside the window that doesn't overlap used windows.
      const start = Math.max(win.startMs, now);
      const end = Math.min(win.endMs, win.startMs + blockMs);
      if (end - start < 25 * MIN_MS) continue;

      const overlap = used.some(
        (u) => start < u.endMs && end > u.startMs
      );
      if (overlap) continue;

      const slotStart = Math.max(now, start);
      const slotEnd = slotStart + blockMs;
      if (slotEnd > win.endMs) continue;

      blocks.push({
        taskId: t.id,
        title: `Study: ${t.title}`,
        startMs: slotStart,
        endMs: slotEnd,
        mins: blockMins,
      });
      used.push({ startMs: slotStart, endMs: slotEnd });
      allocated++;
    }
    void assignedMins;
  }

  return blocks;
}

/** Expand recurring fixed schedules into concrete weekly event timings. */
export function expandFixedSchedules(
  schedules: { startTime: Date; endTime: Date; dayOfWeek: number | null; title: string }[],
  weekStartMs: number,
  days: number
): TimeWindow[] {
  const fixed: TimeWindow[] = [];
  const start = dayStart(weekStartMs);

  for (const s of schedules) {
    const day = s.dayOfWeek ?? new Date(s.startTime).getDay();
    const timeStart = new Date(s.startTime);
    const timeEnd = new Date(s.endTime);
    const startMins = timeStart.getHours() * 60 + timeStart.getMinutes();
    const endMins = timeEnd.getHours() * 60 + timeEnd.getMinutes();

    for (let i = 0; i < days; i++) {
      const dayMs = start + i * 24 * HOUR_MS;
      const dow = new Date(dayMs).getDay();
      if (dow !== day) continue;
      fixed.push({
        startMs: dayMs + startMins * MIN_MS,
        endMs: dayMs + endMins * MIN_MS,
      });
    }
  }
  return fixed;
}

/** Compute free windows for a set of days given fixed events and boundaries. */
export function getFreeWindows(params: {
  fixed: TimeWindow[];
  weekStartMs: number;
  days: number;
}): TimeWindow[] {
  const { fixed, weekStartMs, days } = params;
  const start = dayStart(weekStartMs);
  const boundaries = DAY_BOUNDARIES;
  const windows: TimeWindow[] = [];

  for (let i = 0; i < days; i++) {
    const dayMs = start + i * 24 * HOUR_MS;
    const dawn = dayMs + boundaries.startHour * HOUR_MS;
    const dusk = dayMs + boundaries.endHour * HOUR_MS;

    const events = fixed
      .filter((f) => f.startMs >= dayMs && f.startMs < dayMs + 24 * HOUR_MS)
      .sort((a, b) => a.startMs - b.startMs);

    let cursor = dawn;
    for (const ev of events) {
      const evEnd = Math.min(ev.endMs, dusk);
      if (evEnd - cursor >= 25 * MIN_MS) {
        windows.push({ startMs: cursor, endMs: evEnd });
      }
      cursor = Math.max(cursor, evEnd);
    }
    if (dusk - cursor >= 25 * MIN_MS) {
      windows.push({ startMs: cursor, endMs: dusk });
    }
  }
  return windows;
}

export async function generateStudyPlan(
  userId: string,
  opts: { days?: number; preview?: boolean } = {}
): Promise<StudyBlock[]> {
  const days = opts.days ?? 14;
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const mode: RoutineMode = settings?.routineMode ?? "STANDARD";
  const bias = routineBias(mode);

  const now = new Date();
  const weekStartMs = dayStart(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  );

  const [schedules, tasks] = await Promise.all([
    prisma.studySchedule.findMany({
      where: { userId, type: "FIXED" },
    }),
    prisma.academicTask.findMany({
      where: { course: { userId } },
      include: { course: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const fixed = expandFixedSchedules(schedules, weekStartMs, days);
  // Deadlines are exact-time commitments; reserve their due windows so
  // study blocks never collide with a task on the calendar.
  const taskWindows: TimeWindow[] = tasks.map((t) => ({
    startMs: new Date(t.dueDate).getTime(),
    endMs: new Date(t.dueDate).getTime() + 30 * MIN_MS,
  }));
  const freeWindows = getFreeWindows({
    fixed: [...fixed, ...taskWindows],
    weekStartMs,
    days,
  });

  const blocks = allocateStudyBlocks({
    freeWindows,
    tasks: tasks as AllocatableTask[],
    blockMins: bias.blockMins,
    maxBlocksPerTask: bias.maxBlocksPerTask,
  });

  if (!opts.preview) {
    // Merge: only create blocks that don't already overlap an existing DYNAMIC block,
    // preserving user drag-and-drop edits and non-recurring entries.
    const existing = await prisma.studySchedule.findMany({
      where: { userId, type: "DYNAMIC" },
    });
    const overlapsExisting = (b: StudyBlock) =>
      existing.some(
        (e) => new Date(b.startMs) < e.endTime && new Date(b.endMs) > e.startTime
      );

    for (const b of blocks) {
      if (overlapsExisting(b)) continue;
      await prisma.studySchedule.create({
        data: {
          userId,
          type: "DYNAMIC",
          title: b.title,
          startTime: new Date(b.startMs),
          endTime: new Date(b.endMs),
          isRecurring: false,
          relatedTaskId: b.taskId,
        },
      });
    }
  }

  return blocks;
}