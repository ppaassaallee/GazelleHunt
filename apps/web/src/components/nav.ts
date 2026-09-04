import type { LucideIcon } from "lucide-react";
import {
  Home,
  BookOpen,
  Briefcase,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = "home" | "playbooks" | "work" | "insights" | "settings";

export interface NavConfig {
  id: NavItem;
  label: string;
  icon: LucideIcon;
  mobile: boolean;
}

export const NAV_ITEMS: NavConfig[] = [
  { id: "home", label: "Inicio", icon: Home, mobile: true },
  { id: "playbooks", label: "Playbooks", icon: BookOpen, mobile: true },
  { id: "work", label: "Trabajo", icon: Briefcase, mobile: true },
  { id: "insights", label: "Insights", icon: BarChart3, mobile: true },
  { id: "settings", label: "Ajustes", icon: Settings, mobile: false },
];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.mobile);
