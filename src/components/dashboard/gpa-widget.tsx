import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpDown, TrendingDown, TrendingUp } from "lucide-react";

export function GpaWidget({
  gpa,
  targetGpa,
}: {
  gpa: number | null;
  targetGpa: number;
}) {
  const delta = gpa == null ? null : gpa - targetGpa;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Estimated GPA</CardTitle>
        <CardDescription>Target: {targetGpa.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-3xl font-bold leading-none">{gpa == null ? "—" : gpa.toFixed(2)}</div>
        {delta != null && (
          <div className="flex items-center gap-1 text-xs font-medium">
            {delta >= 0 ? (
              <span className="flex items-center gap-1 whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                {delta.toFixed(2)} above target
              </span>
            ) : (
              <span className="flex items-center gap-1 whitespace-nowrap text-destructive">
                <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                {Math.abs(delta).toFixed(2)} below target
              </span>
            )}
          </div>
        )}
        {delta == null && (
          <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
            Add grades to estimate
          </span>
        )}
      </CardContent>
    </Card>
  );
}