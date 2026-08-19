import {
  Bell,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Settings,
  Target,
  Timer,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Schedule", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/focus", label: "Focus Timer", icon: Timer },
  { href: "/gpa", label: "GPA Planner", icon: Target },
  { href: "/attendance", label: "Attendance", icon: UserCheck },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];