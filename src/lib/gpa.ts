import "server-only";

import { prisma } from "@/lib/prisma";

export type CourseStanding = {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalWeight: number;
  earnedWeighted: number;
  achievedPercent: number | null;
  remainingWeight: number;
  tasks: {
    id: string;
    title: string;
    weightPercentage: number;
    status: string;
    gradeAchieved: number | null;
  }[];
};

function gradePoints(percent: number, scale: number) {
  const ratio = Math.max(0, Math.min(100, percent)) / 100;
  return Math.min(scale, Math.max(0, ratio * scale));
}

export async function getCourseStandings(
  userId: string
): Promise<CourseStanding[]> {
  const courses = await prisma.course.findMany({
    where: { userId },
    include: { tasks: true },
    orderBy: { courseName: "asc" },
  });

  return courses.map((course) => {
    const graded = course.tasks.filter(
      (t) => t.status === "GRADED" && t.gradeAchieved != null
    );
    const totalWeight = course.tasks.reduce(
      (sum, t) => sum + t.weightPercentage,
      0
    );
    const gradedWeight = graded.reduce((sum, t) => sum + t.weightPercentage, 0);
    const earnedWeighted = graded.reduce(
      (sum, t) => sum + (t.gradeAchieved ?? 0) * (t.weightPercentage / 100),
      0
    );

    return {
      courseId: course.id,
      courseName: course.courseName,
      courseCode: course.courseCode,
      totalWeight,
      earnedWeighted,
      achievedPercent:
        gradedWeight > 0 ? (earnedWeighted / (gradedWeight / 100)) : null,
      remainingWeight: totalWeight - gradedWeight,
      tasks: course.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        weightPercentage: t.weightPercentage,
        status: t.status,
        gradeAchieved: t.gradeAchieved,
      })),
    };
  });
}

export async function getEstimatedGpa(userId: string, gpaScale: number = 4) {
  const standings = await getCourseStandings(userId);
  if (standings.length === 0) return null;

  let totalPoints = 0;
  let courseCount = 0;
  for (const s of standings) {
    const knownPercent =
      s.achievedPercent ??
      (s.totalWeight > 0
        ? (s.earnedWeighted / Math.max(s.totalWeight, 0.0001)) * 100
        : null);
    if (knownPercent == null) continue;
    totalPoints += gradePoints(knownPercent, gpaScale);
    courseCount++;
  }
  if (courseCount === 0) return null;
  return totalPoints / courseCount;
}

export async function computeWhatIf(
  userId: string,
  gpaScale: number = 4
): Promise<{
  currentGpa: number | null;
  targetGpa: number;
  gap: number;
  requirements: {
    courseId: string;
    courseName: string;
    courseCode: string;
    remainingWeight: number;
    requiredPercentToMaintain: number | null;
  }[];
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const targetGpa = user?.targetGpa ?? 3.0;
  const standings = await getCourseStandings(userId);
  const currentGpa = await getEstimatedGpa(userId, gpaScale);

  const requirements = standings.map((s) => {
    let requiredPercentToMaintain: number | null = null;
    if (s.remainingWeight > 0 && s.totalWeight > 0) {
      const targetPercent = (targetGpa / gpaScale) * 100;
      const earnedPercent = s.earnedWeighted;
      const required =
        ((targetPercent / 100) * s.totalWeight - earnedPercent) /
        (s.remainingWeight / 100);
      requiredPercentToMaintain = Math.max(0, Math.min(100, required));
    }
    return {
      courseId: s.courseId,
      courseName: s.courseName,
      courseCode: s.courseCode,
      remainingWeight: s.remainingWeight,
      requiredPercentToMaintain,
    };
  });

  return {
    currentGpa,
    targetGpa,
    gap: targetGpa - (currentGpa ?? 0),
    requirements,
  };
}
