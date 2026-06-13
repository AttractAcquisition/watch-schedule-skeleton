import type { PlanType } from "./types";

export const BRAND = {
  name: "Watch Schedule",
  domain: "watchschedule.com",
  app: "app.watchschedule.com",
  tagline: "Professional watch scheduling for superyacht teams.",
};

export interface PlanDef {
  id: PlanType;
  name: string;
  price: string;
  per: string;
  blurb: string;
  features: string[];
  typical: string;
  cta: string;
  popular?: boolean;
}

export const PLANS: PlanDef[] = [
  {
    id: "solo_watch",
    name: "Solo Watch",
    price: "£29",
    per: "/month",
    blurb: "For yachts with a single daily watchkeeper.",
    features: [
      "One watch rota",
      "Leave management",
      "Charter mode",
      "PDF export",
      "Fairness balancing",
    ],
    typical: "Typical vessels: 30m–50m",
    cta: "Continue with Solo Watch",
  },
  {
    id: "dual_watch",
    name: "Dual Watch",
    price: "£59",
    per: "/month",
    blurb: "For yachts running Watchkeeper + OOW, or Day/Night rotations.",
    features: [
      "Two simultaneous schedules",
      "Leave management",
      "Fairness balancing",
      "Schedule optimisation",
    ],
    typical: "Typical vessels: 50m–65m",
    cta: "Continue with Dual Watch",
    popular: true,
  },
  {
    id: "triple_watch",
    name: "Triple Watch",
    price: "£99",
    per: "/month",
    blurb: "For yachts operating Deck/OOW, Interior Watchkeeper, and Engineering OOW.",
    features: [
      "Three independent watch systems",
      "Department-specific rules",
      "Leave management",
      "Charter mode",
      "Advanced reporting",
    ],
    typical: "Typical vessels: 60m–120m+",
    cta: "Continue with Triple Watch",
  },
];

export const PLAN_LABEL: Record<PlanType, string> = {
  solo_watch: "Solo Watch",
  dual_watch: "Dual Watch",
  triple_watch: "Triple Watch",
};

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", description: "Rota command view" },
  { to: "/settings", label: "Settings", description: "Crew and rota controls" },
] as const;
