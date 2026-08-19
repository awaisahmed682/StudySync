import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsCenter } from "@/components/notifications/notifications-center";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: { task: { include: { course: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => n.readAt == null).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>
      </div>
      <NotificationsCenter notifications={notifications} />
    </div>
  );
}