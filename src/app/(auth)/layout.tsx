import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign in" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Link
        href="/login"
        className="animate-fade-in-up mb-6 flex items-center gap-2 text-2xl font-bold tracking-tight"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          S
        </span>
        StudySync
      </Link>
      <div className="animate-fade-in-up stagger-1 w-full max-w-md">{children}</div>
    </div>
  );
}