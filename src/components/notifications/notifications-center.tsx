"use client";

import { useRouter } from "next/navigation";
import { CheckCheck, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, relativeDue } from "@/lib/constants";
import {
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  runReminderCheck,
} from "@/lib/actions/notifications";
import type { NotificationType } from "@prisma/client";

type Item = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  readAt: Date | string | null;
  createdAt: Date | string;
  task: {
    dueDate: Date | string;
    course: { courseCode: string; colorHex: string };
  } | null;
};

const TYPE_LABELS: Record<NotificationType, string> = {
  DEADLINE: "Deadline",
  DIGEST: "Digest",
  ATTENDANCE: "Attendance",
  GPA: "GPA",
  SYSTEM: "System",
};

export function NotificationsCenter({ notifications }: { notifications: Item[] }) {
  const router = useRouter();

  const refresh = () => router.refresh();

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    refresh();
  };

  const sync = async () => {
    await runReminderCheck();
    refresh();
    toast.success("Reminders refreshed");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={sync}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Check now
        </Button>
        <Button size="sm" variant="outline" onClick={async () => { await markAllNotificationsRead(); refresh(); }}>
          <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { await clearNotifications(); refresh(); }}>
          <Trash2 className="mr-1.5 h-4 w-4" /> Clear
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          No notifications yet. The engine will ping you before deadlines and when attendance/GPA dip.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleRead(n.id)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors hover:bg-accent ${
                n.readAt == null ? "border-l-4 border-l-primary bg-muted/30" : ""
              }`}
              style={n.task ? { borderLeftColor: n.readAt == null ? n.task.course.colorHex : undefined } : undefined}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{n.title}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {TYPE_LABELS[n.type]}
                  </Badge>
                  {n.readAt == null && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {formatDateTime(n.createdAt)}
                  {n.task && (
                    <>
                      {" · "}
                      {n.task.course.courseCode} · due {relativeDue(n.task.dueDate)}
                    </>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}