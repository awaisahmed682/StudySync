import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const user = await requireUser();
  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  const threshold = settings?.attendanceThreshold ?? 75;

  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    include: { attendance: true },
    orderBy: { courseCode: "asc" },
  });

  const stats = courses.map((c) => {
    const present = c.attendance.filter((a) => a.status === "PRESENT").length;
    const total = c.attendance.length;
    const pct = total > 0 ? (present / total) * 100 : null;
    return { course: c, present, total, pct };
  });

  const atRiskCount = stats.filter((s) => s.pct != null && s.pct < threshold).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Track present/absent days and watch for policy thresholds.
          </p>
        </div>
        <Badge variant={atRiskCount > 0 ? "destructive" : "secondary"}>
          {atRiskCount > 0 ? `${atRiskCount} course(s) at risk` : "All courses above threshold"}
        </Badge>
      </div>

      {stats.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Add courses to start tracking attendance.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.course.id} href={`/courses/${s.course.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{s.course.courseCode}</CardTitle>
                    {s.pct != null && s.pct < threshold && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <CardDescription className="truncate">{s.course.courseName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {s.pct == null ? "—" : `${s.pct.toFixed(1)}%`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.present}/{s.total} present
                    </span>
                  </div>
                  <Progress
                    value={s.pct ?? 0}
                    className="h-2"
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore - indicator color override
                    indicatorClassName={s.pct != null && s.pct < threshold ? "bg-destructive" : undefined}
                  />
                  <p className="text-xs text-muted-foreground">Threshold: {threshold}%</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}