"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Standing = {
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

type SimTask = {
  id: string;
  title: string;
  courseId: string;
  courseCode: string;
  weightPercentage: number;
};

export function GpaPlanner({
  standings,
  currentGpa,
  targetGpa,
  gpaScale,
  simTasks,
}: {
  standings: Standing[];
  currentGpa: number | null;
  targetGpa: number;
  gpaScale: number;
  simTasks: SimTask[];
}) {
  const [simTaskId, setSimTaskId] = useState("");
  const [simScore, setSimScore] = useState("80");
  const [simResult, setSimResult] = useState<number | null>(null);

  const simTask = simTasks.find((t) => t.id === simTaskId);

  const gap = currentGpa == null ? null : targetGpa - currentGpa;

  const computeSim = () => {
    if (!simTask) return;
    const projected = Number(simScore);
    const course = standings.find((s) => s.courseId === simTask.courseId);
    if (!course) return;

    const newEarned =
      course.earnedWeighted +
      projected * (simTask.weightPercentage / 100);
    const newGradedWeight = course.tasks
      .filter((t) => t.status === "GRADED" && t.gradeAchieved != null)
      .reduce((s, t) => s + t.weightPercentage, 0) + simTask.weightPercentage;
    const newCoursePercent = newEarned / (newGradedWeight / 100);

    // Recompute overall GPA with this one course changed.
    let totalPoints = 0;
    let count = 0;
    for (const s of standings) {
      if (s.courseId === simTask.courseId) {
        totalPoints += gradePoint(newCoursePercent, gpaScale);
      } else {
        const p = s.achievedPercent;
        if (p == null) continue;
        totalPoints += gradePoint(p, gpaScale);
      }
      count++;
    }
    setSimResult(count > 0 ? totalPoints / count : null);
  };

  const isOnTrack = useMemo(
    () => currentGpa != null && currentGpa >= targetGpa,
    [currentGpa, targetGpa]
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currentGpa == null ? "—" : currentGpa.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Target GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{targetGpa.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gap</CardTitle>
          </CardHeader>
          <CardContent>
            {gap == null ? (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            ) : (
              <p className={`text-3xl font-bold ${gap <= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {gap > 0 ? "+" : ""}
                {gap.toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {currentGpa != null && !isOnTrack && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-3 text-sm">
            You are <strong>{(targetGpa - currentGpa).toFixed(2)}</strong> points short of your target. Use the
            simulator below to plan what you need on upcoming assessments.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>What-If simulator</CardTitle>
          <CardDescription>
            Project a score on an upcoming assessment and see the impact on your GPA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Assessment</Label>
              <Select value={simTaskId} onValueChange={setSimTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a task" />
                </SelectTrigger>
                <SelectContent>
                  {simTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.courseCode} — {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Projected score (%)</Label>
              <Input type="number" min={0} max={100} value={simScore} onChange={(e) => setSimScore(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={computeSim} disabled={!simTask} className="w-full">
                Simulate
              </Button>
            </div>
          </div>
          {simResult != null && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              Projected GPA: <span className="font-bold">{simResult.toFixed(2)}</span>{" "}
              <span className="text-muted-foreground">
                ({simResult >= targetGpa ? "on track for target" : "below target"})
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {standings.map((s) => {
          const reqForTarget =
            s.remainingWeight > 0 && s.totalWeight > 0
              ? Math.max(
                  0,
                  Math.min(
                    100,
                    ((targetGpa / gpaScale) * 100 * s.totalWeight - s.earnedWeighted) /
                      (s.remainingWeight / 100)
                  )
                )
              : null;

          return (
            <Card key={s.courseId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {s.courseCode}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{s.courseName}</span>
                  </CardTitle>
                  <Badge variant="outline">{s.remainingWeight.toFixed(0)}% remaining</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Current standing</span>
                  <span className="text-xl font-bold">
                    {s.achievedPercent == null ? "—" : `${s.achievedPercent.toFixed(1)}%`}
                  </span>
                </div>
                {reqForTarget != null && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Avg needed to hit target</span>
                    <span className="font-semibold">{reqForTarget.toFixed(1)}%</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  {s.tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded border px-3 py-1.5 text-xs">
                      <span className="truncate pr-2">{t.title}</span>
                      <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                        {t.status === "GRADED" && t.gradeAchieved != null ? (
                          <Badge variant="default">{t.gradeAchieved}%</Badge>
                        ) : (
                          <Badge variant="outline">{t.status.replace("_", " ")}</Badge>
                        )}
                        <span>{t.weightPercentage}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function gradePoint(percent: number, scale: number) {
  return Math.min(scale, Math.max(0, (Math.max(0, Math.min(100, percent)) / 100) * scale));
}