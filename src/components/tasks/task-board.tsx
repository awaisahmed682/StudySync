"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { List, LayoutGrid, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskForm } from "@/components/tasks/task-form";
import { formatDateTime, relativeDue, TASK_STATUS_LABELS, TASK_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  deleteTask,
  generateTaskSubtasks,
  updateTask,
  updateTaskStatus,
} from "@/lib/actions/tasks";

type BoardTask = {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  status: string;
  weightPercentage: number;
  difficulty: number;
  portalUrl?: string | null;
  gradeAchieved?: number | null;
  course: { courseCode: string; courseName: string; colorHex: string };
  subtasks: { id: string; title: string; dueDate: string; status: string }[];
};

const STATUSES = ["PENDING", "IN_PROGRESS", "SUBMITTED", "GRADED"] as const;

export function TaskBoard({ courses }: { courses: { id: string; courseCode: string; courseName: string }[] }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"board" | "list">("board");
  const [selected, setSelected] = useState<BoardTask | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      return (await res.json()) as { tasks: BoardTask[] };
    },
  });

  const tasks = useMemo(() => data?.tasks ?? [], [data]);

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks]
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["schedules"] });
  };

  const dropOn = async (status: string) => {
    if (!dragId) return;
    try {
      await updateTaskStatus(dragId, status);
      invalidate();
    } catch {
      toast.error("Failed to update task");
    }
    setDragId(null);
  };

  const openEdit = (t: BoardTask) => {
    setSelected(t);
    setEditStatus(t.status);
    setGrade(t.gradeAchieved != null ? String(t.gradeAchieved) : "");
  };

  const saveEdit = async () => {
    if (!selected) return;
    const fd = new FormData();
    fd.set("status", editStatus);
    if (editStatus === "GRADED") fd.set("gradeAchieved", grade);
    try {
      await updateTask(selected.id, fd);
      setSelected(null);
      invalidate();
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    }
  };

  const remove = async (id: string) => {
    await deleteTask(id);
    setSelected(null);
    invalidate();
    toast.success("Task deleted");
  };

  const genSubtasks = async (id: string) => {
    await generateTaskSubtasks(id);
    invalidate();
    toast.success("Sub-tasks generated");
  };

  if (isLoading) {
    return <div className="grid h-64 place-items-center text-sm text-muted-foreground">Loading tasks…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task &amp; Deadline Hub</h1>
          <p className="text-sm text-muted-foreground">{tasks.length} tasks across all courses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New task
          </Button>
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("board")}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" /> Board
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="mr-1.5 h-4 w-4" /> List
            </Button>
          </div>
        </div>
      </div>

      {view === "board" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => {
            const column = sorted.filter((t) => t.status === status);
            return (
              <div
                key={status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropOn(status)}
                className={cn(
                  "flex flex-col rounded-lg border bg-muted/30 p-2",
                  dragId && "ring-1 ring-ring"
                )}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h2>
                  <Badge variant="secondary">{column.length}</Badge>
                </div>
                <div className="space-y-2">
                  {column.map((t) => (
                    <TaskCard key={t.id} task={t} onDragStart={() => setDragId(t.id)} onClick={() => openEdit(t)} />
                  ))}
                  {column.length === 0 && (
                    <p className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">
                      Drop tasks here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Course</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Weight</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => openEdit(t)}
                  className="cursor-pointer border-b last:border-0 hover:bg-accent"
                >
                  <td className="max-w-xs truncate px-3 py-2 font-medium">{t.title}</td>
                  <td className="px-3 py-2">
                    <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${t.course.colorHex}22`, color: t.course.colorHex }}>
                      {t.course.courseCode}
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize">{TASK_TYPE_LABELS[t.type as keyof typeof TASK_TYPE_LABELS]}</td>
                  <td className="px-3 py-2">{formatDateTime(t.dueDate)}</td>
                  <td className="px-3 py-2">{t.weightPercentage}%</td>
                  <td className="px-3 py-2">
                    <Badge variant={t.status === "GRADED" ? "default" : "secondary"}>
                      {TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No tasks yet. Add one from a course page.
            </p>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="scrollbar-hidden max-h-[70dvh] w-[min(24rem,calc(100%-3rem))] overflow-y-auto sm:w-auto">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Add an assessment, deadline or paper to a course.
            </DialogDescription>
          </DialogHeader>
          <TaskForm courses={courses} />
        </DialogContent>
      </Dialog>

      <Dialog open={selected != null} onOpenChange={(open) => !open && setSelected(null)}>        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected && (
                <>
                  {selected.course.courseCode} · {TASK_TYPE_LABELS[selected.type as keyof typeof TASK_TYPE_LABELS]} · due{" "}
                  {formatDateTime(selected.dueDate)} ({relativeDue(selected.dueDate)})
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selected && selected.subtasks.length > 0 && (
              <div className="space-y-1.5">
                <Label>Sub-tasks</Label>
                {selected.subtasks.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span>{s.title}</span>
                    <Badge variant="outline">{TASK_STATUS_LABELS[s.status as keyof typeof TASK_STATUS_LABELS]}</Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger id="editStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {TASK_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editStatus === "GRADED" && (
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade (%)</Label>
                  <Input id="grade" type="number" min={0} max={100} value={grade} onChange={(e) => setGrade(e.target.value)} />
                </div>
              )}
            </div>
            {selected?.portalUrl && (
              <a href={selected.portalUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                Open submission portal
              </a>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selected && genSubtasks(selected.id)}
                disabled={!selected || (selected.type !== "PAPER" && selected.type !== "PROJECT" && selected.type !== "MIDTERM" && selected.type !== "FINAL")}
              >
                <Wand2 className="mr-1 h-3.5 w-3.5" /> Sub-tasks
              </Button>
              <Button variant="destructive" size="sm" onClick={() => selected && remove(selected.id)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
            </div>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCard({
  task,
  onDragStart,
  onClick,
}: {
  task: BoardTask;
  onDragStart: () => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-pointer rounded-md border bg-background p-3 shadow-sm transition-shadow hover:shadow"
      style={{ borderLeft: `3px solid ${task.course.colorHex}` }}
    >
      <p className="mb-1.5 text-sm font-medium leading-snug">{task.title}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {task.course.courseCode}
        </Badge>
        <Badge variant="outline" className="px-1.5 py-0 text-[10px] capitalize">
          {TASK_TYPE_LABELS[task.type as keyof typeof TASK_TYPE_LABELS]}
        </Badge>
        <span className={cn(task.status === "PENDING" && relativeDue(task.dueDate) === "Overdue" ? "text-destructive" : "")}>
          {relativeDue(task.dueDate)}
        </span>
      </div>
    </div>
  );
}