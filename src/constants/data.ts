import type { NavItem } from "@/types";

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

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
    title: "Sponsors",
    url: "/sponsors",
    icon: "sponsors",
    shortcut: ["s", "s"],
    isActive: false,
    items: [],
  },
  {
    title: "Watchlist",
    url: "/watchlist",
    icon: "watchlist",
    shortcut: ["w", "w"],
    isActive: false,
    items: [],
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: "warning",
    shortcut: ["a", "a"],
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

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "+$1,999.00",
    image: "https://api.slingacademy.com/public/sample-users/1.png",
    initials: "OM",
  },
  {
    id: 2,
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "+$39.00",
    image: "https://api.slingacademy.com/public/sample-users/2.png",
    initials: "JL",
  },
  {
    id: 3,
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "+$299.00",
    image: "https://api.slingacademy.com/public/sample-users/3.png",
    initials: "IN",
  },
  {
    id: 4,
    name: "William Kim",
    email: "will@email.com",
    amount: "+$99.00",
    image: "https://api.slingacademy.com/public/sample-users/4.png",
    initials: "WK",
  },
  {
    id: 5,
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    amount: "+$39.00",
    image: "https://api.slingacademy.com/public/sample-users/5.png",
    initials: "SD",
  },
];
