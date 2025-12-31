import { 
  House, 
  Users,
  Calendar,
  Settings,
  FileText,
  User,
  MessageCircle,
  ChartNoAxesCombined,
  NotebookPen,
  BarChart3,
  PieChart,
  Award
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
export type Role = "admin" | "hr" | "employee" | "manager";

export interface SidebarItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const sidebarConfig: Record<Role, SidebarItem[]> = {
  admin: [
    { label: "Dashboard", icon: House, path: "/admin" },
    { label: "User Management", icon: Users, path: "/admin/users" },
    { label: "Review Cycles", icon: Calendar, path: "/admin/performance" },
    { label: "Configuration", icon: Settings, path: "/admin/settings" },
    { label: "Audit Log", icon: FileText, path: "/admin/audit" },
    { label: "Profile", icon: User, path: "/admin/profile" },
  ],

  hr: [
    { label: "Dashboard", icon: House, path: "/hr" },
    { label: "Performance Oversight", icon: BarChart3, path: "/hr/performance" },
    { label: "Development Plans", icon: NotebookPen, path: "/hr/development" },
    { label: "Talent Analytics", icon: PieChart, path: "/hr/analytics" },
    { label: "Reward Approvals", icon: Award, path: "/hr/rewards" },
    { label: "Profile", icon: User, path: "/hr/profile" },
  ],

  employee: [
    { label: "Dashboard", icon: House, path: "/employee" },
    { label: "Performance Review", icon: ChartNoAxesCombined, path: "/employee/performance" },
    { label: "360 Feedback", icon: MessageCircle, path: "/employee/feedback" },
    { label: "Development Plans", icon: NotebookPen, path: "/employee/development" },
    { label: "Rewards", icon: Award, path: "/employee/reward" },
    { label: "Profile", icon: User, path: "/employee/profile"},
  ],

  manager: [
    { label: "Dashboard", icon: House, path: "/manager" },
    { label: "Performance Review", icon: ChartNoAxesCombined, path: "/manager/performance" },
    { label: "360 Feedback", icon: MessageCircle, path: "/manager/feedback" },
    { label: "Development Overview", icon: NotebookPen, path: "/manager/development-overview" },
    { label: "Team Reward", icon: Award, path: "/manager/team-reward" },
    { label: "Profile", icon: User, path: "/manager/profile"},
  ],
};