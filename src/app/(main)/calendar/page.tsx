import { requireUser } from "@/lib/auth";
import { CalendarLazy } from "@/components/calendar/calendar-lazy";

export const dynamic = "force-dynamic";

export const metadata = { title: "Schedule" };

export default async function CalendarPage() {
  await requireUser();
  return <CalendarLazy />;
}