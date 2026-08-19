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
      <CardContent className="flex items-baseline gap-2">
        <div className="text-3xl font-bold">{gpa == null ? "—" : gpa.toFixed(2)}</div>
        {delta != null &&
          (delta >= 0 ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {delta.toFixed(2)} above target
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <TrendingDown className="h-3.5 w-3.5" />
              {Math.abs(delta).toFixed(2)} below target
            </span>
          ))}
        {delta == null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Add grades to estimate
          </span>
        )}
      </CardContent>
    </Card>
  );
}