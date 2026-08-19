import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskBoard } from "@/components/tasks/task-board";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tasks" };

export default async function TasksPage() {
  const user = await requireUser();
  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    select: { id: true, courseCode: true, courseName: true },
    orderBy: { courseCode: "asc" },
  });

  return (
    <div>
      <TaskBoard courses={courses} />
    </div>
  );
}