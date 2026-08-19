import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FocusTimer } from "@/components/focus/focus-timer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DAY_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Focus Timer" };

export default async function FocusPage() {
  const user = await requireUser();
  const [settings, tasks, sessions] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
    prisma.academicTask.findMany({
      where: {
        course: { userId: user.id },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: { course: true },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.focusSession.findMany({
      where: { userId: user.id, endedAt: { not: null } },
      include: { task: { include: { course: true } } },
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
  ]);

  const totalMinutes = sessions.reduce((s, x) => s + x.durationMinutes, 0);
  const totalPomodoros = sessions.reduce((s, x) => s + x.pomodoros, 0);

  // Hours per course
  const perCourse = new Map<string, { label: string; minutes: number }>();
  for (const s of sessions) {
    if (!s.task?.course) continue;
    const key = s.task.course.courseCode;
    const cur = perCourse.get(key) ?? { label: key, minutes: 0 };
    cur.minutes += s.durationMinutes;
    perCourse.set(key, cur);
  }

  // Hours per day (last 7 days)
  const perDay = new Map<number, number>();
  for (const s of sessions) {
    const dow = new Date(s.startedAt).getDay();
    perDay.set(dow, (perDay.get(dow) ?? 0) + s.durationMinutes);
  }

  const maxCourse = Math.max(0, ...Array.from(perCourse.values()).map((v) => v.minutes));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Focus Timer</h1>
        <p className="text-sm text-muted-foreground">
          Task-linked Pomodoro sessions with automatic study-hour tracking.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FocusTimer
            workMin={settings?.pomodoroWork ?? 25}
            breakMin={settings?.pomodoroBreak ?? 5}
            tasks={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              courseCode: t.course.courseCode,
            }))}
          />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(totalMinutes / 60).toFixed(1)}h</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Pomodoros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalPomodoros}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hours by course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {perCourse.size === 0 && (
                <p className="py-2 text-sm text-muted-foreground">
                  Complete a focus session to see analytics.
                </p>
              )}
              {Array.from(perCourse.values()).map((c) => (
                <div key={c.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{c.label}</span>
                    <span className="text-muted-foreground">{(c.minutes / 60).toFixed(1)}h</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${maxCourse > 0 ? (c.minutes / maxCourse) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">This week</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-1">
              {DAY_LABELS.map((label, i) => (
                <div key={label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{label.slice(0, 3)}</span>
                  <div className="flex h-16 w-full max-w-6 items-end rounded bg-muted">
                    <div
                      className="w-full rounded bg-primary"
                      style={{
                        height: `${Math.min((perDay.get(i) ?? 0) / 120, 1) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}