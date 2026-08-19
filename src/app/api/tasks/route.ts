import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  const tasks = await prisma.academicTask.findMany({
    where: { course: { userId: user.id } },
    include: {
      course: true,
      subtasks: { orderBy: { orderIndex: "asc" } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({ tasks });
}