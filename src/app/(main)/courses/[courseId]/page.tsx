import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CourseDetailTabs } from "@/components/courses/course-detail-tabs";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const user = await requireUser();

  const course = await prisma.course.findFirst({
    where: { id: courseId, userId: user.id },
    include: {
      tasks: { include: { subtasks: true }, orderBy: { dueDate: "asc" } },
      attendance: { orderBy: { date: "desc" } },
      resources: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!course) notFound();

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });
  const threshold = settings?.attendanceThreshold ?? 75;

  const present = course.attendance.filter((a) => a.status === "PRESENT").length;
  const attendancePct =
    course.attendance.length > 0 ? (present / course.attendance.length) * 100 : null;

  return (
    <div className="space-y-5">
      <Link href="/courses" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> All courses
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-lg" style={{ backgroundColor: course.colorHex }} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{course.courseCode}</h1>
            <p className="text-sm text-muted-foreground">
              {course.courseName} · {course.creditHours} credit hours
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {course.instructorEmail && (
            <a href={`mailto:${course.instructorEmail}`} className="hover:text-primary hover:underline">
              {course.instructorEmail}
            </a>
          )}
          {course.officeHours && <Badge variant="outline">Office: {course.officeHours}</Badge>}
          {course.syllabusUrl && (
            <a href={course.syllabusUrl} target="_blank" rel="noreferrer" className="text-primary underline">
              Syllabus
            </a>
          )}
        </div>
      </div>

      {course.gradingCriteria && (
        <p className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <span className="font-semibold">Grading:</span> {course.gradingCriteria}
        </p>
      )}

      <CourseDetailTabs course={course} attendancePct={attendancePct} threshold={threshold} />
    </div>
  );
}