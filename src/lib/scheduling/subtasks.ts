import "server-only";

import type { TaskType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Phase = { label: string; weight: number };

const PAPER_PHASES: Phase[] = [
  { label: "Research & gather sources", weight: 0.2 },
  { label: "Literature review notes", weight: 0.2 },
  { label: "First draft", weight: 0.35 },
  { label: "Proofreading & citations", weight: 0.15 },
  { label: "Final submission", weight: 0.1 },
];

const PROJECT_PHASES: Phase[] = [
  { label: "Team & scope kickoff", weight: 0.15 },
  { label: "Design / plan", weight: 0.2 },
  { label: "Implementation part 1", weight: 0.3 },
  { label: "Implementation part 2", weight: 0.2 },
  { label: "Report & demo prep", weight: 0.15 },
];

const MIDTERM_PHASES: Phase[] = [
  { label: "Review lecture notes & slides", weight: 0.3 },
  { label: "Practice past papers", weight: 0.4 },
  { label: "Final revision", weight: 0.3 },
];

const FINAL_PHASES: Phase[] = [
  { label: "Complete revision plan", weight: 0.3 },
  { label: "Full past-paper run", weight: 0.4 },
  { label: "Self-test & weak spots", weight: 0.3 },
];

const LAB_PHASES: Phase[] = [
  { label: "Read lab manual & prereqs", weight: 0.3 },
  { label: "Draft procedure / results", weight: 0.5 },
  { label: "Conclusion & submission", weight: 0.2 },
];

const QUIZ_PHASES: Phase[] = [
  { label: "Review relevant material", weight: 0.5 },
  { label: "Do practice MCQs", weight: 0.5 },
];

const ASSIGNMENT_PHASES: Phase[] = [
  { label: "Understand requirements & outline", weight: 0.3 },
  { label: "Complete core work", weight: 0.5 },
  { label: "Polish & submit", weight: 0.2 },
];

const PHASE_MAP: Record<TaskType, Phase[]> = {
  PAPER: PAPER_PHASES,
  PROJECT: PROJECT_PHASES,
  MIDTERM: MIDTERM_PHASES,
  FINAL: FINAL_PHASES,
  LAB: LAB_PHASES,
  QUIZ: QUIZ_PHASES,
  ASSIGNMENT: ASSIGNMENT_PHASES,
};

/** Distribute a set of phases across a date span (now -> due). */
export function schedulePhases(
  phases: Phase[],
  start: Date,
  end: Date
): { title: string; dueDate: Date }[] {
  const span = Math.max(end.getTime() - start.getTime(), 60 * 60 * 1000);
  let cursor = start.getTime();
  return phases.map((p) => {
    const due = new Date(start.getTime() + span * p.weight);
    const item = { title: p.label, dueDate: new Date(Math.max(cursor, start.getTime())) };
    cursor = due.getTime();
    item.dueDate = due;
    if (due.getTime() > end.getTime()) {
      item.dueDate = end;
    }
    return item;
  });
}

export function phaseTitlesFor(type: TaskType) {
  return PHASE_MAP[type].map((p) => p.label);
}

export async function generateSubtasks(taskId: string) {
  const task = await prisma.academicTask.findUnique({
    where: { id: taskId },
  });
  if (!task) return null;

  const now = new Date();
  const due = new Date(task.dueDate);
  const phases = PHASE_MAP[task.type];
  const planned = schedulePhases(phases, now, due);

  const existing = await prisma.subTask.count({ where: { taskId } });
  if (existing > 0) return null;

  return prisma.subTask.createMany({
    data: planned.map((p, i) => ({
      taskId,
      title: p.title,
      dueDate: p.dueDate,
      orderIndex: i,
    })),
    skipDuplicates: true,
  });
}