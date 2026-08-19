import "server-only";

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type icsEvent = {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
};

export function buildIcsCalendar(events: icsEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudySync//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:StudySync Schedule",
  ];

  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@studysync`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      `SUMMARY:${escapeText(e.title)}`
    );
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function buildUserCalendarEvents(input: {
  schedules: { id: string; title: string; startTime: Date; endTime: Date; type: string }[];
  tasks: { id: string; title: string; dueDate: Date; course: { courseName: string } }[];
}): icsEvent[] {
  const events: icsEvent[] = input.schedules.map((s) => ({
    uid: `schedule-${s.id}`,
    title: s.title,
    start: s.startTime,
    end: s.endTime,
    description: s.type === "DYNAMIC" ? "Auto-allocated study block" : "Scheduled event",
  }));

  for (const t of input.tasks) {
    events.push({
      uid: `task-${t.id}`,
      title: `Due: ${t.title} (${t.course.courseName})`,
      start: t.dueDate,
      end: new Date(t.dueDate.getTime() + 30 * 60_000),
      description: "StudySync deadline",
    });
  }

  return events;
}