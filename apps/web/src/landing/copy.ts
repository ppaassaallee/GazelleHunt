export type BrandKey = "meikapen" | "recupero" | "gazellehunt";

export type ColumnGroup = {
  title: string;
  items: string[];
};

export type PlaybookCard = {
  title: string;
  body: string;
  href?: string;
};

export type LandingCopy = {
  brand: BrandKey;
  brandLabel: string;
  documentTitle: string;
  metaDescription: string;
  heroImage: string;
  heroEyebrow?: string;
  headline: string;
  subcopy: string;
  ctaLabel: string;
  ctaHref: string;
  trustLine: string;
  aboutHeading: string;
  aboutBody: string[];
  columns: ColumnGroup[];
  playbooksHeading?: string;
  playbooks?: PlaybookCard[];
  featureHeading?: string;
  featureBody?: string[];
  contactHeading: string;
  contactNoteLabel?: string;
  navMode: "solutions" | "platform";
};

export const GAZELLE_APP_URL = "https://gazellehunt.meikapen.com/";

export const MEIKAPEN_COPY: LandingCopy = {
  brand: "meikapen",
  brandLabel: "MEIKAPEN",
  documentTitle: "Meikapen — The operating layer for repeatable outcomes",
  metaDescription:
    "Meikapen turns operating playbooks into working systems — inside the tools, teams, and workflows already in place.",
  heroImage: "/marketing/landing/hero-meikapen.jpg",
  headline: "The operating layer for repeatable business outcomes",
  subcopy:
    "Meikapen turns operating playbooks into working systems — inside the tools, teams, and workflows already in place.",
  ctaLabel: "See the playbooks →",
  ctaHref: "#playbooks",
  trustLine: "Powering playbooks for collections, growth, and operational execution.",
  aboutHeading: "An operating platform for the work behind outcomes.",
  aboutBody: [
    "Meikapen sits above the systems already in place, coordinating the actions, decisions, and follow-through required to produce results.",
    "Instead of building workflows from scratch, teams activate playbooks designed for a specific outcome.",
  ],
  columns: [
    {
      title: "For",
      items: ["Operators", "Revenue teams", "Finance teams", "Founders"],
    },
    {
      title: "Across",
      items: ["Collections", "Prospecting", "Retention", "Follow-through"],
    },
    {
      title: "Through",
      items: ["Email", "WhatsApp", "Calling", "Payment flows"],
    },
    {
      title: "With",
      items: ["Playbooks", "Agents", "Rules", "Human oversight"],
    },
  ],
  playbooksHeading: "Playbooks already in motion",
  playbooks: [
    {
      title: "Recupero",
      body: "Revenue recovery and collections operations.",
      href: "/recupero",
    },
    {
      title: "Gazellehunt",
      body: "Pipeline creation and high-value outbound execution.",
      href: "/gazellehunt",
    },
    {
      title: "More playbooks",
      body: "Built on the same operating layer.",
    },
  ],
  contactHeading: "Show us the outcome you need to run.",
  navMode: "solutions",
};

export const RECUPERO_COPY: LandingCopy = {
  brand: "recupero",
  brandLabel: "RECUPERO",
  documentTitle: "Recupero — Recover more. Chase less.",
  metaDescription:
    "Recupero runs preventive reminders, overdue follow-up, payment journeys, and recovery actions across WhatsApp, email, voice, and payment links.",
  heroImage: "/marketing/landing/hero-recupero.jpg",
  heroEyebrow: "The operating playbook for collections and recovery",
  headline: "Recover more. Chase less.",
  subcopy:
    "Recupero runs preventive reminders, overdue follow-up, payment journeys, and recovery actions across WhatsApp, email, voice, and payment links.",
  ctaLabel: "See how Recupero works →",
  ctaHref: "#about",
  trustLine:
    "Preventive collections, overdue recovery, and payment orchestration in one system.",
  aboutHeading: "A recovery system built for real-world collections.",
  aboutBody: [
    "Recupero helps teams and operators manage the full path from preventive reminders to overdue recovery.",
    "It combines structured journeys, AI-assisted follow-up, payment actions, and human escalation — without forcing teams into a generic collections workflow builder.",
  ],
  columns: [
    {
      title: "For",
      items: ["Rent collections", "Invoices", "Service contracts", "Recurring payments"],
    },
    {
      title: "Across",
      items: [
        "Preventive reminders",
        "1–7 days overdue",
        "15–30 days overdue",
        "Recovery escalation",
      ],
    },
    {
      title: "Through",
      items: ["WhatsApp", "Email", "Voice", "Payment links"],
    },
    {
      title: "With",
      items: ["Rocío", "Templates", "Rules", "Escalations"],
    },
  ],
  featureHeading: "Meet Rocío",
  featureBody: [
    "Rocío is Recupero’s AI recovery operator.",
    "She follows up, records promises, sends payment options, and keeps work moving — always inside the rules you define.",
  ],
  contactHeading: "Show us how your recovery process works.",
  contactNoteLabel: "Volume / optional note",
  navMode: "platform",
};

export const GAZELLEHUNT_COPY: LandingCopy = {
  brand: "gazellehunt",
  brandLabel: "GAZELLEHUNT",
  documentTitle: "Gazellehunt — Hunt better accounts. Build better pipeline.",
  metaDescription:
    "Gazellehunt helps teams identify target accounts, coordinate outreach, and move high-value prospects into qualified pipeline.",
  heroImage: "/marketing/landing/hero-gazellehunt.jpg",
  headline: "Hunt better accounts. Build better pipeline.",
  subcopy:
    "Gazellehunt helps teams identify target accounts, coordinate outreach, and move high-value prospects into qualified pipeline through structured plays and disciplined follow-through.",
  ctaLabel: "See how Gazellehunt works →",
  ctaHref: "#about",
  trustLine: "Built for outbound execution, account focus, and pipeline generation.",
  aboutHeading: "A focused system for commercial hunting and follow-through.",
  aboutBody: [
    "Gazellehunt gives growth teams a structured way to target the right accounts, run coordinated outreach, and keep opportunities moving.",
    "It is designed for disciplined outbound execution — not generic CRM busywork.",
  ],
  columns: [
    {
      title: "For",
      items: ["B2B sales teams", "Founders", "Growth operators", "Commercial pods"],
    },
    {
      title: "Across",
      items: [
        "Target account selection",
        "Outreach sequencing",
        "Follow-up",
        "Opportunity progression",
      ],
    },
    {
      title: "Through",
      items: ["Email", "Calling", "Messaging", "Research workflows"],
    },
    {
      title: "With",
      items: ["Plays", "Signals", "Agents", "Human control"],
    },
  ],
  contactHeading: "Show us how your pipeline gets built.",
  navMode: "platform",
};

export function copyForPath(pathname: string): LandingCopy {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/recupero" || path === "/recupera") return RECUPERO_COPY;
  if (path === "/gazellehunt") return GAZELLEHUNT_COPY;
  return MEIKAPEN_COPY;
}
