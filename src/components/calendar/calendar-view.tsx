"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core";
import { Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createScheduleFromCalendar,
  deleteSchedule,
  moveSchedule,
  runAutoScheduler,
} from "@/lib/actions/schedules";
import { formatDateTime, formatTime } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  fetchSchedules,
  schedulesQueryKey,
  type ExtendedProps,
} from "./schedules-query";

type SelectedEvent = ExtendedProps & {
  title: string;
  start: string;
  end: string;
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function CalendarView() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<SelectedEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<{ start: string; end: string } | null>(null);
  const [preview, setPreview] = useState<{ id: string; title: string; start: string; end: string }[] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [isNarrow, setIsNarrow] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const headerToolbar = {
    left: isNarrow ? "prev,next" : "prev,next today",
    center: "title",
    right: isNarrow
      ? "timeGridDay,timeGridWeek,dayGridMonth"
      : "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
  };

  const initialView = isNarrow ? "dayGridMonth" : "timeGridWeek";

  const { data, isLoading } = useQuery({
    queryKey: schedulesQueryKey,
    queryFn: fetchSchedules,
    staleTime: 5 * 60 * 1000,
  });

  const events = useMemo(
    () =>
      (data?.events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        backgroundColor: e.backgroundColor,
        borderColor: e.borderColor,
        textColor: e.textColor,
        className: e.className,
        extendedProps: e.extendedProps,
      })),
    [data]
  );

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: schedulesQueryKey });
  };

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const props = (arg.event.extendedProps ?? {}) as ExtendedProps;
    setSelected({
      ...props,
      title: arg.event.title,
      start: arg.event.start?.toISOString() ?? "",
      end: arg.event.end?.toISOString() ?? "",
    });
  }, []);

  const handleDateSelect = useCallback((arg: DateSelectArg) => {
    if (arg.allDay) return;
    setSelectedDate({ start: arg.start.toISOString(), end: arg.end.toISOString() });
  }, []);

  const handleEventDrop = useCallback(
    async (arg: EventDropArg) => {
      const props = (arg.event.extendedProps ?? {}) as ExtendedProps;
      if (props.kind === "task") {
        arg.revert();
        toast.info("Tasks can't be moved on the calendar. Edit them in Tasks.");
        return;
      }
      if (!props.scheduleId || !arg.event.start || !arg.event.end) {
        arg.revert();
        return;
      }
      try {
        await moveSchedule(props.scheduleId, arg.event.start.toISOString(), arg.event.end.toISOString());
        refetch();
        toast.success("Schedule updated");
      } catch {
        arg.revert();
        toast.error("Failed to move schedule");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleGenerate = async () => {
    setWorking(true);
    try {
      const result = await runAutoScheduler(true);
      setPreview(result);
      setPreviewOpen(true);
    } catch {
      toast.error("Failed to preview plan");
    } finally {
      setWorking(false);
    }
  };

  const applyPreview = async () => {
    setWorking(true);
    try {
      await runAutoScheduler(false);
      setPreviewOpen(false);
      refetch();
      toast.success("Study blocks generated");
    } catch {
      toast.error("Failed to generate plan");
    } finally {
      setWorking(false);
    }
  };

  const saveNewBlock = async () => {
    if (!selectedDate) return;
    setWorking(true);
    try {
      await createScheduleFromCalendar({
        title: "Study block",
        start: selectedDate.start,
        end: selectedDate.end,
      });
      setSelectedDate(null);
      refetch();
      toast.success("Study block added");
    } catch {
      toast.error("Failed to add block");
    } finally {
      setWorking(false);
    }
  };

  const removeSchedule = async () => {
    if (!selected?.scheduleId) return;
    await deleteSchedule(selected.scheduleId);
    setSelected(null);
    refetch();
    toast.success("Removed from schedule");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule Matrix</h1>
          <p className="text-sm text-muted-foreground">
            Fixed classes, auto-allocated study blocks and hard deadlines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={working}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Auto-schedule
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/calendar/ics">
              <Download className="mr-1.5 h-4 w-4" /> Export .ics
            </a>
          </Button>
        </div>
      </div>

      <div className="cal-shell relative rounded-lg border p-2 shadow-sm sm:p-4">
        {isLoading && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-background/60 text-sm text-muted-foreground">
            Loading schedule…
          </div>
        )}
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            headerToolbar={headerToolbar}
            initialView={initialView}
            editable
            selectable
            selectMirror
            dayMaxEvents={4}
            height="auto"
            nowIndicator
            events={events}
            eventClick={handleEventClick}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventContent={(arg) => {
              const props = (arg.event.extendedProps ?? {}) as ExtendedProps;
              if (props.kind !== "task") return true;
              const time = props.dueDate ? formatTime(props.dueDate) : "";
              return {
                html: `<span class="fc-event-title">${escapeHtml(arg.event.title)}</span><span class="cal-deadline-time">${escapeHtml(time)}</span>`,
              };
            }}
            slotMinTime="07:00:00"
            slotMaxTime="23:00:00"
            allDaySlot
            firstDay={1}
          />
      </div>

      <Dialog open={selected != null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription className="capitalize">
              {selected?.kind === "task" ? "Deadline" : (selected?.scheduleType ?? "event")?.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {selected?.kind === "task" ? (
              <>
                <p>Due: {selected ? formatDateTime(selected.dueDate ?? selected.start) : ""}</p>
                <p>
                  Status: <span className="capitalize">{selected.status?.toLowerCase()}</span>
                </p>
                <p>Weight: {selected.weightPercentage}%</p>
                {selected.portalUrl && (
                  <a
                    href={selected.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Submission portal
                  </a>
                )}
              </>
            ) : (
              <>
                <p>Starts: {selected ? formatDateTime(selected.start) : ""}</p>
                <p>Ends: {selected ? formatDateTime(selected.end) : ""}</p>
              </>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between">
            {selected?.kind === "schedule" ? (
              <Button variant="destructive" onClick={removeSchedule}>
                Delete
              </Button>
            ) : (
              selected?.courseId && (
                <Button asChild variant="outline">
                  <a href={`/courses/${selected.courseId}`}>Open course</a>
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedDate != null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add study block</DialogTitle>
            <DialogDescription>
              A manual block will be created for the selected time range.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={saveNewBlock} disabled={working}>
              {working ? "Adding…" : "Add block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Study plan preview</DialogTitle>
            <DialogDescription>
              {preview?.length ?? 0} study blocks will be allocated to your free slots.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-1 overflow-y-auto text-sm">
            {(preview ?? []).map((b) => (
              <div
                key={b.id}
                className={cn("flex items-center justify-between rounded border px-3 py-2")}
              >
                <span>{b.title}</span>
                <span className="text-muted-foreground">{formatDateTime(b.start)}</span>
              </div>
            ))}
            {(preview ?? []).length === 0 && (
              <p className="py-4 text-center text-muted-foreground">
                No free slots found. Add fixed commitments or change the routine mode.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={applyPreview} disabled={working}>
              {working ? "Generating…" : "Apply plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}