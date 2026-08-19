"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => <CalendarLoading />,
  }
);

function CalendarLoading() {
  return (
    <div className="cal-shell rounded-lg border p-2 shadow-sm sm:p-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-9 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

export function CalendarLazy() {
  return <CalendarView />;
}