import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseListClient } from "@/components/courses/course-list-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { tasks: true, attendance: true, resources: true } },
    },
    orderBy: { courseCode: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course Hub</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} courses · manage syllabi, grades, attendance and resources.
          </p>
        </div>
        <CourseListClient />
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No courses yet. Add your first course to start tracking.
            </p>
            <CourseListClient />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.colorHex }} />
                      <CardTitle className="text-base">{c.courseCode}</CardTitle>
                    </div>
                    <Badge variant="secondary">{c.creditHours} cr</Badge>
                  </div>
                  <CardDescription className="truncate">{c.courseName}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 text-xs text-muted-foreground">
                  <span>{c._count.tasks} tasks</span>
                  <span>{c._count.attendance} sessions</span>
                  <span>{c._count.resources} resources</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}