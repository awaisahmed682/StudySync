"use client";

import Link from "next/link";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}

export function Topbar({
  name,
  email,
  unread,
}: {
  name: string;
  email: string;
  unread: number;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-1.5">
        <div className="lg:hidden">
          <MobileSidebar />
        </div>
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            S
          </span>
          <span className="text-lg font-bold tracking-tight">StudySync</span>
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/notifications" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:block">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="w-full">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2"
                onClick={async () => {
                  const { logout } = await import("@/lib/actions/auth");
                  await logout();
                }}
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}