"use client";

import { useActionState } from "react";
import { createTask } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TASK_TYPE_LABELS } from "@/lib/constants";

export function TaskForm({
  courses,
  defaultCourseId,
}: {
  courses: { id: string; courseCode: string; courseName: string }[];
  defaultCourseId?: string;
}) {
  const [state, action, pending] = useActionState(createTask, undefined);

  return (
    <form action={action} className="space-y-4">
      {state && "error" in state && state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="courseId">Course</Label>
        <Select name="courseId" required defaultValue={defaultCourseId}>
          <SelectTrigger id="courseId">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.courseCode} — {c.courseName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. Chapter 4 problem set" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue="ASSIGNMENT">
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date &amp; time</Label>
          <Input id="dueDate" name="dueDate" type="datetime-local" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weightPercentage">Weight (%)</Label>
          <Input id="weightPercentage" name="weightPercentage" type="number" min={0} max={100} defaultValue={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty (1–5)</Label>
          <Input id="difficulty" name="difficulty" type="number" min={1} max={5} defaultValue={3} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="portalUrl">Submission portal URL</Label>
        <Input id="portalUrl" name="portalUrl" type="url" placeholder="https://canvas…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Reading list, hints, rubric…" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="autoSubtasks" name="autoSubtasks" value="true" />
        <label htmlFor="autoSubtasks" className="text-sm text-muted-foreground">
          Auto-generate sub-tasks (papers &amp; projects)
        </label>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create task"}
      </Button>
    </form>
  );
}