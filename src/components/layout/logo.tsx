import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        "h-8 w-8",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px] text-white drop-shadow-sm"
      >
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <>
      <LogoMark />
      <span
        className={cn(
          "text-lg font-bold tracking-tight text-foreground",
          className
        )}
      >
        StudySync
      </span>
    </>
  );
}
