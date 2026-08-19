import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function tintHex(hex: string, alpha: number) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const params = req.nextUrl.searchParams;
  const start = params.get("start");
  const end = params.get("end");

  const startMs = start ? new Date(start).getTime() : Date.now() - 7 * 864e5;
  const endMs = end ? new Date(end).getTime() : Date.now() + 30 * 864e5;

  const [schedules, tasks] = await Promise.all([
    prisma.studySchedule.findMany({
      where: { userId: user.id },
      orderBy: { startTime: "asc" },
    }),
    prisma.academicTask.findMany({
      where: { course: { userId: user.id } },
      include: { course: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const events: Record<string, unknown>[] = [];

  // Expand recurring fixed/dynamic schedules into the window.
  for (const s of schedules) {
    const isRecurring = s.isRecurring && s.dayOfWeek != null;
    if (isRecurring) {
      const startDate = new Date(startMs);
      const cursor = new Date(startDate);
      cursor.setHours(0, 0, 0, 0);
      const sStart = new Date(s.startTime);
      const sEnd = new Date(s.endTime);
      const startMin = sStart.getHours() * 60 + sStart.getMinutes();
      const endMin = sEnd.getHours() * 60 + sEnd.getMinutes();
      const endDate = new Date(endMs);

      for (let d = new Date(cursor); d.getTime() <= endDate.getTime(); d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== s.dayOfWeek) continue;
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        events.push({
          id: `${s.id}-${d.toISOString().slice(0, 10)}`,
          title: s.title,
          start: new Date(dayStart.getTime() + startMin * 60_000).toISOString(),
          end: new Date(dayStart.getTime() + endMin * 60_000).toISOString(),
          allDay: false,
          className: "cal-schedule",
          extendedProps: {
            kind: "schedule",
            scheduleId: s.id,
            scheduleType: s.type,
            recurring: true,
            taskId: s.relatedTaskId,
          },
        });
      }
    } else if (s.startTime.getTime() < endMs && s.endTime.getTime() > startMs) {
      events.push({
        id: `schedule-${s.id}`,
        title: s.title,
        start: s.startTime.toISOString(),
        end: s.endTime.toISOString(),
        allDay: false,
        className: "cal-schedule",
        extendedProps: {
          kind: "schedule",
          scheduleId: s.id,
          scheduleType: s.type,
          recurring: false,
          taskId: s.relatedTaskId,
        },
      });
    }
  }

  for (const t of tasks) {
    const due = t.dueDate;
    if (due.getTime() < startMs || due.getTime() > endMs) continue;
    const dayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const nextDay = new Date(due.getFullYear(), due.getMonth(), due.getDate() + 1);
    events.push({
      id: `task-${t.id}`,
      title: `${t.course.courseCode}: ${t.title}`,
      start: dayStart.toISOString(),
      end: nextDay.toISOString(),
      allDay: true,
      backgroundColor: tintHex(t.course.colorHex, 0.26),
      borderColor: t.course.colorHex,
      textColor: "var(--foreground)",
      className: "cal-deadline",
      extendedProps: {
        kind: "task",
        taskId: t.id,
        courseId: t.courseId,
        status: t.status,
        weightPercentage: t.weightPercentage,
        portalUrl: t.portalUrl,
        dueDate: due.toISOString(),
      },
    });
  }

  return NextResponse.json({ events });
}