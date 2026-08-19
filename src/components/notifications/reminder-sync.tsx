"use client";

import { useEffect } from "react";

/** Fire the reminder engine once per page session so the
 *  notification center stays fresh even without the cron job. */
export function ReminderSync() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { runReminderCheck } = await import("@/lib/actions/notifications");
        if (!cancelled) await runReminderCheck();
      } catch {
        // non-critical: engine is also run by the background scheduler
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}