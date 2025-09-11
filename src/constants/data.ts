import type { NavItem } from "@/types";

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: "home",
    shortcut: ["h", "h"],
    isActive: false,
    items: [],
  },
  {
    title: "Companies",
    url: "/companies",
    icon: "company",
    shortcut: ["c", "c"],
    isActive: false,
    items: [],
  },
  {
    title: "History",
    url: "/history",
    icon: "history",
    shortcut: ["h", "i"],
    isActive: false,
    items: [],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: "settings",
    shortcut: ["g", "g"],
    isActive: false,
    items: [],
  },
];
