export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { schedule } = await import("node-cron");
    const { runAllDigests, runAllUsers } = await import(
      "@/lib/notifications/engine"
    );

    // Check deadline/attendance/GPA reminders every 5 minutes.
    schedule("*/5 * * * *", () => {
      runAllUsers().catch((e) =>
        console.error("[scheduler] reminder run failed", e)
      );
    });

    // Morning summary digest at 7:00 AM.
    schedule("0 7 * * *", () => {
      runAllDigests().catch((e) =>
        console.error("[scheduler] digest run failed", e)
      );
    });

    console.log("[scheduler] StudySync background jobs registered.");
  }
}