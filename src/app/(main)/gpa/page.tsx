import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeWhatIf, getCourseStandings } from "@/lib/gpa";
import { GpaPlanner } from "@/components/gpa/gpa-planner";

export const dynamic = "force-dynamic";

export const metadata = { title: "GPA Planner" };

export default async function GpaPage() {
  const user = await requireUser();
  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  const scale = settings?.gpaScale ?? 4;

  const [standings, whatIf, tasks] = await Promise.all([
    getCourseStandings(user.id),
    computeWhatIf(user.id, scale),
    prisma.academicTask.findMany({
      where: {
        course: { userId: user.id },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: { course: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const simTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    courseId: t.courseId,
    courseCode: t.course.courseCode,
    weightPercentage: t.weightPercentage,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">GPA Planner</h1>
        <p className="text-sm text-muted-foreground">
          Grade weight calculator and what-if scenario engine.
        </p>
      </div>
      <GpaPlanner
        standings={standings}
        currentGpa={whatIf.currentGpa}
        targetGpa={whatIf.targetGpa}
        gpaScale={scale}
        simTasks={simTasks}
      />
    </div>
  );
}