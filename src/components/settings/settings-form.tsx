"use client";

import { useActionState } from "react";
import { updateSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTINE_MODES } from "@/lib/constants";

type SettingsData = {
  routineMode: string;
  timezone: string;
  attendanceThreshold: number;
  gpaScale: number;
  pomodoroWork: number;
  pomodoroBreak: number;
  digestEnabled: boolean;
  reminderLead24h: boolean;
  reminderLead3h: boolean;
  reminderLead1h: boolean;
};

export function SettingsForm({
  name,
  email,
  targetGpa,
  settings,
}: {
  name: string;
  email: string;
  targetGpa: number;
  settings: SettingsData;
}) {
  const [state, action, pending] = useActionState(updateSettings, undefined);

  return (
    <form action={action} className="space-y-4">
      {state && "error" in state && state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Account details (read-only).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic targets</CardTitle>
          <CardDescription>GPA scale, target and attendance policy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="targetGpa">Target GPA</Label>
              <Input
                id="targetGpa"
                name="targetGpa"
                type="number"
                step="0.01"
                min={0}
                max={4.5}
                defaultValue={targetGpa}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpaScale">GPA scale</Label>
              <Select name="gpaScale" defaultValue={String(settings.gpaScale)}>
                <SelectTrigger id="gpaScale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4.0 scale</SelectItem>
                  <SelectItem value="5">5.0 scale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendanceThreshold">Attendance threshold (%)</Label>
              <Input
                id="attendanceThreshold"
                name="attendanceThreshold"
                type="number"
                min={0}
                max={100}
                defaultValue={settings.attendanceThreshold}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" name="timezone" defaultValue={settings.timezone} placeholder="UTC" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Routine</CardTitle>
          <CardDescription>
            Routine templates bias how study blocks are auto-allocated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routineMode">Active routine</Label>
            <Select name="routineMode" defaultValue={settings.routineMode}>
              <SelectTrigger id="routineMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUTINE_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pomodoroWork">Focus length (min)</Label>
              <Input id="pomodoroWork" name="pomodoroWork" type="number" min={5} max={120} defaultValue={settings.pomodoroWork} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pomodoroBreak">Break length (min)</Label>
              <Input id="pomodoroBreak" name="pomodoroBreak" type="number" min={1} max={60} defaultValue={settings.pomodoroBreak} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
          <CardDescription>
            Deadlines generate in-app notifications; email/push/webhook use the provider stubs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            name="reminderLead24h"
            label="24-hour deadline reminder"
            defaultChecked={settings.reminderLead24h}
          />
          <ToggleRow
            name="reminderLead3h"
            label="3-hour deadline reminder"
            defaultChecked={settings.reminderLead3h}
          />
          <ToggleRow
            name="reminderLead1h"
            label="1-hour deadline reminder"
            defaultChecked={settings.reminderLead1h}
          />
          <ToggleRow
            name="digestEnabled"
            label="7:00 AM daily digest"
            defaultChecked={settings.digestEnabled}
          />
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

function ToggleRow({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
      <Label htmlFor={name} className="cursor-pointer">
        {label}
      </Label>
      <Switch id={name} name={name} defaultChecked={defaultChecked} />
    </div>
  );
}