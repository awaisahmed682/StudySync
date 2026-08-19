"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { endFocusSession } from "@/lib/actions/records";

type Mode = "work" | "break";

export function FocusTimer({
  workMin,
  breakMin,
  tasks,
}: {
  workMin: number;
  breakMin: number;
  tasks: { id: string; title: string; courseCode: string }[];
}) {
  const [mode, setMode] = useState<Mode>("work");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const [pomodoros, setPomodoros] = useState(0);
  const [taskId, setTaskId] = useState<string>("");
  const [ambient, setAmbient] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetSeconds = (m: Mode) => {
    setSecondsLeft(m === "work" ? workMin * 60 : breakMin * 60);
  };

  const handleComplete = async () => {
    setRunning(false);
    if (mode === "work") {
      const mins = Math.max(1, Math.round(elapsed / 60));
      try {
        await endFocusSession({
          taskId: taskId || null,
          durationMinutes: mins,
          pomodoros: pomodoros + 1,
        });
        toast.success(`Pomodoro complete — ${mins} min logged`);
      } catch {
        toast.error("Could not log session");
      }
      setPomodoros((p) => p + 1);
      setMode("break");
      resetSeconds("break");
      setElapsed(0);
    } else {
      toast("Break over — back to work!");
      setMode("work");
      resetSeconds("work");
      setElapsed(0);
    }
  };

  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleComplete();
          return 0;
        }
        setElapsed((e) => e + 1);
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setFullscreen(false));
    }
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 rounded-xl border p-8",
        fullscreen && "min-h-screen rounded-none border-0"
      )}
    >
      <div className="flex items-center gap-3">
        <Badge variant={mode === "work" ? "default" : "secondary"} className="text-sm">
          {mode === "work" ? "Focus session" : "Break"}
        </Badge>
        <Badge variant="outline">{pomodoros} pomodoros</Badge>
      </div>

      <div className="text-7xl font-bold tabular-nums sm:text-8xl">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>

      <div className="w-full max-w-sm space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Linked task</p>
        <Select value={taskId} onValueChange={setTaskId}>
          <SelectTrigger>
            <SelectValue placeholder="No task linked" />
          </SelectTrigger>
          <SelectContent>
            {tasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.courseCode}: {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={ambient ? "default" : "outline"}
          size="sm"
          onClick={() => setAmbient((a) => !a)}
        >
          {ambient ? "Ambient: on" : "Ambient sound (stub)"}
        </Button>
        <Button variant="outline" size="icon" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setRunning(false);
            resetSeconds(mode);
            setElapsed(0);
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="lg" className="h-14 w-14 rounded-full" onClick={() => setRunning((r) => !r)}>
          {running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
        </Button>
        <Button variant="outline" size="icon" onClick={handleComplete}>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {workMin} min focus / {breakMin} min break · configured in Settings
      </p>
    </div>
  );
}