import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Routine mode, reminders, GPA targets and timer preferences.
        </p>
      </div>
      <SettingsForm
        name={user.name}
        email={user.email}
        targetGpa={user.targetGpa}
        settings={{
          routineMode: settings?.routineMode ?? "STANDARD",
          timezone: settings?.timezone ?? "UTC",
          attendanceThreshold: settings?.attendanceThreshold ?? 75,
          gpaScale: settings?.gpaScale ?? 4,
          pomodoroWork: settings?.pomodoroWork ?? 25,
          pomodoroBreak: settings?.pomodoroBreak ?? 5,
          digestEnabled: settings?.digestEnabled ?? true,
          reminderLead24h: settings?.reminderLead24h ?? true,
          reminderLead3h: settings?.reminderLead3h ?? true,
          reminderLead1h: settings?.reminderLead1h ?? true,
        }}
      />
    </div>
  );
}