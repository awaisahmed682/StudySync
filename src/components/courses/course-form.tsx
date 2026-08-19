"use client";

import { useActionState } from "react";
import { createCourse } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COURSE_COLORS } from "@/lib/constants";

export function CourseForm() {
  const [state, action, pending] = useActionState(createCourse, undefined);

  return (
    <form action={action} className="space-y-4">
      {state && "error" in state && state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="courseCode">Course code</Label>
          <Input id="courseCode" name="courseCode" placeholder="CS301" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditHours">Credit hours</Label>
          <Input id="creditHours" name="creditHours" type="number" min={1} max={10} defaultValue={3} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="courseName">Course name</Label>
        <Input id="courseName" name="courseName" placeholder="Operating Systems" required />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COURSE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={(e) => {
                const parent = (e.currentTarget.closest("form") as HTMLFormElement | null);
                if (!parent) return;
                const hidden = parent.querySelector<HTMLInputElement>('input[name="colorHex"]');
                if (hidden) hidden.value = c;
                parent.querySelectorAll("[data-swatch]").forEach((el) => el.classList.remove("ring-2", "ring-ring"));
                e.currentTarget.classList.add("ring-2", "ring-ring");
              }}
              data-swatch
              className="h-7 w-7 rounded-full"
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <input type="hidden" name="colorHex" defaultValue="#6366f1" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructorEmail">Instructor email</Label>
        <Input id="instructorEmail" name="instructorEmail" type="email" placeholder="prof@university.edu" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="officeHours">Office hours</Label>
        <Input id="officeHours" name="officeHours" placeholder="Mon &amp; Wed 14:00–15:00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="syllabusUrl">Syllabus URL</Label>
        <Input id="syllabusUrl" name="syllabusUrl" type="url" placeholder="https://…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gradingCriteria">Grading criteria</Label>
        <Textarea id="gradingCriteria" name="gradingCriteria" placeholder="Quizzes 20%, assignments 30%, final 50%…" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create course"}
      </Button>
    </form>
  );
}