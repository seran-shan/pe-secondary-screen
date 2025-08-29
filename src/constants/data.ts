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
    title: "Sponsors",
    url: "/workspace/sponsors",
    icon: "sponsors",
    shortcut: ["s", "s"],
    isActive: false,
    items: [],
  },
  {
    title: "Companies",
    url: "/workspace/companies",
    icon: "company",
    shortcut: ["c", "c"],
    isActive: false,
    items: [],
  },
  {
    title: "Watchlist",
    url: "/workspace/watchlist",
    icon: "watchlist",
    shortcut: ["w", "w"],
    isActive: false,
    items: [],
  },
  {
    title: "Alerts",
    url: "/workspace/alerts",
    icon: "warning",
    shortcut: ["a", "a"],
    isActive: false,
    items: [],
  },
  {
    title: "History",
    url: "/workspace/history",
    icon: "history",
    shortcut: ["h", "i"],
    isActive: false,
    items: [],
  },
  {
    title: "Settings",
    url: "/workspace/settings",
    icon: "settings",
    shortcut: ["g", "g"],
    isActive: false,
    items: [],
  },
];
