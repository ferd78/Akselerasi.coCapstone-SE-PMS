import { 
  House, 
  MessageCircle, 
  ChartNoAxesCombined, 
  NotebookPen, 
  ShieldUser, 
  Award,
  User
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
    { label: "Performance Review", icon: ChartNoAxesCombined, path: "/admin/performance" },
    { label: "360 Feedback", icon: MessageCircle, path: "/admin/feedback" },
    { label: "Development Plans", icon: NotebookPen, path: "/admin/development" },
    { label: "Admin Settings", icon: ShieldUser, path: "/admin/settings" },
  ],

  hr: [
    { label: "Dashboard", icon: House, path: "/hr" },
    { label: "Performance Review", icon: ChartNoAxesCombined, path: "/hr/performance" },
    { label: "360 Feedback", icon: MessageCircle, path: "/hr/feedback" },
    { label: "Development Plans", icon: NotebookPen, path: "/hr/development" },
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
  ],
};