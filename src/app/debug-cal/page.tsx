"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

export default function DebugCalendarPage() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    if (m === "dark" || m === "light") setMode(m);
    document.documentElement.classList.toggle("dark", (m ?? "light") === "dark");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    const dow = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - dow);

    const slot = (dayOffset: number, h: number, mins: number, dur: number) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(h, mins, 0, 0);
      const e = new Date(d.getTime() + dur * 60_000);
      return { start: d.toISOString(), end: e.toISOString() };
    };

    return [
      { id: "s1", title: "CS301 Lecture", ...slot(0, 9, 0, 60), allDay: false, className: "cal-schedule" },
      { id: "s2", title: "MATH205 Tutorial", ...slot(1, 13, 30, 90), allDay: false, className: "cal-schedule" },
      { id: "s3", title: "Study Block", ...slot(1, 15, 0, 120), allDay: false, className: "cal-schedule" },
      { id: "t1", title: "CS310: Midterm", ...slot(3, 10, 0, 45), allDay: false, backgroundColor: "#6366f142", borderColor: "#6366f1", textColor: "var(--foreground)", className: "cal-deadline" },
      { id: "t2", title: "CS310: HW1 due", ...slot(4, 9, 0, 30), allDay: false, backgroundColor: "#10b98142", borderColor: "#10b981", textColor: "var(--foreground)", className: "cal-deadline" },
      { id: "t3", title: "CS301: HW2 due", ...slot(0, 9, 0, 30), allDay: false, backgroundColor: "#f59e0b42", borderColor: "#f59e0b", textColor: "var(--foreground)", className: "cal-deadline" },
      { id: "t4", title: "CS301: HW2 due", ...slot(0, 16, 0, 30), allDay: false, backgroundColor: "#f59e0b42", borderColor: "#f59e0b", textColor: "var(--foreground)", className: "cal-deadline" },
    ];
  }, []);

  return (
    <div className="mx-auto max-w-screen-xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Debug calendar ({mode})</h1>
      <div className="cal-shell rounded-lg border p-2 shadow-sm sm:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          initialView="timeGridWeek"
          selectable
          selectMirror
          dayMaxEvents={4}
          height="auto"
          nowIndicator
          events={events}
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          firstDay={1}
        />
      </div>
    </div>
  );
}