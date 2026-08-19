import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEstimatedGpa } from "@/lib/gpa";
import { formatTime, relativeDue } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardQuickLinks } from "@/components/dashboard/quick-links";
import { GpaWidget } from "@/components/dashboard/gpa-widget";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const now = new Date();
  const in24 = new Date(now.getTime() + 24 * 36e5);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 36e5);

  const [upcoming, todaysSchedules, courses, todaysTasks] = await Promise.all([
    prisma.academicTask.findMany({
      where: {
        course: { userId: user.id },
        dueDate: { gte: now, lte: in24 },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: { course: true },
      orderBy: { dueDate: "asc" },
      take: 12,
    }),
    prisma.studySchedule.findMany({
      where: {
        userId: user.id,
        startTime: { gte: startOfToday, lt: endOfToday },
      },
      orderBy: { startTime: "asc" },
      take: 10,
    }),
    prisma.course.count({ where: { userId: user.id } }),
    prisma.academicTask.findMany({
      where: {
        course: { userId: user.id },
        dueDate: { gte: startOfToday, lt: endOfToday },
      },
      select: { id: true, status: true },
    }),
  ]);

  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  const gpa = await getEstimatedGpa(user.id, settings?.gpaScale ?? 4);

  const completedToday =
    todaysTasks.length === 0
      ? 0
      : todaysTasks.filter((t) => t.status === "SUBMITTED" || t.status === "GRADED")
          .length;
  const progress =
    todaysTasks.length === 0 ? 0 : Math.round((completedToday / todaysTasks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is what is coming up in the next 24 hours.
          </p>
        </div>
        <DashboardQuickLinks />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="animate-fade-in-up stagger-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasks in next 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcoming.length}</div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{courses}</div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today progress</CardTitle>
            <CardDescription>
              {todaysTasks.length === 0
                ? "No tasks due today"
                : `${completedToday}/${todaysTasks.length} done`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={progress} className="h-2" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </CardContent>
        </Card>
        <div className="animate-fade-in-up stagger-4">
          <GpaWidget gpa={gpa} targetGpa={user.targetGpa} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming deadlines</CardTitle>
            <Link href="/tasks" className={cn(buttonVariants({ variant: "link", size: "sm" }), "-mr-2")}>
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing due in the next 24 hours. Enjoy the calm!
              </p>
            ) : (
              upcoming.map((t) => (
                <Link
                  key={t.id}
                  href={`/courses/${t.courseId}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  style={{ borderLeft: `3px solid ${t.course.colorHex}` }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.course.courseCode} · {formatTime(t.dueDate)}
                    </p>
                  </div>
                  <Badge variant={relativeDue(t.dueDate).startsWith("Overdue") ? "destructive" : "secondary"}>
                    {relativeDue(t.dueDate)}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        </Reveal>

        <Reveal className="lg:col-span-2" delay={90}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Today&apos;s schedule</CardTitle>
              <Link href="/calendar" className={cn(buttonVariants({ variant: "link", size: "sm" }), "-mr-2")}>
                Open calendar
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {todaysSchedules.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nothing scheduled today. Add fixed classes in the calendar or generate a study plan.
                </p>
              ) : (
                todaysSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                  >
                    <span className="flex w-16 shrink-0 flex-col rounded-md bg-background px-2 py-1 text-center text-xs font-semibold leading-tight text-primary">
                      <span>{formatTime(s.startTime)}</span>
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {formatTime(s.endTime)}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.title}</p>
                    </div>
                    <Badge
                      variant={s.type === "DYNAMIC" ? "secondary" : "outline"}
                      className="shrink-0 text-[10px]"
                    >
                      {s.type === "DYNAMIC" ? "Study block" : "Fixed"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}