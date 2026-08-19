import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ReminderSync } from "@/components/notifications/reminder-sync";
import { QueryProvider } from "@/components/providers/query-provider";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={user.name}
          email={user.email}
          unread={unread}
        />
        <ReminderSync />
        <main className="flex-1 p-4 sm:p-6">
          <QueryProvider>{children}</QueryProvider>
        </main>
      </div>
    </div>
  );
}