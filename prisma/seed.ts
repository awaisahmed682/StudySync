import { PrismaClient, TaskType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@studysync.app";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Demo Student",
        passwordHash: await hash("password123", 10),
        targetGpa: 3.5,
      },
    });
    await prisma.userSettings.create({ data: { userId: user.id } });
    console.log("Created demo user:", email);
  }

  const courses = [
    { code: "CS301", name: "Operating Systems", color: "#6366f1", creditHours: 3 },
    { code: "CS310", name: "Data Structures", color: "#10b981", creditHours: 4 },
    { code: "MATH205", name: "Linear Algebra", color: "#f59e0b", creditHours: 3 },
  ];

  for (const c of courses) {
    const exists = await prisma.course.findUnique({
      where: { userId_courseCode: { userId: user.id, courseCode: c.code } },
    });
    if (exists) continue;
    const course = await prisma.course.create({
      data: {
        userId: user.id,
        courseCode: c.code,
        courseName: c.name,
        colorHex: c.color,
        creditHours: c.creditHours,
        gradingCriteria: "Quizzes 20%, Assignments 30%, Midterm 20%, Final 30%",
      },
    });

    const now = Date.now();
    const day = 864e5;
    await prisma.academicTask.createMany({
      data: [
        { courseId: course.id, title: "Chapter 5 Problem Set", type: TaskType.ASSIGNMENT, dueDate: new Date(now + 2 * day), weightPercentage: 10, difficulty: 3 },
        { courseId: course.id, title: "Midterm Exam", type: TaskType.MIDTERM, dueDate: new Date(now + 12 * day), weightPercentage: 20, difficulty: 4 },
        { courseId: course.id, title: "Lab Report 3", type: TaskType.LAB, dueDate: new Date(now + 5 * day), weightPercentage: 5, difficulty: 2 },
        { courseId: course.id, title: "Research Paper", type: TaskType.PAPER, dueDate: new Date(now + 21 * day), weightPercentage: 15, difficulty: 5 },
      ],
    });

    // Fixed weekly class schedules (recurring, epoch-day timestamps).
    const t = (h: number, m: number) => new Date(1970, 0, 1, h, m, 0);
    await prisma.studySchedule.createMany({
      data: [
        { userId: user.id, title: `${c.code} Lecture`, type: "FIXED", dayOfWeek: 1, startTime: t(9, 0), endTime: t(10, 30), isRecurring: true },
        { userId: user.id, title: `${c.code} Lab`, type: "FIXED", dayOfWeek: 3, startTime: t(14, 0), endTime: t(16, 0), isRecurring: true },
      ],
    });
    console.log("Seeded course", c.code);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });