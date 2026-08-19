import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildIcsCalendar, buildUserCalendarEvents } from "@/lib/calendar/ics";

export async function GET() {
  const user = await requireUser();

  const start = new Date();
  const end = new Date(start.getTime() + 90 * 864e5);

  const [schedules, tasks] = await Promise.all([
    prisma.studySchedule.findMany({
      where: {
        userId: user.id,
        OR: [
          { isRecurring: true },
          { startTime: { gte: start }, endTime: { lte: end } },
        ],
      },
    }),
    prisma.academicTask.findMany({
      where: {
        course: { userId: user.id },
        dueDate: { gte: start, lte: end },
      },
      include: { course: true },
    }),
  ]);

  const ics = buildIcsCalendar(
    buildUserCalendarEvents({ schedules, tasks })
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="studysync-${user.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}