import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-scale-in w-full">
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}