"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CourseForm } from "@/components/courses/course-form";

export function CourseListClient() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" /> Add course
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="scrollbar-hidden max-h-[70dvh] w-[min(24rem,calc(100%-3rem))] overflow-y-auto sm:w-auto">
          <DialogHeader>
            <DialogTitle>Add course</DialogTitle>
            <DialogDescription>Store course info, syllabus and grading details.</DialogDescription>
          </DialogHeader>
          <CourseForm />
        </DialogContent>
      </Dialog>
    </>
  );
}