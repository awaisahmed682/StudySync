"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  AcademicTask,
  AttendanceRecord,
  Course,
  Resource,
} from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatDate,
  formatDateTime,
  relativeDue,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
} from "@/lib/constants";
import { TaskForm } from "@/components/tasks/task-form";
import { addResource, deleteAttendance, deleteResource, recordAttendance } from "@/lib/actions/records";

type FullCourse = Course & {
  tasks: (AcademicTask & { subtasks: { id: string }[] })[];
  attendance: AttendanceRecord[];
  resources: Resource[];
};

export function CourseDetailTabs({
  course,
  attendancePct,
  threshold,
}: {
  course: FullCourse;
  attendancePct: number | null;
  threshold: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"tasks" | "attendance" | "resources">("tasks");
  const [taskOpen, setTaskOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState("LINK");
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attStatus, setAttStatus] = useState("PRESENT");

  const atRisk = attendancePct != null && attendancePct < threshold;

  const saveResource = async () => {
    const fd = new FormData();
    fd.set("courseId", course.id);
    fd.set("title", resourceTitle);
    fd.set("url", resourceUrl);
    fd.set("type", resourceType);
    await addResource(fd);
    setResourceTitle("");
    setResourceUrl("");
    router.refresh();
    toast.success("Resource added");
  };

  const logAttendance = async () => {
    const fd = new FormData();
    fd.set("courseId", course.id);
    fd.set("date", attDate);
    fd.set("status", attStatus);
    await recordAttendance(fd);
    router.refresh();
    toast.success("Attendance recorded");
  };

  const tabs = [
    { id: "tasks", label: `Tasks (${course.tasks.length})` },
    { id: "attendance", label: "Attendance" },
    { id: "resources", label: `Resources (${course.resources.length})` },
  ] as const;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "tasks" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setTaskOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add task
            </Button>
          </div>
          {course.tasks.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No tasks yet for this course.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Task</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Weight</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {course.tasks.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-accent">
                      <td className="px-3 py-2 font-medium">
                        <span className="flex flex-col">
                          {t.title}
                          {t.subtasks.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {t.subtasks.length} sub-tasks
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 capitalize">
                        {TASK_TYPE_LABELS[t.type]}
                      </td>
                      <td className="px-3 py-2">
                        {formatDateTime(t.dueDate)}{" "}
                        <Badge variant="outline" className="ml-1">
                          {relativeDue(t.dueDate)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{t.weightPercentage}%</td>
                      <td className="px-3 py-2">
                        <Badge variant={t.status === "GRADED" ? "default" : "secondary"}>
                          {TASK_STATUS_LABELS[t.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {t.gradeAchieved != null ? `${t.gradeAchieved}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogContent className="scrollbar-hidden max-h-[70dvh] w-[min(24rem,calc(100%-3rem))] overflow-y-auto sm:w-auto">
              <DialogHeader>
                <DialogTitle>Add task</DialogTitle>
                <DialogDescription>Add an assessment to {course.courseName}.</DialogDescription>
              </DialogHeader>
              <TaskForm
                courses={[{ id: course.id, courseCode: course.courseCode, courseName: course.courseName }]}
                defaultCourseId={course.id}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Attendance rate</p>
              <p className="text-3xl font-bold">
                {attendancePct == null ? "—" : `${attendancePct.toFixed(1)}%`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Policy threshold: {threshold}%
              </p>
              {atRisk && (
                <Badge variant="destructive" className="mt-2">
                  Below required threshold
                </Badge>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-medium">Log today&apos;s attendance</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="attDate">Date</Label>
                  <Input id="attDate" type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={attStatus} onValueChange={setAttStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="EXCUSED">Excused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" className="mt-3" onClick={logAttendance}>
                Record
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {course.attendance.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{formatDate(a.date)}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          a.status === "PRESENT"
                            ? "default"
                            : a.status === "EXCUSED"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={async () => {
                          await deleteAttendance(course.id, a.date.toISOString());
                          router.refresh();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {course.attendance.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">
                      No attendance logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "resources" && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-sm font-medium">Add a resource</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Title (e.g. 2024 past paper)"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
              />
              <Input
                placeholder="URL"
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
              />
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTES">Notes</SelectItem>
                  <SelectItem value="PAST_PAPER">Past paper</SelectItem>
                  <SelectItem value="LINK">Link</SelectItem>
                  <SelectItem value="FILE">File</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={saveResource}>
                <Plus className="mr-1.5 h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {course.resources.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No resources yet. Link notes, past papers and study material.
            </p>
          ) : (
            <div className="space-y-1.5">
              {course.resources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm font-medium hover:underline"
                  >
                    <Badge variant="outline" className="shrink-0 uppercase">
                      {r.type.replace("_", " ")}
                    </Badge>
                    <span className="truncate">{r.title}</span>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={async () => {
                      await deleteResource(r.id);
                      router.refresh();
                      toast.success("Resource removed");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}