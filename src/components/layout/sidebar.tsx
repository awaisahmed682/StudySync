"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 px-6 py-5 text-xl font-bold"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">
          S
        </span>
        StudySync
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:translate-x-0.5 hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}