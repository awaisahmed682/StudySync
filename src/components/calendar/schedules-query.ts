export type ExtendedProps = {
  kind: "schedule" | "task";
  scheduleId?: string;
  scheduleType?: string;
  recurring?: boolean;
  taskId?: string;
  courseId?: string;
  status?: string;
  weightPercentage?: number;
  portalUrl?: string | null;
  dueDate?: string;
};

export type ApiEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  className?: string;
  extendedProps: ExtendedProps;
};

export const schedulesQueryKey = ["schedules"] as const;

export async function fetchSchedules(): Promise<{ events: ApiEvent[] }> {
  const start = new Date(Date.now() - 7 * 864e5).toISOString();
  const end = new Date(Date.now() + 90 * 864e5).toISOString();
  const res = await fetch(
    `/api/schedules?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
  );
  if (!res.ok) throw new Error("Failed to load schedule");
  return (await res.json()) as { events: ApiEvent[] };
}
