import Link from "next/link";
import { BookOpen, ClipboardCheck, ListChecks, Timer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardQuickLinks() {
  const links = [
    { href: "/courses", label: "View course", icon: BookOpen },
    { href: "/tasks", label: "View task", icon: ListChecks },
    { href: "/attendance", label: "Show attendance", icon: ClipboardCheck },
    { href: "/focus", label: "Focus", icon: Timer },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <Link key={l.href} href={l.href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <Icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}