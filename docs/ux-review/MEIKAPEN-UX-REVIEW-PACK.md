# Meikapen — paquete de revisión UX para Claude

**Cómo usarlo:** sube este único archivo a Claude y pide un análisis UX/UI (jerarquía, claridad, conversión, minimalismo, mobile, accesibilidad, inconsistencias entre productos).

**Fecha del pack:** 2026-09-06

---

## 0. Contexto de producto (léelo primero)

Meikapen es la compañía. Tagline: **Instala. Activa. Sucede.**

Un **Playbook** no es un workflow builder genérico. Es un resultado de negocio empaquetado (outcome, datos, estados, canales, AI employee, métricas).

### Productos separados (NO mezclar en el análisis)

| Superficie | URL pública | Qué es | Qué NO es |
|---|---|---|---|
| **Meikapen** | `meikapen.com/` | Holding / plataforma de playbooks | Un CRM |
| **Recupero** | `meikapen.com/recupero` | Playbook de **cobranza**. AI Employee: **Rocío**. Entrada de pago/seguimiento. | Gazelle Hunt. No es hiring. |
| **Gazelle Hunt** | `meikapen.com/gazellehunt` → app en `/app` | Playbook de **contratación / assessments** (listas, tests, envíos, journeys de candidatos). | Recupero. No es cobranza. |
| **Flow builder Recupero** | App shell `/ryvo/?open=recupera` → Journey Studio | Diseña flujos y plantillas de cobro (WhatsApp/email/SMS) por etapa de atraso. | El journey designer de Gazelle (mismo lenguaje visual, producto distinto). |
| **Flow / Journeys Gazelle** | Gazelle app → Journeys | Diseña recordatorios de assessment a candidatos. | Recupero. |

**Regla crítica para el reviewer:** evalúa cada superficie por su propio job-to-be-done. No critiques que Recupero no tenga “candidate lists”, ni que Gazelle no tenga “Rocío”. Son playbooks hermanos sobre runtime compartido, UIs de producto **separadas**.

---

## 1. Qué hace cada herramienta (glosario)

### Landing Recupero
Página de marketing/conversión. Explica el outcome (“Que te paguen”), etapas del cobro, Rocío, precios mensuales, y manda a crear cuenta / login en `meikapen.com` con `playbook=recupera`.

### Landing Gazelle Hunt
Página de marketing para el playbook de hiring/outbound hunting. Auth hacia Gazelle. Más corta hoy que Recupero (menos secciones de pricing/journey).

### Landing Meikapen (referencia)
Home de la compañía; apunta a los playbooks. Incluida para contraste de marca, no es el foco principal.

### Flow builder / Journey Studio (Recupero)
Herramienta **in-app** para operadores: crear/editar flujos de contacto por etapa (PRE_DUE, DUE, DPD…), canales (WhatsApp, email, SMS, API), plantillas aprobadas, activar/pausar, y ver el canvas tipo nodos (mismo lenguaje visual que Gazelle).

### Journeys (Gazelle Hunt)
Herramienta **in-app** equivalente en contratación: diseñar secuencias de follow-up para que el candidato complete el assessment. Funnel, enroll de listas, plantillas Brevo/Infobip.

### Pricing (Recupero)
Planes **mensuales** (no por caso): Probar Q0, Recupero Q30/mes, Recupero+ Q49/mes (con Rocío). Upsell Portafolio/Empresa.

---

## 2. Brief de análisis pedido a Claude

Por favor analiza **por separado** y luego compara solo a nivel de sistema de diseño:

1. **Landing Recupero** — conversión, claridad de pricing mensual, jerarquía, CTAs, trust, mobile.
2. **Landing Gazelle Hunt** — claridad del value prop, profundidad vs Recupero, auth entry.
3. **Flow builder Recupero (Journey Studio)** — densidad, affordances del canvas, labels vs jerga interna, estados vacíos, mobile/desktop.
4. Si puedes: coherencia visual Meikapen ↔ Recupero ↔ Gazelle sin pedir unificar productos.

Entrega:
- Hallazgos priorizados (P0/P1/P2)
- Qué mejorar en copy/UI sin convertir nada en CRM/workflow builder genérico
- Ideas concretas de wireframe en texto

---

## 3. Archivos incluidos (código fuente)

A continuación el código relevante concatenado. Cada bloque empieza con `===== FILE: path =====`.



===== FILE: apps/web/src/landing/copy.ts =====
```
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

export type NavLink = {
  href: string;
  label: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  priceNote?: string;
  badge?: string;
  featured?: boolean;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
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
  heroSecondaryLine?: string;
  trustLine: string;
  aboutHeading: string;
  aboutBody: string[];
  columns: ColumnGroup[];
  playbooksHeading?: string;
  playbooks?: PlaybookCard[];
  featureHeading?: string;
  featureBody?: string[];
  featurePoints?: string[];
  featureCtaLabel?: string;
  featureCtaHref?: string;
  contactHeading: string;
  contactNoteLabel?: string;
  navMode: "solutions" | "platform";
  navLinks?: NavLink[];
  howHeading?: string;
  howSteps?: { title: string; body: string }[];
  journeyHeading?: string;
  journeyBody?: string;
  journeyStages?: { label: string; title: string }[];
  useCasesHeading?: string;
  useCasesSupporting?: string;
  useCases?: { title: string; body: string }[];
  pricingHeading?: string;
  pricingPlans?: PricingPlan[];
  pricingMonthlyHeading?: string;
  pricingMonthly?: { title: string; price: string }[];
  pricingMonthlyCtaLabel?: string;
  pricingMonthlyCtaHref?: string;
  portfolioHeading?: string;
  portfolioBody?: string;
  portfolioColumns?: { title: string; body: string }[];
  portfolioCtaLabel?: string;
  portfolioCtaHref?: string;
  splitStartHeading?: string;
  splitStartLine?: string;
  splitStartCtaLabel?: string;
  splitStartHref?: string;
  splitContactHeading?: string;
  splitContactLine?: string;
  footerBrand?: string;
  footerTagline?: string;
  footerLinks?: NavLink[];
  formLocale?: "en" | "es";
  authHeading?: string;
  authBody?: string;
  authLoginLabel?: string;
  authLoginHref?: string;
  authSignupLabel?: string;
  authSignupHref?: string;
};

/** Public entry is meikapen.com landings; auth/apps stay on the same host for __Host- cookies. */
export const MEIKAPEN_ORIGIN = "https://meikapen.com";
export const RECUPERO_LOGIN_URL = `${MEIKAPEN_ORIGIN}/?auth=login&playbook=recupera&returnTo=${encodeURIComponent("/ryvo/?open=recupera")}`;
export const RECUPERO_SIGNUP_URL = `${MEIKAPEN_ORIGIN}/?auth=signup&playbook=recupera&returnTo=${encodeURIComponent("/ryvo/?open=recupera&action=studio")}`;
export const RECUPERO_START_URL = RECUPERO_SIGNUP_URL;
export const RECUPERO_APP_URL = `${MEIKAPEN_ORIGIN}/ryvo/?open=recupera`;
export const GAZELLE_LOGIN_URL = `${MEIKAPEN_ORIGIN}/?auth=login&playbook=gazellehunt&returnTo=${encodeURIComponent("/ryvo/?open=gazellehunt")}`;
export const GAZELLE_SIGNUP_URL = `${MEIKAPEN_ORIGIN}/?auth=signup&playbook=gazellehunt&returnTo=${encodeURIComponent("/ryvo/?open=gazellehunt")}`;
export const GAZELLE_APP_URL = `${MEIKAPEN_ORIGIN}/ryvo/?open=gazellehunt`;
export const GAZELLE_START_URL = GAZELLE_SIGNUP_URL;

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
  documentTitle: "Recupero — Que te paguen. Sin perseguir a nadie.",
  metaDescription:
    "Recupero recuerda, da seguimiento y facilita el pago por WhatsApp, email y llamada. Desde Q30 al mes.",
  heroImage: "/marketing/landing/hero-recupero.jpg",
  heroEyebrow: "RECUPERO · A MEIKAPEN PLAYBOOK",
  headline: "Que te paguen.\nSin perseguir a nadie.",
  subcopy:
    "Recupero recuerda, da seguimiento y facilita el pago por WhatsApp, email y llamada. Tú nos dices quién debe pagar. Nosotros hacemos el resto.",
  ctaLabel: "Empezar ahora →",
  ctaHref: RECUPERO_START_URL,
  heroSecondaryLine: "Desde Q30 / mes · cancela cuando quieras",
  trustLine: "Recordar → Seguir → Rocío → Escalar",
  aboutHeading: "Un sistema de recuperación construido para trabajo real.",
  aboutBody: [
    "Recupero ayuda a operadores, propietarios y equipos a gestionar el camino completo desde el recordatorio preventivo hasta la recuperación.",
    "Combina etapas claras, seguimiento estructurado, opciones de pago y escalamiento humano — sin obligarte a usar un software complejo.",
  ],
  columns: [
    {
      title: "Para",
      items: ["Rentas", "Facturas", "Contratos", "Cobros recurrentes"],
    },
    {
      title: "Etapas",
      items: ["Preventivo", "1–7 días", "15–30 días", "Recuperación"],
    },
    {
      title: "Canales",
      items: ["WhatsApp", "Email", "Llamada", "Link de pago"],
    },
    {
      title: "Con",
      items: ["Rocío", "Plantillas", "Reglas", "Escalamiento"],
    },
  ],
  howHeading: "Tú no deberías tener que cobrar.",
  howSteps: [
    {
      title: "Dinos quién debe pagar.",
      body: "Nombre, celular, correo, monto y fecha.",
    },
    {
      title: "Recupero hace el seguimiento.",
      body: "Recordatorios, seguimiento y opciones de pago.",
    },
    {
      title: "Tú ves qué pasó.",
      body: "Pagó, prometió pagar, necesita ayuda o requiere escalamiento.",
    },
  ],
  journeyHeading: "Desde antes del atraso hasta la recuperación.",
  journeyBody: "Recupero activa una secuencia corta y clara según el momento del cobro.",
  journeyStages: [
    { label: "−5 días", title: "Recordar" },
    { label: "Día de pago", title: "Facilitar" },
    { label: "+5 días", title: "Seguir" },
    { label: "+15 días", title: "Rocío" },
    { label: "+30 días", title: "Escalar" },
  ],
  useCasesHeading: "Empieza con lo que hoy estás persiguiendo.",
  useCasesSupporting:
    "Recupero funciona sobre cualquier obligación con un pagador, un monto y una fecha.",
  useCases: [
    {
      title: "Rentas",
      body: "Para propietarios que no quieren cobrar todos los meses.",
    },
    {
      title: "Facturas",
      body: "Para negocios que venden y luego tienen que perseguir el pago.",
    },
    {
      title: "Servicios",
      body: "Para contratos, cuotas y cobros recurrentes.",
    },
  ],
  pricingHeading: "Planes mensuales.\nSin contrato. Sin perseguir a nadie.",
  pricingPlans: [
    {
      name: "Probar",
      price: "Q0",
      priceNote: "/ mes · para empezar",
      features: [
        "1 recordatorio al mes",
        "1 pagador activo",
        "portal del pagador",
        "confirmación “ya pagué”",
        "ideal para validar el flujo",
      ],
      ctaLabel: "Empezar gratis →",
      ctaHref: RECUPERO_START_URL,
    },
    {
      name: "Recupero",
      price: "Q30",
      priceNote: "/ mes",
      badge: "Más elegido",
      featured: true,
      features: [
        "seguimientos WhatsApp + email",
        "pagadores ilimitados*",
        "portal del pagador",
        "confirmación de pago",
        "historial simple",
        "cancela cuando quieras",
      ],
      ctaLabel: "Activar Recupero →",
      ctaHref: RECUPERO_START_URL,
    },
    {
      name: "Recupero+",
      price: "Q49",
      priceNote: "/ mes · con Rocío",
      features: [
        "todo lo de Recupero",
        "Rocío (seguimiento activo)",
        "promesa de pago",
        "seguimiento de promesa",
        "escalamiento humano",
        "más contactos por caso",
      ],
      ctaLabel: "Activar Recupero+ →",
      ctaHref: RECUPERO_START_URL,
    },
  ],
  pricingMonthlyHeading: "¿Operas cartera o volumen cada mes?",
  pricingMonthly: [
    { title: "Portafolio", price: "desde Q199 / mes" },
    { title: "Empresa", price: "a medida" },
  ],
  pricingMonthlyCtaLabel: "Hablar de volumen →",
  pricingMonthlyCtaHref: "#contacto",
  featureHeading: "Cuando un mensaje no basta, entra Rocío.",
  featureBody: [
    "Rocío es la operadora de recuperación de Recupero.",
    "Da seguimiento, registra promesas, reenvía opciones de pago y mantiene el caso en movimiento dentro de las reglas que tú definas.",
  ],
  featurePoints: ["Llama", "Escucha", "Da seguimiento"],
  featureCtaLabel: "Ver cómo trabaja Rocío →",
  featureCtaHref: "#etapas",
  portfolioHeading: "¿Tienes cartera o volumen?",
  portfolioBody:
    "Recupero también puede operar cobros recurrentes y carteras más grandes con flujos automáticos, Rocío, reglas, supervisión y escalamiento.",
  portfolioColumns: [
    {
      title: "Automático",
      body: "Cobros mensuales sin perseguir a nadie.",
    },
    {
      title: "Portafolio",
      body: "Varias cuentas en una sola vista.",
    },
    {
      title: "Empresa",
      body: "Más volumen, más control, más seguimiento.",
    },
  ],
  portfolioCtaLabel: "Hablemos de tu operación →",
  portfolioCtaHref: "#contacto",
  splitStartHeading: "¿Hay alguien a quien no quieres volver a cobrar?",
  splitStartLine: "Empieza desde Q30 al mes.",
  splitStartCtaLabel: "Recuperar un pago →",
  splitStartHref: RECUPERO_START_URL,
  splitContactHeading: "¿Tienes cartera, empresa o volumen?",
  splitContactLine: "Hablemos de tu operación de cobro.",
  contactHeading: "¿Tienes cartera, empresa o volumen?",
  contactNoteLabel: "Nota opcional / volumen",
  navMode: "platform",
  navLinks: [
    { href: "#como", label: "Cómo" },
    { href: "#precios", label: "Precios" },
    { href: "#cuenta", label: "Cuenta" },
  ],
  footerBrand: "Recupero",
  footerTagline: "A Meikapen Playbook",
  footerLinks: [
    { href: "#cuenta", label: "Cuenta" },
    { href: "/", label: "Meikapen" },
  ],
  formLocale: "es",
  authHeading: "Entra a Recupero.",
  authBody: "Crea una cuenta para empezar, o inicia sesión si ya tienes acceso.",
  authLoginLabel: "Iniciar sesión →",
  authLoginHref: RECUPERO_LOGIN_URL,
  authSignupLabel: "Crear cuenta →",
  authSignupHref: RECUPERO_SIGNUP_URL,
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
  navLinks: [
    { href: "#about", label: "About" },
    { href: "#cuenta", label: "Account" },
    { href: "#contact", label: "Contact" },
  ],
  authHeading: "Enter Gazellehunt.",
  authBody: "Sign in to run outbound plays, or create an account to get started.",
  authLoginLabel: "Sign in →",
  authLoginHref: GAZELLE_LOGIN_URL,
  authSignupLabel: "Create account →",
  authSignupHref: GAZELLE_SIGNUP_URL,
};

export function copyForPath(pathname: string): LandingCopy {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/recupero" || path === "/recupera") return RECUPERO_COPY;
  if (path === "/gazellehunt") return GAZELLEHUNT_COPY;
  return MEIKAPEN_COPY;
}

```


===== FILE: apps/web/src/landing/main.tsx =====
```
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { LandingShell } from "@/landing/components/LandingShell";
import { copyForPath, type LandingCopy } from "@/landing/copy";
import "@/landing/landing.css";

function LandingApp() {
  const [copy, setCopy] = useState<LandingCopy>(() => copyForPath(window.location.pathname));

  useEffect(() => {
    document.title = copy.documentTitle;
    document.documentElement.lang = copy.formLocale === "es" || copy.brand === "recupero" ? "es" : "en";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", copy.metaDescription);
    else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = copy.metaDescription;
      document.head.appendChild(meta);
    }
  }, [copy]);

  useEffect(() => {
    function sync() {
      setCopy(copyForPath(window.location.pathname));
    }
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return <LandingShell copy={copy} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LandingApp />
  </StrictMode>,
);

```


===== FILE: apps/web/src/landing/landing.css =====
```
@import "tailwindcss";

:root {
  --landing-fg: #f5f5f2;
  --landing-fg-muted: rgba(245, 245, 242, 0.72);
  --landing-fg-soft: rgba(245, 245, 242, 0.55);
  --landing-border: rgba(255, 255, 255, 0.55);
  --landing-overlay: rgba(8, 8, 8, 0.42);
  --landing-surface: #0c0c0c;
  --landing-ink: #121212;
  --landing-ink-muted: #5c5c5a;
  --landing-rule: rgba(18, 18, 18, 0.12);
  --landing-font: "Instrument Sans", "Segoe UI", sans-serif;
  --landing-ease: 180ms ease;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}

body {
  margin: 0;
  min-height: 100dvh;
  font-family: var(--landing-font);
  color: var(--landing-ink);
  background: #fff;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
}

button,
input,
textarea {
  font: inherit;
}

#root {
  min-height: 100dvh;
}

```


===== FILE: apps/web/src/landing/components/LandingShell.tsx =====
```
import { AuthEntry } from "@/landing/components/AuthEntry";
import { ContactBlock } from "@/landing/components/ContactBlock";
import { FooterMinimal } from "@/landing/components/FooterMinimal";
import { FourColumnList } from "@/landing/components/FourColumnList";
import { HeroSection } from "@/landing/components/HeroSection";
import { HowItWorks } from "@/landing/components/HowItWorks";
import { JourneyStages } from "@/landing/components/JourneyStages";
import { PlaybookCards } from "@/landing/components/PlaybookCards";
import { PortfolioBlock } from "@/landing/components/PortfolioBlock";
import { PricingPlans } from "@/landing/components/PricingPlans";
import { RocioBlock } from "@/landing/components/RocioBlock";
import { SectionIntro } from "@/landing/components/SectionIntro";
import { SplitCta } from "@/landing/components/SplitCta";
import { TopNav } from "@/landing/components/TopNav";
import { UseCases } from "@/landing/components/UseCases";
import type { LandingCopy } from "@/landing/copy";

type Props = {
  copy: LandingCopy;
};

function authProps(copy: LandingCopy) {
  if (!copy.authLoginHref || !copy.authSignupHref) return undefined;
  return {
    loginLabel: copy.authLoginLabel || "Sign in",
    loginHref: copy.authLoginHref,
    signupLabel: copy.authSignupLabel || "Sign up",
    signupHref: copy.authSignupHref,
  };
}

export function LandingShell({ copy }: Props) {
  const brandHome =
    copy.brand === "meikapen" ? "/" : copy.brand === "recupero" ? "/recupero" : "/gazellehunt";
  const auth = authProps(copy);

  if (copy.brand === "recupero") {
    return (
      <div className="bg-white text-[var(--landing-ink)]">
        <div className="relative">
          <TopNav
            brandLabel={copy.brandLabel}
            brandHomeHref={brandHome}
            links={copy.navLinks}
            auth={auth}
          />
          <HeroSection
            eyebrow={copy.heroEyebrow}
            headline={copy.headline}
            subcopy={copy.subcopy}
            ctaLabel={copy.ctaLabel}
            ctaHref={copy.ctaHref}
            secondaryLine={copy.heroSecondaryLine}
            trustLine={copy.trustLine}
            imageSrc={copy.heroImage}
            imageAlt=""
          />
        </div>

        {copy.howHeading && copy.howSteps ? (
          <HowItWorks heading={copy.howHeading} steps={copy.howSteps} />
        ) : null}

        {copy.journeyHeading && copy.journeyBody && copy.journeyStages ? (
          <JourneyStages
            heading={copy.journeyHeading}
            body={copy.journeyBody}
            stages={copy.journeyStages}
          />
        ) : null}

        {copy.useCasesHeading && copy.useCasesSupporting && copy.useCases ? (
          <UseCases
            heading={copy.useCasesHeading}
            supporting={copy.useCasesSupporting}
            cases={copy.useCases}
          />
        ) : null}

        {copy.pricingHeading &&
        copy.pricingPlans &&
        copy.pricingMonthlyHeading &&
        copy.pricingMonthly &&
        copy.pricingMonthlyCtaLabel &&
        copy.pricingMonthlyCtaHref ? (
          <PricingPlans
            heading={copy.pricingHeading}
            plans={copy.pricingPlans}
            monthlyHeading={copy.pricingMonthlyHeading}
            monthly={copy.pricingMonthly}
            monthlyCtaLabel={copy.pricingMonthlyCtaLabel}
            monthlyCtaHref={copy.pricingMonthlyCtaHref}
          />
        ) : null}

        <SectionIntro id="about" heading={copy.aboutHeading} body={copy.aboutBody} />
        <FourColumnList groups={copy.columns} />

        {copy.featureHeading && copy.featureBody && copy.featurePoints ? (
          <RocioBlock
            heading={copy.featureHeading}
            body={copy.featureBody}
            points={copy.featurePoints}
            ctaLabel={copy.featureCtaLabel || "Ver cómo trabaja Rocío →"}
            ctaHref={copy.featureCtaHref || "#etapas"}
          />
        ) : null}

        {copy.portfolioHeading &&
        copy.portfolioBody &&
        copy.portfolioColumns &&
        copy.portfolioCtaLabel &&
        copy.portfolioCtaHref ? (
          <PortfolioBlock
            heading={copy.portfolioHeading}
            body={copy.portfolioBody}
            columns={copy.portfolioColumns}
            ctaLabel={copy.portfolioCtaLabel}
            ctaHref={copy.portfolioCtaHref}
          />
        ) : null}

        {copy.authHeading && copy.authBody && auth ? (
          <AuthEntry
            heading={copy.authHeading}
            body={copy.authBody}
            loginLabel={auth.loginLabel}
            loginHref={auth.loginHref}
            signupLabel={auth.signupLabel}
            signupHref={auth.signupHref}
          />
        ) : null}

        {copy.splitStartHeading &&
        copy.splitStartLine &&
        copy.splitStartCtaLabel &&
        copy.splitStartHref &&
        copy.splitContactHeading &&
        copy.splitContactLine ? (
          <SplitCta
            startHeading={copy.splitStartHeading}
            startLine={copy.splitStartLine}
            startCtaLabel={copy.splitStartCtaLabel}
            startHref={copy.splitStartHref}
            contactHeading={copy.splitContactHeading}
            contactLine={copy.splitContactLine}
            noteLabel={copy.contactNoteLabel || "Nota opcional / volumen"}
            source={copy.brand}
            locale={copy.formLocale || "es"}
          />
        ) : null}

        <FooterMinimal
          brand={copy.footerBrand}
          tagline={copy.footerTagline}
          links={copy.footerLinks}
        />
      </div>
    );
  }

  return (
    <div className="bg-white text-[var(--landing-ink)]">
      <div className="relative">
        <TopNav
          brandLabel={copy.brandLabel}
          brandHomeHref={brandHome}
          mode={copy.navMode}
          links={copy.navLinks}
          auth={auth}
        />
        <HeroSection
          eyebrow={copy.heroEyebrow}
          headline={copy.headline}
          subcopy={copy.subcopy}
          ctaLabel={copy.ctaLabel}
          ctaHref={copy.ctaHref}
          trustLine={copy.trustLine}
          imageSrc={copy.heroImage}
          imageAlt=""
        />
      </div>

      <SectionIntro id="about" heading={copy.aboutHeading} body={copy.aboutBody} />
      <FourColumnList groups={copy.columns} />

      {copy.playbooksHeading && copy.playbooks ? (
        <PlaybookCards heading={copy.playbooksHeading} cards={copy.playbooks} />
      ) : null}

      {copy.featureHeading && copy.featureBody ? (
        <SectionIntro heading={copy.featureHeading} body={copy.featureBody} />
      ) : null}

      {copy.brand === "gazellehunt" && copy.authHeading && copy.authBody && auth ? (
        <AuthEntry
          heading={copy.authHeading}
          body={copy.authBody}
          loginLabel={auth.loginLabel}
          loginHref={auth.loginHref}
          signupLabel={auth.signupLabel}
          signupHref={auth.signupHref}
        />
      ) : null}

      <ContactBlock
        heading={copy.contactHeading}
        noteLabel={copy.contactNoteLabel}
        source={copy.brand}
      />
      <FooterMinimal />
    </div>
  );
}

```


===== FILE: apps/web/src/landing/components/PricingPlans.tsx =====
```
import type { PricingPlan } from "@/landing/copy";

type Monthly = {
  title: string;
  price: string;
};

type Props = {
  heading: string;
  plans: PricingPlan[];
  monthlyHeading: string;
  monthly: Monthly[];
  monthlyCtaLabel: string;
  monthlyCtaHref: string;
};

export function PricingPlans({
  heading,
  plans,
  monthlyHeading,
  monthly,
  monthlyCtaLabel,
  monthlyCtaHref,
}: Props) {
  return (
    <section
      id="precios"
      className="scroll-mt-24 bg-[var(--landing-surface)] px-5 py-24 text-[var(--landing-fg)] md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] tracking-[0.18em] text-[var(--landing-fg-soft)] uppercase">
          Precios mensuales
        </p>
        <h2 className="mt-4 max-w-2xl whitespace-pre-line text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--landing-fg-muted)]">
          Elige el plan que se ajusta a tu operación. Pagas mes a mes. Sin permanencia.
        </p>

        <ul className="mt-14 grid gap-5 md:grid-cols-3 md:gap-6">
          {plans.map((plan) => {
            const featured = Boolean(plan.featured);
            return (
              <li
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 md:p-8 ${
                  featured
                    ? "border-[var(--landing-fg)] bg-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "border-[rgba(255,255,255,0.16)] bg-transparent"
                }`}
              >
                {plan.badge ? (
                  <span className="absolute -top-3 left-7 rounded-full bg-[var(--landing-fg)] px-3 py-1 text-[10px] font-medium tracking-[0.12em] text-[var(--landing-surface)] uppercase">
                    {plan.badge}
                  </span>
                ) : null}
                <p className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                  {plan.name}
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <p className="text-[clamp(2.25rem,4.5vw,3.25rem)] leading-none font-medium tracking-[-0.05em]">
                    {plan.price}
                  </p>
                </div>
                {plan.priceNote ? (
                  <p className="mt-2 text-[13px] text-[var(--landing-fg-muted)]">{plan.priceNote}</p>
                ) : (
                  <p className="mt-2 text-[13px] text-transparent select-none">.</p>
                )}
                <ul className="mt-8 flex-1 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-[14px] leading-snug text-[var(--landing-fg-muted)]"
                    >
                      <span
                        aria-hidden
                        className={`mt-[0.35em] h-1.5 w-1.5 shrink-0 rounded-full ${
                          featured ? "bg-[var(--landing-fg)]" : "bg-[var(--landing-fg-soft)]"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref}
                  className={`mt-10 inline-flex items-center justify-center rounded-full px-5 py-3 text-[13px] tracking-[0.04em] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-85 ${
                    featured
                      ? "bg-[var(--landing-fg)] font-medium text-[var(--landing-surface)]"
                      : "border border-[rgba(255,255,255,0.28)] text-[var(--landing-fg)]"
                  }`}
                >
                  {plan.ctaLabel}
                </a>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-[12px] text-[var(--landing-fg-soft)]">
          * Dentro de uso razonable de operación. Cartera grande → Portafolio o Empresa.
        </p>

        <div className="mt-20 rounded-2xl border border-[rgba(255,255,255,0.16)] px-7 py-10 md:px-10">
          <h3 className="text-[20px] font-medium tracking-[-0.02em]">{monthlyHeading}</h3>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2">
            {monthly.map((item) => (
              <li key={item.title} className="border-t border-[rgba(255,255,255,0.14)] pt-5">
                <p className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                  {item.title}
                </p>
                <p className="mt-3 text-[18px] font-medium">{item.price}</p>
              </li>
            ))}
          </ul>
          <a
            href={monthlyCtaHref}
            className="mt-10 inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-fg)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
          >
            {monthlyCtaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/HeroSection.tsx =====
```
type Props = {
  eyebrow?: string;
  headline: string;
  subcopy: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLine?: string;
  trustLine: string;
  imageSrc: string;
  imageAlt: string;
};

export function HeroSection({
  eyebrow,
  headline,
  subcopy,
  ctaLabel,
  ctaHref,
  secondaryLine,
  trustLine,
  imageSrc,
  imageAlt,
}: Props) {
  return (
    <section className="relative min-h-dvh w-full overflow-hidden text-[var(--landing-fg)]">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[rgba(8,8,8,0.48)]" aria-hidden />
      <div className="relative z-10 flex min-h-dvh flex-col justify-end px-5 pb-10 pt-28 md:px-10 md:pb-12">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-4 text-[12px] tracking-[0.14em] text-[var(--landing-fg-soft)] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="whitespace-pre-line text-[clamp(2.4rem,6vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.035em]">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--landing-fg-muted)] md:text-[16px]">
            {subcopy}
          </p>
          <a
            href={ctaHref}
            className="mt-8 inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-fg)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-75"
          >
            {ctaLabel}
          </a>
          {secondaryLine ? (
            <p className="mt-4 text-[13px] tracking-[0.02em] text-[var(--landing-fg-soft)]">
              {secondaryLine}
            </p>
          ) : null}
        </div>
        <p className="mt-16 max-w-2xl text-[12px] tracking-[0.04em] text-[var(--landing-fg-soft)] md:mt-20">
          {trustLine}
        </p>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/HowItWorks.tsx =====
```
type Step = {
  title: string;
  body: string;
};

type Props = {
  heading: string;
  steps: Step[];
};

export function HowItWorks({ heading, steps }: Props) {
  return (
    <section id="como" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {steps.map((step, index) => (
            <li key={step.title}>
              <p className="text-[11px] tracking-[0.18em] text-[var(--landing-ink-muted)] uppercase">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-[20px] leading-snug font-medium tracking-[-0.02em]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/JourneyStages.tsx =====
```
type Stage = {
  label: string;
  title: string;
};

type Props = {
  heading: string;
  body: string;
  stages: Stage[];
};

export function JourneyStages({ heading, body, stages }: Props) {
  return (
    <section id="etapas" className="scroll-mt-24 border-y border-[var(--landing-rule)] px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--landing-ink-muted)]">
          {body}
        </p>
        <ol className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {stages.map((stage) => (
            <li key={stage.label}>
              <p className="text-[11px] tracking-[0.16em] text-[var(--landing-ink-muted)] uppercase">
                {stage.label}
              </p>
              <p className="mt-3 text-[18px] font-medium tracking-[-0.02em]">{stage.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/UseCases.tsx =====
```
type UseCase = {
  title: string;
  body: string;
};

type Props = {
  heading: string;
  supporting: string;
  cases: UseCase[];
};

export function UseCases({ heading, supporting, cases }: Props) {
  return (
    <section id="casos" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <ul className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {cases.map((item) => (
            <li key={item.title}>
              <h3 className="text-[18px] font-medium tracking-[-0.02em]">{item.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-16 max-w-2xl text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
          {supporting}
        </p>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/RocioBlock.tsx =====
```
type Props = {
  heading: string;
  body: string[];
  points: string[];
  ctaLabel: string;
  ctaHref: string;
};

export function RocioBlock({ heading, body, points, ctaLabel, ctaHref }: Props) {
  return (
    <section id="rocio" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-20">
        <div>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
            {heading}
          </h2>
          <div className="mt-8 space-y-5">
            {body.map((paragraph) => (
              <p key={paragraph} className="max-w-xl text-[15px] leading-relaxed text-[var(--landing-ink-muted)] md:text-[16px]">
                {paragraph}
              </p>
            ))}
          </div>
          <a
            href={ctaHref}
            className="mt-10 inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-ink)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
          >
            {ctaLabel}
          </a>
        </div>
        <ul className="flex flex-col justify-end gap-6 border-t border-[var(--landing-rule)] pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10">
          {points.map((point) => (
            <li key={point} className="text-[22px] font-medium tracking-[-0.02em]">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/PortfolioBlock.tsx =====
```
type Column = {
  title: string;
  body: string;
};

type Props = {
  heading: string;
  body: string;
  columns: Column[];
  ctaLabel: string;
  ctaHref: string;
};

export function PortfolioBlock({ heading, body, columns, ctaLabel, ctaHref }: Props) {
  return (
    <section id="cartera" className="scroll-mt-24 border-y border-[var(--landing-rule)] px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--landing-ink-muted)]">
          {body}
        </p>
        <ul className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {columns.map((column) => (
            <li key={column.title}>
              <h3 className="text-[18px] font-medium tracking-[-0.02em]">{column.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                {column.body}
              </p>
            </li>
          ))}
        </ul>
        <a
          href={ctaHref}
          className="mt-14 inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-ink)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/SplitCta.tsx =====
```
import { useState } from "react";

type Props = {
  startHeading: string;
  startLine: string;
  startCtaLabel: string;
  startHref: string;
  contactHeading: string;
  contactLine: string;
  noteLabel: string;
  source: string;
  locale?: "en" | "es";
};

export function SplitCta({
  startHeading,
  startLine,
  startCtaLabel,
  startHref,
  contactHeading,
  contactLine,
  noteLabel,
  source,
  locale = "es",
}: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const labels =
    locale === "es"
      ? { name: "Nombre", company: "Empresa", email: "Email", send: "Enviar →", sending: "Enviando…", received: "Recibido.", fail: "No se pudo enviar." }
      : { name: "Name", company: "Company", email: "Email", send: "Send →", sending: "Sending…", received: "Received.", fail: "Could not send." };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/marketing/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || ""),
          company: String(data.get("company") || ""),
          email: String(data.get("email") || ""),
          note: String(data.get("note") || ""),
          source,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || labels.fail);
      }
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : labels.fail);
    }
  }

  return (
    <section id="contacto" className="scroll-mt-24 bg-[var(--landing-surface)] px-5 py-24 text-[var(--landing-fg)] md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2 md:gap-20">
        <div>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
            {startHeading}
          </h2>
          <p className="mt-5 text-[15px] text-[var(--landing-fg-muted)]">{startLine}</p>
          <a
            href={startHref}
            className="mt-10 inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-fg)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
          >
            {startCtaLabel}
          </a>
        </div>

        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.15] font-medium tracking-[-0.03em]">
            {contactHeading}
          </h2>
          <p className="mt-4 text-[14px] text-[var(--landing-fg-muted)]">{contactLine}</p>
          <form onSubmit={(event) => void onSubmit(event)} className="mt-8 space-y-5">
            {(
              [
                ["name", labels.name, "text"],
                ["company", labels.company, "text"],
                ["email", labels.email, "email"],
              ] as const
            ).map(([id, label, type]) => (
              <label key={id} className="block">
                <span className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                  {label}
                </span>
                <input
                  name={id}
                  type={type}
                  required
                  className="mt-2 w-full border-0 border-b border-[var(--landing-border)] bg-transparent px-0 py-3 text-[15px] text-[var(--landing-fg)] outline-none"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                {noteLabel}
              </span>
              <textarea
                name="note"
                rows={3}
                className="mt-2 w-full resize-none border-0 border-b border-[var(--landing-border)] bg-transparent px-0 py-3 text-[15px] text-[var(--landing-fg)] outline-none"
              />
            </label>
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="submit"
                disabled={status === "sending"}
                className="border-0 bg-transparent p-0 text-[14px] tracking-[0.04em] text-[var(--landing-fg)] transition-opacity duration-[var(--landing-ease)] hover:opacity-70 disabled:opacity-40"
              >
                {status === "sending" ? labels.sending : labels.send}
              </button>
              {status === "sent" ? (
                <p className="text-[13px] text-[var(--landing-fg-muted)]" role="status">
                  {labels.received}
                </p>
              ) : null}
              {status === "error" ? (
                <p className="text-[13px] text-[#ffb4a8]" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/AuthEntry.tsx =====
```
type Props = {
  heading: string;
  body: string;
  loginLabel: string;
  loginHref: string;
  signupLabel: string;
  signupHref: string;
};

export function AuthEntry({
  heading,
  body,
  loginLabel,
  loginHref,
  signupLabel,
  signupHref,
}: Props) {
  return (
    <section id="cuenta" className="scroll-mt-24 border-y border-[var(--landing-rule)] px-5 py-24 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:items-end md:gap-16">
        <div>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
            {heading}
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--landing-ink-muted)]">
            {body}
          </p>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-end md:flex-col md:items-start">
          <a
            href={signupHref}
            className="inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-ink)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
          >
            {signupLabel}
          </a>
          <a
            href={loginHref}
            className="inline-flex text-[14px] tracking-[0.04em] text-[var(--landing-ink-muted)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
          >
            {loginLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/TopNav.tsx =====
```
import { BrandMark } from "@/landing/components/BrandMark";
import type { NavLink } from "@/landing/copy";

type AuthLinks = {
  loginLabel: string;
  loginHref: string;
  signupLabel: string;
  signupHref: string;
};

type Props = {
  brandLabel: string;
  brandHomeHref?: string;
  mode?: "solutions" | "platform";
  links?: NavLink[];
  auth?: AuthLinks;
};

export function TopNav({
  brandLabel,
  brandHomeHref = "/",
  mode = "platform",
  links,
  auth,
}: Props) {
  const fallback: NavLink[] =
    mode === "solutions"
      ? [
          { href: "#about", label: "About" },
          { href: "#playbooks", label: "Solutions" },
          { href: "#contact", label: "Contact" },
        ]
      : [
          { href: "#about", label: "About" },
          { href: "#about", label: "Platform" },
          { href: "#contact", label: "Contact" },
        ];
  const items = links ?? fallback;

  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-5 py-6 md:px-10 md:py-8">
      <BrandMark label={brandLabel} href={brandHomeHref} />
      <div className="flex items-center gap-5 md:gap-8">
        <nav aria-label="Primary" className="hidden items-center gap-6 sm:flex md:gap-8">
          {items.map((item) => (
            <a
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="text-[12px] tracking-[0.08em] text-[var(--landing-fg)] no-underline opacity-90 transition-opacity duration-[var(--landing-ease)] hover:opacity-100"
            >
              {item.label}
            </a>
          ))}
        </nav>
        {auth ? (
          <div className="flex items-center gap-4 md:gap-5">
            <a
              href={auth.loginHref}
              className="text-[12px] tracking-[0.08em] text-[var(--landing-fg)] no-underline opacity-80 transition-opacity duration-[var(--landing-ease)] hover:opacity-100"
            >
              {auth.loginLabel}
            </a>
            <a
              href={auth.signupHref}
              className="border border-[var(--landing-border)] px-3 py-2 text-[11px] tracking-[0.14em] text-[var(--landing-fg)] uppercase no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-80"
            >
              {auth.signupLabel}
            </a>
          </div>
        ) : null}
      </div>
    </header>
  );
}

```


===== FILE: apps/web/src/landing/components/ContactBlock.tsx =====
```
import { useState } from "react";

type Props = {
  heading: string;
  noteLabel?: string;
  source: string;
};

export function ContactBlock({ heading, noteLabel = "Optional note", source }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/marketing/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || ""),
          company: String(data.get("company") || ""),
          email: String(data.get("email") || ""),
          note: String(data.get("note") || ""),
          source,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Could not send.");
      }
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send.");
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 bg-[var(--landing-surface)] px-5 py-24 text-[var(--landing-fg)] md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-20">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
          {(
            [
              ["name", "Name", "text", true],
              ["company", "Company", "text", true],
              ["email", "Email", "email", true],
            ] as const
          ).map(([id, label, type, required]) => (
            <label key={id} className="block">
              <span className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
                {label}
              </span>
              <input
                name={id}
                type={type}
                required={required}
                className="mt-2 w-full border-0 border-b border-[var(--landing-border)] bg-transparent px-0 py-3 text-[15px] text-[var(--landing-fg)] outline-none placeholder:text-[var(--landing-fg-soft)]"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-[11px] tracking-[0.16em] text-[var(--landing-fg-soft)] uppercase">
              {noteLabel}
            </span>
            <textarea
              name="note"
              rows={3}
              className="mt-2 w-full resize-none border-0 border-b border-[var(--landing-border)] bg-transparent px-0 py-3 text-[15px] text-[var(--landing-fg)] outline-none placeholder:text-[var(--landing-fg-soft)]"
            />
          </label>
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="submit"
              disabled={status === "sending"}
              className="border-0 bg-transparent p-0 text-[14px] tracking-[0.04em] text-[var(--landing-fg)] transition-opacity duration-[var(--landing-ease)] hover:opacity-70 disabled:opacity-40"
            >
              {status === "sending" ? "Sending…" : "Send →"}
            </button>
            {status === "sent" ? (
              <p className="text-[13px] text-[var(--landing-fg-muted)]" role="status">
                Received.
              </p>
            ) : null}
            {status === "error" ? (
              <p className="text-[13px] text-[#ffb4a8]" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/FooterMinimal.tsx =====
```
import type { NavLink } from "@/landing/copy";

type Props = {
  brand?: string;
  tagline?: string;
  links?: NavLink[];
};

export function FooterMinimal({
  brand = "Meikapen",
  tagline = "Instala. Activa. Sucede.",
  links,
}: Props) {
  return (
    <footer className="flex flex-col gap-6 px-5 py-10 text-[11px] tracking-[0.12em] text-[var(--landing-ink-muted)] uppercase md:flex-row md:items-center md:justify-between md:px-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <span>{brand}</span>
        <span className="normal-case tracking-[0.04em]">{tagline}</span>
      </div>
      {links?.length ? (
        <nav aria-label="Footer" className="flex flex-wrap gap-5">
          {links.map((link) => (
            <a
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="text-[var(--landing-ink-muted)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </footer>
  );
}

```


===== FILE: apps/web/src/landing/components/SectionIntro.tsx =====
```
type Props = {
  id?: string;
  heading: string;
  body: string[];
};

export function SectionIntro({ id, heading, body }: Props) {
  return (
    <section id={id} className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-16">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em] text-[var(--landing-ink)]">
          {heading}
        </h2>
        <div className="space-y-5">
          {body.map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-relaxed text-[var(--landing-ink-muted)] md:text-[16px]">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/FourColumnList.tsx =====
```
import type { ColumnGroup } from "@/landing/copy";

type Props = {
  groups: ColumnGroup[];
};

export function FourColumnList({ groups }: Props) {
  return (
    <section className="border-y border-[var(--landing-rule)] px-5 py-20 md:px-10 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-[11px] tracking-[0.18em] text-[var(--landing-ink-muted)] uppercase">
              {group.title}
            </p>
            <ul className="mt-5 space-y-3">
              {group.items.map((item) => (
                <li key={item} className="text-[15px] leading-snug text-[var(--landing-ink)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/PlaybookCards.tsx =====
```
import type { PlaybookCard } from "@/landing/copy";

type Props = {
  heading: string;
  cards: PlaybookCard[];
};

export function PlaybookCards({ heading, cards }: Props) {
  return (
    <section id="playbooks" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <ul className="mt-14 divide-y divide-[var(--landing-rule)] border-y border-[var(--landing-rule)]">
          {cards.map((card) => {
            const inner = (
              <>
                <div>
                  <p className="text-[18px] font-medium tracking-[-0.02em]">{card.title}</p>
                  <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                    {card.body}
                  </p>
                </div>
                {card.href ? (
                  <span className="mt-4 text-[13px] tracking-[0.04em] text-[var(--landing-ink)] md:mt-0">
                    Open →
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={card.title}>
                {card.href ? (
                  <a
                    href={card.href}
                    className="flex flex-col justify-between gap-2 py-8 text-[var(--landing-ink)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70 md:flex-row md:items-end"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="flex flex-col justify-between gap-2 py-8 md:flex-row md:items-end">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

```


===== FILE: apps/web/src/landing/components/BrandMark.tsx =====
```
type Props = {
  label: string;
  href?: string;
};

export function BrandMark({ label, href = "/" }: Props) {
  return (
    <a
      href={href}
      className="inline-flex items-center border border-[var(--landing-border)] px-3 py-2 text-[11px] font-medium tracking-[0.22em] text-[var(--landing-fg)] uppercase no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-80"
    >
      {label}
    </a>
  );
}

```


===== FILE: apps/web/src/pages/JourneyStudioPage.tsx =====
```
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { IconButton } from "@/components/IconButton";
import "@/styles/flow-designer.css";
import {
  createJourney,
  listJourneys,
  updateJourneyStatus,
  type Journey,
  type JourneyChannel,
  type JourneyStatus,
  type JourneyStep,
  type JourneyStepInput,
} from "@/lib/journeys";
import {
  createTemplate,
  listTemplates,
  updateTemplateStatus,
  type MessageTemplate,
  type TemplateChannel,
  type TemplateStatus,
} from "@/lib/templates";
import { getRecuperaStudio } from "@/lib/recupera";

type Props = {
  onBack: () => void;
};

type Tab = "flows" | "templates";

type DraftStep = {
  channel: JourneyChannel;
  delayHours: number;
  businessDayOffset: number;
  /** WhatsApp: approved provider template reference. Other channels: free internal name. */
  templateRef: string;
  subjectEs: string;
  messageEs: string;
  messageEn: string;
  apiUrl: string;
  apiMethod: "POST" | "PUT" | "PATCH";
  apiHeadersJson: string;
};

const RECUPERA_FLOW_PREFIX = "Recupera";

const STAGE_LABELS: Record<string, string> = {
  PRE_DUE: "Antes de vencer",
  DUE: "Día de vencimiento",
  DPD_1_7: "1 a 7 días",
  DPD_8_15: "8 a 15 días",
  DPD_16_30: "16 a 30 días",
  DPD_31_60: "31 a 60 días",
  DPD_60_PLUS: "Más de 60 días",
};

const CHANNEL_LABELS: Record<JourneyChannel, string> = {
  whatsapp: "Enviar WhatsApp",
  email: "Enviar correo",
  sms: "Enviar SMS",
  api: "Webhook",
};

const CHANNEL_ICONS: Record<JourneyChannel, string> = {
  whatsapp: "WA",
  email: "EM",
  sms: "SMS",
  api: "API",
};

const STATUS_LABELS: Record<JourneyStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  paused: "En pausa",
  archived: "Archivado",
};

const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  draft: "Borrador",
  approved: "Aprobada",
  active: "Activa",
  paused: "En pausa",
  rejected: "Rechazada",
  archived: "Archivada",
};

const TEMPLATE_CHANNEL_LABELS: Record<TemplateChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Correo",
  sms: "SMS",
};

function flowTitle(name: string) {
  const stageKey = name.replace(/^Recupera\s*·\s*/, "").trim();
  return STAGE_LABELS[stageKey] || name;
}

function statusBadgeClass(status: string) {
  if (status === "active" || status === "approved") return "flow-badge flow-badge-ok";
  if (status === "paused" || status === "draft") return "flow-badge flow-badge-warn";
  if (status === "rejected") return "flow-badge flow-badge-bad";
  return "flow-badge flow-badge-off";
}

function waitLabel(delayMinutes: number, businessDayOffset: number | null) {
  const hours = Math.round((Number(delayMinutes) || 0) / 60);
  if (businessDayOffset === null || businessDayOffset === undefined) {
    return hours ? `+${hours} h` : "de inmediato";
  }
  const day = Number(businessDayOffset) === 0 ? "mismo día hábil" : `día hábil ${businessDayOffset}`;
  return hours ? `${day} +${hours} h` : day;
}

function draftWaitLabel(step: DraftStep) {
  const day = step.businessDayOffset === 0 ? "mismo día hábil" : `día hábil ${step.businessDayOffset}`;
  return step.delayHours ? `${day} +${step.delayHours} h` : day;
}

function stepSubtitle(step: JourneyStep) {
  const message = step.message_es || step.message_en || "";
  return message.length > 120 ? `${message.slice(0, 117)}…` : message || "Mensaje de seguimiento";
}

function errorMessage(error: unknown) {
  const err = error as { status?: number; code?: string; message?: string };
  if (err?.code === "playbook_disabled" || err?.status === 404) {
    return "Recupera no está habilitado en este entorno.";
  }
  if (err?.status === 401) return "Inicia sesión para continuar.";
  if (err?.status === 403) return "Se requiere rol administrador.";
  return err?.message || "No se pudo completar la solicitud.";
}

function defaultDraftSteps(): DraftStep[] {
  const base = {
    templateRef: "",
    subjectEs: "Su cuenta con {{brand}}",
    apiUrl: "",
    apiMethod: "POST" as const,
    apiHeadersJson: "",
  };
  return [
    {
      ...base,
      channel: "whatsapp",
      delayHours: 0,
      businessDayOffset: 0,
      messageEs:
        "Hola {{name}}, le escribimos de {{brand}} por su cuenta {{role}}. Responda a este mensaje y le enviamos su enlace de pago.",
      messageEn:
        "Hi {{name}}, {{brand}} here about your account {{role}}. Reply to this message and we will send your payment link.",
    },
    {
      ...base,
      channel: "email",
      delayHours: 0,
      businessDayOffset: 1,
      messageEs:
        "Hola {{name}}, su cuenta {{role}} con {{brand}} sigue pendiente. Responda a este mensaje y le enviamos su enlace de pago.",
      messageEn:
        "Hi {{name}}, your account {{role}} with {{brand}} is still pending. Reply and we will send your payment link.",
    },
    {
      ...base,
      channel: "whatsapp",
      delayHours: 0,
      businessDayOffset: 3,
      messageEs:
        "Hola {{name}}, ¿podemos ayudarle a resolver su cuenta {{role}}? Responda a este mensaje y buscamos una solución.",
      messageEn:
        "Hi {{name}}, can we help you resolve your account {{role}}? Reply and we will find a solution.",
    },
  ];
}

function newDraftStep(): DraftStep {
  return {
    channel: "whatsapp",
    delayHours: 0,
    businessDayOffset: 1,
    templateRef: "",
    subjectEs: "Su cuenta con {{brand}}",
    messageEs: "Hola {{name}}, le recordamos su cuenta {{role}} con {{brand}}. Responda a este mensaje si necesita ayuda.",
    messageEn: "Hi {{name}}, a reminder about your account {{role}} with {{brand}}. Reply if you need help.",
    apiUrl: "",
    apiMethod: "POST",
    apiHeadersJson: "",
  };
}

function FlowNode({
  kind,
  number,
  channel,
  title,
  subtitle,
  meta,
  actions,
  config,
}: {
  kind: "trigger" | "action" | "goal";
  number: number;
  channel?: JourneyChannel;
  title: string;
  subtitle: string;
  meta?: string;
  actions?: React.ReactNode;
  config?: React.ReactNode;
}) {
  const icon = channel ? CHANNEL_ICONS[channel] : kind === "trigger" ? "" : "OK";
  if (kind === "trigger") {
    return (
      <div
        className="flow-node flow-trigger"
        aria-label={`${title}. ${subtitle}`}
        title={`${title} · ${subtitle}`}
      >
        <div className="flow-icon" aria-hidden />
      </div>
    );
  }
  return (
    <div
      className={`flow-node flow-${kind}${channel ? ` flow-${channel}` : ""}`}
    >
      <span className="flow-number">{number}</span>
      <div className="flow-icon" aria-hidden>
        {icon}
      </div>
      <div className="flow-node-copy">
        <strong>{title}</strong>
        <span>{subtitle}</span>
        {meta ? <small>{meta}</small> : null}
      </div>
      {actions ? <div className="flow-node-actions">{actions}</div> : null}
      {config}
    </div>
  );
}

function FlowConnector({ label }: { label: string }) {
  return (
    <div className="flow-connector compact">
      <span>{label}</span>
    </div>
  );
}

function SavedFlow({ journey }: { journey: Journey }) {
  const steps = journey.steps || [];
  return (
    <div className="saved-flow">
      <FlowNode
        kind="trigger"
        number={1}
        title="Cuenta en cobranza"
        subtitle="Rocío empieza cuando se activa la cuenta"
        meta={`${Number(journey.enrollment_count || 0)} cuentas en seguimiento`}
      />
      {steps.map((step, index) => (
        <div key={step.id} className="contents">
          <FlowConnector label={waitLabel(step.delay_minutes, step.business_day_offset)} />
          <FlowNode
            kind="action"
            number={index + 2}
            channel={step.channel}
            title={CHANNEL_LABELS[step.channel]}
            subtitle={stepSubtitle(step)}
            meta={step.template_name || undefined}
          />
        </div>
      ))}
      <FlowConnector label="pago recibido" />
      <FlowNode
        kind="goal"
        number={steps.length + 2}
        title="Pago recibido"
        subtitle="Se detienen los mensajes"
        meta={`${Number(journey.skipped_event_count || 0)} mensajes detenidos`}
      />
    </div>
  );
}

export function JourneyStudioPage({ onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("flows");
  const [listId, setListId] = useState("");
  const [testId, setTestId] = useState("");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [draftName, setDraftName] = useState("Recordatorio propio");
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>(defaultDraftSteps);

  const [templateChannel, setTemplateChannel] = useState<TemplateChannel>("whatsapp");
  const [templateName, setTemplateName] = useState("");
  const [templateProviderName, setTemplateProviderName] = useState("");
  const [templateMessageEs, setTemplateMessageEs] = useState(
    "Hola {{name}}, le escribimos de {{brand}} por su cuenta {{role}}. Responda a este mensaje y le enviamos su enlace de pago.",
  );
  const [templateMessageEn, setTemplateMessageEn] = useState(
    "Hi {{name}}, {{brand}} here about your account {{role}}. Reply to this message and we will send your payment link.",
  );

  const selected = journeys.find((journey) => journey.id === selectedId) || null;
  const approvedWhatsapp = useMemo(
    () =>
      templates.filter(
        (template) =>
          template.channel === "whatsapp" && ["approved", "active"].includes(template.status),
      ),
    [templates],
  );

  /** Prefer the Recupera flows; show every flow of the company when the playbook has none yet. */
  function applyJourneys(all: Journey[]) {
    const recupera = all.filter((journey) =>
      (journey.name || "").startsWith(RECUPERA_FLOW_PREFIX),
    );
    const visible = recupera.length ? recupera : all;
    setJourneys(visible);
    setSelectedId((current) =>
      current && visible.some((journey) => journey.id === current)
        ? current
        : visible[0]?.id ?? null,
    );
    return visible;
  }

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const studio = await getRecuperaStudio();
      setListId(studio.listId);
      setTestId(studio.testId);
      applyJourneys(studio.journeys || []);
      setTemplates(studio.templates || []);
    } catch (studioError) {
      // No studio bootstrap (playbook disabled or older worker): read the shared endpoints directly.
      try {
        const [journeyResult, templateResult] = await Promise.all([
          listJourneys(),
          listTemplates(),
        ]);
        const visible = applyJourneys(journeyResult.journeys || []);
        setTemplates(templateResult.templates || []);
        setListId(visible[0]?.list_id || "");
        setTestId(visible[0]?.test_id || "");
      } catch {
        setError(errorMessage(studioError));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function run(label: string, action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(label);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function updateStep(index: number, patch: Partial<DraftStep>) {
    setDraftSteps((steps) =>
      steps.map((step, position) => (position === index ? { ...step, ...patch } : step)),
    );
  }

  function moveStep(index: number, direction: -1 | 1) {
    setDraftSteps((steps) => {
      const target = index + direction;
      if (target < 0 || target >= steps.length) return steps;
      const next = steps.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toStepInput(step: DraftStep): JourneyStepInput {
    if (step.channel === "api") {
      return {
        channel: "api",
        delayHours: step.delayHours,
        businessDayOffset: step.businessDayOffset,
        apiUrl: step.apiUrl,
        apiMethod: step.apiMethod,
        apiHeadersJson: step.apiHeadersJson || undefined,
        messageEs: step.messageEs,
        messageEn: step.messageEn,
      };
    }
    return {
      channel: step.channel,
      delayHours: step.delayHours,
      businessDayOffset: step.businessDayOffset,
      templateName: step.templateRef || undefined,
      brevoTemplateId: step.channel === "whatsapp" ? step.templateRef || undefined : undefined,
      subjectEs: step.subjectEs || undefined,
      subjectEn: step.subjectEs || undefined,
      messageEs: step.messageEs,
      messageEn: step.messageEn,
    };
  }

  async function onSaveDraft() {
    if (!draftName.trim() || !draftSteps.length) {
      setError("Ponle nombre al flujo y agrega al menos un paso.");
      return;
    }
    if (!listId || !testId) {
      setError("El estudio aún no terminó de cargar.");
      return;
    }
    const trimmed = draftName.trim();
    await run("Flujo guardado como borrador.", async () => {
      const result = await createJourney({
        name: trimmed.startsWith(RECUPERA_FLOW_PREFIX)
          ? trimmed
          : `${RECUPERA_FLOW_PREFIX} · ${trimmed}`,
        listId,
        testId,
        locale: "es",
        status: "draft",
        steps: draftSteps.map(toStepInput),
      });
      setBuilderOpen(false);
      setSelectedId(result.journeyId);
    });
  }

  async function onCreateTemplate(event: React.FormEvent) {
    event.preventDefault();
    if (!templateName.trim() || !templateMessageEs.trim() || !templateMessageEn.trim()) {
      setError("Nombre y los dos mensajes son obligatorios.");
      return;
    }
    if (templateChannel === "whatsapp" && !templateProviderName.trim()) {
      setError("WhatsApp requiere el nombre exacto de la plantilla aprobada.");
      return;
    }
    await run("Plantilla creada.", async () => {
      await createTemplate({
        channel: templateChannel,
        name: templateName.trim(),
        messageEs: templateMessageEs,
        messageEn: templateMessageEn,
        language: "es",
        providerTemplateName: templateProviderName.trim() || undefined,
      });
      setTemplateName("");
      setTemplateProviderName("");
    });
  }

  return (
    <div className="mk-studio mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <IconButton label="Volver" icon={ArrowLeft} onClick={onBack} tone="ghost" />
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
              Recupera · by Meikapen
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Estrategia</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Seguimientos y plantillas: lo que Rocío hace, en qué canal y cuándo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label="Actualizar"
            icon={loading || busy ? Loader2 : RefreshCw}
            disabled={loading || busy}
            onClick={() => void refresh()}
            className={loading || busy ? "[&_svg]:animate-spin" : ""}
          />
          {tab === "flows" ? (
            <IconButton
              label={builderOpen ? "Cerrar borrador" : "Nuevo flujo"}
              icon={builderOpen ? X : Plus}
              tone="accent"
              disabled={loading}
              onClick={() => setBuilderOpen((open) => !open)}
            />
          ) : null}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-1 border-b border-[var(--border)]">
        {(
          [
            ["flows", "Flujos"],
            ["templates", "Plantillas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={[
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none",
              tab === key
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p
          className="mb-4 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-4 text-sm text-[var(--text-secondary)]" role="status">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : tab === "flows" ? (
        <div className="flex flex-col gap-6">
          {builderOpen ? (
            <div className="flow-designer">
              <div className="flow-designer-topbar">
                <div className="flow-designer-title">
                  <strong>Nuevo flujo</strong>
                  <span className="flow-badge flow-badge-off">Borrador</span>
                </div>
                <div className="flow-designer-actions">
                  <IconButton
                    label="Agregar paso"
                    icon={Plus}
                    size="sm"
                    onClick={() => setDraftSteps((steps) => [...steps, newDraftStep()])}
                  />
                  <IconButton
                    label={busy ? "Guardando…" : "Guardar borrador"}
                    icon={busy ? Loader2 : Save}
                    tone="accent"
                    size="sm"
                    disabled={busy}
                    onClick={() => void onSaveDraft()}
                    className={busy ? "[&_svg]:animate-spin" : ""}
                  />
                </div>
              </div>

              <div className="flow-form-grid">
                <label className="flow-field flow-wide">
                  <span>Nombre del flujo</span>
                  <input
                    className="flow-input"
                    value={draftName}
                    maxLength={140}
                    onChange={(event) => setDraftName(event.target.value)}
                  />
                  <small>Se guarda como borrador. Actívalo cuando esté listo.</small>
                </label>
              </div>

              <div className="flow-canvas">
                <FlowNode
                  kind="trigger"
                  number={1}
                  title="Cuenta en cobranza"
                  subtitle="Rocío empieza cuando se activa la cuenta"
                />
                {draftSteps.map((step, index) => (
                  <div key={index} className="contents">
                    <div className="flow-connector">
                      <span>{draftWaitLabel(step)}</span>
                    </div>
                    <fieldset
                      className={`journey-step-card flow-node flow-action flow-${step.channel}`}
                    >
                      <legend>Paso {index + 1}</legend>
                      <span className="flow-number">{index + 2}</span>
                      <div className="flow-icon" aria-hidden>
                        {CHANNEL_ICONS[step.channel]}
                      </div>
                      <div className="flow-node-copy">
                        <strong>{CHANNEL_LABELS[step.channel]}</strong>
                        <span>Solo si la cuenta sigue sin pago</span>
                        <small>{draftWaitLabel(step)}</small>
                      </div>
                      <div className="flow-node-actions">
                        <IconButton
                          label="Subir paso"
                          icon={ArrowUp}
                          size="sm"
                          disabled={index === 0}
                          onClick={() => moveStep(index, -1)}
                        />
                        <IconButton
                          label="Bajar paso"
                          icon={ArrowDown}
                          size="sm"
                          disabled={index === draftSteps.length - 1}
                          onClick={() => moveStep(index, 1)}
                        />
                        <IconButton
                          label="Quitar paso"
                          icon={Trash2}
                          size="sm"
                          tone="danger"
                          disabled={draftSteps.length <= 1}
                          onClick={() =>
                            setDraftSteps((steps) =>
                              steps.filter((_, position) => position !== index),
                            )
                          }
                        />
                      </div>
                      <details className="flow-config">
                        <summary>Configurar paso</summary>
                        <div className="flow-controls">
                          <label className="flow-field">
                            <span>Canal</span>
                            <select
                              className="flow-select"
                              value={step.channel}
                              onChange={(event) =>
                                updateStep(index, {
                                  channel: event.target.value as JourneyChannel,
                                  templateRef: "",
                                })
                              }
                            >
                              <option value="whatsapp">Enviar WhatsApp</option>
                              <option value="email">Enviar correo</option>
                              <option value="sms">Enviar SMS</option>
                              <option value="api">Webhook</option>
                            </select>
                          </label>
                          <label className="flow-field">
                            <span>Día hábil</span>
                            <input
                              className="flow-input"
                              type="number"
                              min={0}
                              max={30}
                              step={1}
                              value={step.businessDayOffset}
                              onChange={(event) =>
                                updateStep(index, {
                                  businessDayOffset: Number(event.target.value) || 0,
                                })
                              }
                            />
                            <small>0 es el mismo día. Fines de semana se omiten.</small>
                          </label>
                          <label className="flow-field">
                            <span>Horas de espera</span>
                            <input
                              className="flow-input"
                              type="number"
                              min={0}
                              max={720}
                              step={1}
                              value={step.delayHours}
                              onChange={(event) =>
                                updateStep(index, { delayHours: Number(event.target.value) || 0 })
                              }
                            />
                          </label>

                          {step.channel === "api" ? (
                            <>
                              <label className="flow-field">
                                <span>Método</span>
                                <select
                                  className="flow-select"
                                  value={step.apiMethod}
                                  onChange={(event) =>
                                    updateStep(index, {
                                      apiMethod: event.target.value as DraftStep["apiMethod"],
                                    })
                                  }
                                >
                                  <option value="POST">POST</option>
                                  <option value="PUT">PUT</option>
                                  <option value="PATCH">PATCH</option>
                                </select>
                              </label>
                              <label className="flow-field flow-wide">
                                <span>URL del webhook</span>
                                <input
                                  className="flow-input"
                                  type="url"
                                  placeholder="https://tu-sistema.com/recupera"
                                  value={step.apiUrl}
                                  onChange={(event) =>
                                    updateStep(index, { apiUrl: event.target.value })
                                  }
                                />
                                <small>Debe ser HTTPS.</small>
                              </label>
                              <label className="flow-field flow-wide">
                                <span>Headers JSON</span>
                                <textarea
                                  className="flow-textarea"
                                  maxLength={1000}
                                  placeholder='{"Authorization":"Bearer token"}'
                                  value={step.apiHeadersJson}
                                  onChange={(event) =>
                                    updateStep(index, { apiHeadersJson: event.target.value })
                                  }
                                />
                              </label>
                            </>
                          ) : step.channel === "whatsapp" ? (
                            <label className="flow-field">
                              <span>Plantilla aprobada</span>
                              <select
                                className="flow-select"
                                value={step.templateRef}
                                onChange={(event) =>
                                  updateStep(index, { templateRef: event.target.value })
                                }
                              >
                                <option value="">Elegir plantilla</option>
                                {approvedWhatsapp.map((template) => (
                                  <option
                                    key={template.id}
                                    value={template.provider_template_name || template.id}
                                  >
                                    {template.provider_template_name || template.name} ·{" "}
                                    {template.language}
                                  </option>
                                ))}
                              </select>
                              <small>
                                {approvedWhatsapp.length
                                  ? "WhatsApp solo envía con plantilla aprobada."
                                  : "Aún no hay plantillas aprobadas. Créalas en Plantillas."}
                              </small>
                            </label>
                          ) : (
                            <label className="flow-field">
                              <span>Referencia de plantilla</span>
                              <input
                                className="flow-input"
                                maxLength={120}
                                placeholder="Opcional"
                                value={step.templateRef}
                                onChange={(event) =>
                                  updateStep(index, { templateRef: event.target.value })
                                }
                              />
                            </label>
                          )}

                          {step.channel === "email" ? (
                            <label className="flow-field flow-wide">
                              <span>Asunto</span>
                              <input
                                className="flow-input"
                                maxLength={180}
                                value={step.subjectEs}
                                onChange={(event) =>
                                  updateStep(index, { subjectEs: event.target.value })
                                }
                              />
                            </label>
                          ) : null}

                          <label className="flow-field flow-wide">
                            <span>Mensaje en español</span>
                            <textarea
                              className="flow-textarea"
                              maxLength={800}
                              value={step.messageEs}
                              onChange={(event) =>
                                updateStep(index, { messageEs: event.target.value })
                              }
                            />
                            <small>Usa {"{{name}}"}, {"{{brand}}"} y {"{{role}}"}.</small>
                          </label>
                          <label className="flow-field flow-wide">
                            <span>Mensaje en inglés</span>
                            <textarea
                              className="flow-textarea"
                              maxLength={800}
                              value={step.messageEn}
                              onChange={(event) =>
                                updateStep(index, { messageEn: event.target.value })
                              }
                            />
                          </label>
                        </div>
                      </details>
                    </fieldset>
                  </div>
                ))}
                <div className="flow-connector">
                  <span>pago recibido</span>
                  <button
                    type="button"
                    className="flow-inline-add"
                    aria-label="Agregar paso al final"
                    title="Agregar paso al final"
                    onClick={() => setDraftSteps((steps) => [...steps, newDraftStep()])}
                  >
                    <Plus size={15} strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
                <FlowNode
                  kind="goal"
                  number={draftSteps.length + 2}
                  title="Pago recibido"
                  subtitle="Se detienen los mensajes"
                />
              </div>

              <div className="flow-designer-footer">
                <span>{draftSteps.length} pasos · español</span>
                <IconButton
                  label="Agregar otro paso"
                  icon={Plus}
                  size="sm"
                  onClick={() => setDraftSteps((steps) => [...steps, newDraftStep()])}
                />
              </div>
            </div>
          ) : null}

          {journeys.length === 0 ? (
            <div className="flow-empty">
              <strong>Aún no hay flujos</strong>
              <span>
                Al abrir esta vista se preparan los flujos por etapa. Vuelve a actualizar o crea uno
                nuevo.
              </span>
            </div>
          ) : (
            <div className="journey-flow-list">
              {journeys.map((journey) => {
                const isSelected = journey.id === selectedId;
                return (
                  <article
                    key={journey.id}
                    className={`journey-flow-card${isSelected ? " selected" : ""}`}
                  >
                    <div className="journey-flow-head">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        aria-expanded={isSelected}
                        onClick={() => setSelectedId(isSelected ? null : journey.id)}
                      >
                        <strong>{flowTitle(journey.name)}</strong>
                        <span>
                          {journey.step_count} pasos ·{" "}
                          {STATUS_LABELS[journey.status] || journey.status}
                        </span>
                      </button>
                      <span className={statusBadgeClass(journey.status)}>
                        {STATUS_LABELS[journey.status] || journey.status}
                      </span>
                    </div>

                    <div className="flow-stats">
                      <span>{Number(journey.enrollment_count || 0)} en seguimiento</span>
                      <span>{Number(journey.contacted_candidate_count || 0)} contactadas</span>
                      <span>{Number(journey.queued_event_count || 0)} en cola</span>
                    </div>

                    {isSelected ? <SavedFlow journey={journey} /> : null}

                    <div className="journey-flow-actions">
                      <IconButton
                        label="Activar"
                        icon={Play}
                        size="sm"
                        tone="accent"
                        disabled={busy || journey.status === "active"}
                        onClick={() =>
                          void run("Flujo activado.", async () => {
                            await updateJourneyStatus(journey.id, "active");
                          })
                        }
                      />
                      <IconButton
                        label="Pausar"
                        icon={Pause}
                        size="sm"
                        disabled={busy || journey.status !== "active"}
                        onClick={() =>
                          void run("Flujo en pausa.", async () => {
                            await updateJourneyStatus(journey.id, "paused");
                          })
                        }
                      />
                      <IconButton
                        label="Archivar"
                        icon={Archive}
                        size="sm"
                        tone="danger"
                        disabled={busy || journey.status === "archived"}
                        onClick={() =>
                          void run("Flujo archivado.", async () => {
                            await updateJourneyStatus(journey.id, "archived");
                          })
                        }
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {selected ? (
            <p className="text-xs text-[var(--text-secondary)]">
              Los pasos de un flujo guardado no se editan en su lugar: duplica el flujo con “Nuevo
              flujo” y archiva el anterior.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <form className="flow-designer" onSubmit={(event) => void onCreateTemplate(event)}>
            <div className="flow-designer-topbar">
              <div className="flow-designer-title">
                <strong>Nueva plantilla</strong>
              </div>
              <div className="flow-designer-actions">
                <IconButton
                  label={busy ? "Creando…" : "Crear plantilla"}
                  icon={busy ? Loader2 : Plus}
                  tone="accent"
                  size="sm"
                  type="submit"
                  disabled={busy}
                  className={busy ? "[&_svg]:animate-spin" : ""}
                />
              </div>
            </div>
            <div className="flow-form-grid">
              <label className="flow-field">
                <span>Canal</span>
                <select
                  className="flow-select"
                  value={templateChannel}
                  onChange={(event) => setTemplateChannel(event.target.value as TemplateChannel)}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Correo</option>
                  <option value="sms">SMS</option>
                </select>
              </label>
              <label className="flow-field">
                <span>Nombre</span>
                <input
                  className="flow-input"
                  maxLength={140}
                  required
                  placeholder="Recordatorio amable"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                />
              </label>
              <label className="flow-field">
                <span>Nombre en el proveedor</span>
                <input
                  className="flow-input"
                  maxLength={140}
                  placeholder="recupera_recordatorio"
                  value={templateProviderName}
                  onChange={(event) => setTemplateProviderName(event.target.value)}
                />
                <small>
                  {templateChannel === "whatsapp"
                    ? "Obligatorio: usa el nombre exacto aprobado."
                    : "Opcional."}
                </small>
              </label>
              <label className="flow-field flow-wide">
                <span>Mensaje en español</span>
                <textarea
                  className="flow-textarea"
                  maxLength={1200}
                  required
                  value={templateMessageEs}
                  onChange={(event) => setTemplateMessageEs(event.target.value)}
                />
              </label>
              <label className="flow-field flow-wide">
                <span>Mensaje en inglés</span>
                <textarea
                  className="flow-textarea"
                  maxLength={1200}
                  required
                  value={templateMessageEn}
                  onChange={(event) => setTemplateMessageEn(event.target.value)}
                />
              </label>
              <p className="template-create-actions text-xs text-[var(--text-secondary)]">
                En WhatsApp marca “Aprobada” solo después de que el proveedor apruebe el nombre y el
                idioma exactos.
              </p>
            </div>
          </form>

          <section className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <Mic
              size={18}
              strokeWidth={1.75}
              aria-hidden
              className="mt-0.5 shrink-0 text-[var(--text-secondary)]"
            />
            <div>
              <p className="text-sm font-medium">Script · Rocío</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                Todavía no hay canal de voz. Rocío usa estas mismas plantillas de WhatsApp, correo y
                SMS como guion, así que los tres canales son obligatorios.
              </p>
            </div>
          </section>

          {templates.length === 0 ? (
            <div className="flow-empty">
              <strong>Aún no hay plantillas</strong>
              <span>Crea el contenido reutilizable de WhatsApp, correo y SMS.</span>
            </div>
          ) : (
            <section className="template-grid">
              {templates.map((template) => (
                <article key={template.id} className="template-card">
                  <div className="template-card-head">
                    <span className={`channel-pill ${template.channel}`}>
                      {TEMPLATE_CHANNEL_LABELS[template.channel] || template.channel}
                    </span>
                    <span className={statusBadgeClass(template.status)}>
                      {TEMPLATE_STATUS_LABELS[template.status] || template.status}
                    </span>
                  </div>
                  <strong>{template.name}</strong>
                  <p>{template.message_es || template.message_en}</p>
                  <small>
                    {template.provider}
                    {template.provider_template_name ? ` · ${template.provider_template_name}` : ""}{" "}
                    · {template.language}
                  </small>
                  <div className="template-actions">
                    {(
                      [
                        ["approved", "Aprobada", CheckCircle2],
                        ["active", "Activa", Play],
                        ["paused", "En pausa", Pause],
                        ["draft", "Borrador", FileText],
                        ["archived", "Archivada", Archive],
                      ] as const
                    ).map(([status, label, icon]) => (
                      <IconButton
                        key={status}
                        label={label}
                        icon={icon}
                        size="sm"
                        tone={status === "archived" ? "danger" : "default"}
                        disabled={busy || template.status === status}
                        onClick={() =>
                          void run(`Plantilla · ${label}.`, async () => {
                            await updateTemplateStatus(template.id, status);
                          })
                        }
                      />
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

```


===== FILE: apps/web/src/styles/flow-designer.css =====
```
/*
 * Recupera Journey Studio — flow designer.
 * Ported from Gazelle Hunt (apps/worker/src/legacy/styles.css: .flow-*, .journey-*, .template-*).
 * Same visual language (grid canvas, dashed spine, colored channel borders, circular trigger),
 * scoped under .mk-studio and re-pointed at Meikapen shell tokens so dark mode works.
 */
.mk-studio {
  --flow-line: var(--border, rgba(55, 53, 47, 0.09));
  --flow-muted: var(--text-secondary, #787774);
  --flow-surface: var(--surface, #ffffff);
  --flow-canvas: var(--background, #fbfcfd);
  --flow-dot: var(--border, rgba(55, 53, 47, 0.2));
  --flow-spine: var(--text-secondary, #9aa8ad);
  --flow-teal: var(--accent, #2383e2);
  --flow-email: var(--accent, #2383e2);
  --flow-whatsapp: #21a65b;
  --flow-sms: #d9971c;
  --flow-api: #4777c4;
  --flow-trigger: #24d3ad;
  --flow-goal: var(--success, #0f7b6c);
}

/* Channel pills */
.mk-studio .channel-pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  margin: 2px 3px 2px 0;
  padding: 4px 8px;
  border-radius: 5px;
  color: var(--text-primary);
  background: var(--surface-secondary);
  font-size: 11px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.mk-studio .channel-pill.email {
  color: #0f5d56;
  background: #dff4ef;
}
.mk-studio .channel-pill.whatsapp {
  color: #106236;
  background: #dcf7e7;
}
.mk-studio .channel-pill.sms {
  color: #6d4a08;
  background: #fff1cf;
}
.mk-studio .channel-pill.api {
  color: #294d84;
  background: #e5eefc;
}

/* Designer chrome */
.mk-studio .flow-designer {
  overflow: hidden;
  border: 1px solid var(--flow-line);
  border-radius: var(--radius-card, 12px);
  background: var(--flow-surface);
  box-shadow: var(--shadow-soft, 0 18px 40px rgba(25, 35, 40, 0.08));
}
.mk-studio .flow-designer-topbar {
  min-height: 58px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--flow-line);
  background: var(--flow-surface);
}
.mk-studio .flow-designer-title,
.mk-studio .flow-designer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mk-studio .flow-designer-title strong {
  font-size: 15px;
  font-weight: 600;
}
.mk-studio .flow-designer-actions {
  justify-content: flex-end;
}
/* Canvas */
.mk-studio .flow-canvas {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0;
  padding: 40px 18px;
  background-color: var(--flow-canvas);
  background-image: radial-gradient(var(--flow-dot) 1px, transparent 1px);
  background-size: 10px 10px;
}
.mk-studio .flow-canvas::before {
  content: "";
  position: absolute;
  top: 78px;
  bottom: 92px;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(var(--flow-spine) 50%, transparent 0) 0 0 / 2px 16px repeat-y;
  opacity: 0.45;
}

/* Nodes */
.mk-studio .flow-node {
  position: relative;
  z-index: 1;
  width: min(100%, 420px);
  min-height: 78px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 15px 14px;
  border: 1px solid var(--flow-line);
  border-radius: 6px;
  background: var(--flow-surface);
  box-shadow: var(--shadow-soft, 0 8px 18px rgba(22, 34, 42, 0.09));
  text-align: left;
  box-sizing: border-box;
}
.mk-studio .flow-node.flow-trigger {
  width: 74px;
  height: 74px;
  min-width: 74px;
  max-width: 74px;
  min-height: 74px;
  max-height: 74px;
  aspect-ratio: 1 / 1;
  padding: 0;
  gap: 0;
  grid-template-columns: 1fr;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--flow-trigger);
  box-shadow: 0 10px 24px rgba(36, 211, 173, 0.28);
  overflow: hidden;
}
.mk-studio .flow-node.flow-goal {
  border-color: color-mix(in srgb, var(--flow-goal) 45%, transparent);
  background: color-mix(in srgb, var(--flow-goal) 7%, var(--flow-surface));
}
.mk-studio .flow-node.flow-whatsapp {
  border-left: 8px solid var(--flow-whatsapp);
}
.mk-studio .flow-node.flow-sms {
  border-left: 8px solid var(--flow-sms);
}
.mk-studio .flow-node.flow-email {
  border-left: 8px solid var(--flow-email);
}
.mk-studio .flow-node.flow-api {
  border-left: 8px solid var(--flow-api);
}
.mk-studio .flow-number {
  position: absolute;
  top: -12px;
  left: 50%;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--flow-teal);
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 0 0 3px var(--flow-canvas);
}
.mk-studio .flow-goal .flow-number {
  background: var(--flow-goal);
}
.mk-studio .flow-trigger .flow-number,
.mk-studio .flow-trigger .flow-node-copy {
  display: none;
}
.mk-studio .flow-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: var(--flow-email);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.02em;
}
.mk-studio .flow-trigger .flow-icon {
  background: transparent;
  color: #fff;
}
.mk-studio .flow-whatsapp .flow-icon {
  background: var(--flow-whatsapp);
}
.mk-studio .flow-sms .flow-icon {
  background: var(--flow-sms);
}
.mk-studio .flow-api .flow-icon {
  background: var(--flow-api);
}
.mk-studio .flow-goal .flow-icon {
  background: var(--flow-goal);
}
.mk-studio .flow-node-copy {
  min-width: 0;
}
.mk-studio .flow-node-copy strong,
.mk-studio .flow-node-copy span,
.mk-studio .flow-node-copy small {
  display: block;
}
.mk-studio .flow-node-copy strong {
  font-size: 15px;
  font-weight: 600;
}
.mk-studio .flow-node-copy span {
  margin-top: 4px;
  color: var(--flow-muted);
  font-size: 12px;
  line-height: 1.45;
}
.mk-studio .flow-node-copy small {
  margin-top: 5px;
  color: var(--flow-muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Connectors */
.mk-studio .flow-connector {
  position: relative;
  z-index: 2;
  width: 2px;
  height: 78px;
  display: grid;
  place-items: center;
  background: transparent;
}
.mk-studio .flow-connector span {
  position: absolute;
  left: 18px;
  min-width: max-content;
  padding: 4px 9px;
  border: 1px solid var(--flow-line);
  border-radius: 999px;
  color: var(--flow-muted);
  background: var(--flow-surface);
  font-size: 11px;
  font-weight: 600;
  box-shadow: var(--shadow-soft, 0 3px 8px rgba(22, 34, 42, 0.06));
}
.mk-studio .flow-connector.compact {
  height: 34px;
}
.mk-studio .flow-inline-add {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--flow-line);
  border-radius: 50%;
  color: var(--text-primary);
  background: var(--flow-surface);
  box-shadow: var(--shadow-soft, 0 6px 16px rgba(22, 34, 42, 0.08));
  cursor: pointer;
  transition: border-color var(--motion, 180ms) ease, color var(--motion, 180ms) ease;
}
.mk-studio .flow-inline-add:hover {
  border-color: var(--flow-teal);
  color: var(--flow-teal);
}
.mk-studio .flow-node-actions {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
  align-self: start;
}

/* Step configuration */
.mk-studio .flow-config {
  grid-column: 1 / -1;
  width: 100%;
  margin-top: 8px;
  border-top: 1px solid var(--flow-line);
}
.mk-studio .flow-config summary {
  padding: 10px 0 0;
  color: var(--flow-teal);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}
.mk-studio .flow-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-top: 12px;
}
.mk-studio .flow-designer-footer {
  min-height: 54px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  border-top: 1px solid var(--flow-line);
  color: var(--flow-muted);
  background: var(--flow-surface);
  font-size: 12px;
}
.mk-studio .journey-step-card {
  min-width: 0;
  margin: 0;
}
.mk-studio .journey-step-card legend {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

/* Saved flows */
.mk-studio .journey-flow-list {
  display: grid;
  gap: 16px;
}
.mk-studio .journey-flow-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--flow-line);
  border-radius: var(--radius-card, 12px);
  background: var(--flow-surface);
  box-shadow: var(--shadow-soft, none);
}
.mk-studio .journey-flow-card.selected {
  border-color: var(--flow-teal);
}
.mk-studio .journey-flow-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}
.mk-studio .journey-flow-head strong,
.mk-studio .journey-flow-head span {
  display: block;
}
.mk-studio .journey-flow-head strong {
  font-size: 15px;
  font-weight: 600;
}
.mk-studio .journey-flow-head span {
  margin-top: 4px;
  color: var(--flow-muted);
  font-size: 12px;
}
.mk-studio .saved-flow {
  position: relative;
  display: grid;
  justify-items: center;
  padding: 18px 14px;
  border-radius: var(--radius-sm, 8px);
  background-color: var(--flow-canvas);
  background-image: radial-gradient(var(--flow-dot) 1px, transparent 1px);
  background-size: 10px 10px;
  overflow-x: auto;
}
.mk-studio .saved-flow .flow-node {
  width: min(100%, 520px);
  min-height: 70px;
  padding: 13px;
}
.mk-studio .saved-flow .flow-node.flow-trigger {
  width: 74px;
  height: 74px;
  min-width: 74px;
  max-width: 74px;
  min-height: 74px;
  max-height: 74px;
  padding: 0;
  gap: 0;
  grid-template-columns: 1fr;
}
.mk-studio .flow-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.mk-studio .flow-stats span {
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--surface-secondary);
  color: var(--flow-muted);
  font-size: 11px;
  font-weight: 600;
}
.mk-studio .journey-flow-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* Template manager */
.mk-studio .template-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.mk-studio .template-card {
  padding: 16px;
  border: 1px solid var(--flow-line);
  border-radius: var(--radius-card, 12px);
  background: var(--flow-surface);
  display: grid;
  gap: 9px;
  align-content: start;
}
.mk-studio .template-card-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}
.mk-studio .template-card strong {
  font-size: 14px;
  font-weight: 600;
}
.mk-studio .template-card p,
.mk-studio .template-card small {
  margin: 0;
  color: var(--flow-muted);
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.mk-studio .template-card p {
  font-size: 12px;
}
.mk-studio .template-card small {
  font-size: 11px;
}
.mk-studio .template-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 4px;
}
.mk-studio .template-create-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  grid-column: 1 / -1;
}

/* Form primitives (Meikapen equivalents of Gazelle .field/.input/.select/.textarea) */
.mk-studio .flow-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}
.mk-studio .flow-field {
  display: grid;
  gap: 5px;
  min-width: 0;
}
.mk-studio .flow-field > span {
  color: var(--flow-muted);
  font-size: 11px;
  font-weight: 600;
}
.mk-studio .flow-field small {
  color: var(--flow-muted);
  font-size: 10px;
  line-height: 1.4;
}
.mk-studio .flow-wide {
  grid-column: 1 / -1;
}
.mk-studio .flow-input,
.mk-studio .flow-select,
.mk-studio .flow-textarea {
  width: 100%;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--flow-line);
  border-radius: var(--radius-control, 10px);
  color: var(--text-primary);
  background: var(--background);
  font-size: 13px;
  outline: none;
  transition: border-color var(--motion, 180ms) ease;
}
.mk-studio .flow-input:focus,
.mk-studio .flow-select:focus,
.mk-studio .flow-textarea:focus {
  border-color: var(--flow-teal);
}
.mk-studio .flow-textarea {
  min-height: 72px;
  resize: vertical;
  line-height: 1.5;
}
.mk-studio .flow-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}
.mk-studio .flow-badge-ok {
  color: var(--success);
  background: var(--success-soft);
}
.mk-studio .flow-badge-warn {
  color: var(--warning);
  background: var(--warning-soft);
}
.mk-studio .flow-badge-off {
  color: var(--text-secondary);
  background: var(--surface-secondary);
}
.mk-studio .flow-badge-bad {
  color: var(--danger);
  background: var(--danger-soft);
}
.mk-studio .flow-empty {
  display: grid;
  gap: 6px;
  padding: 40px 20px;
  border: 1px dashed var(--flow-line);
  border-radius: var(--radius-card, 12px);
  text-align: center;
}
.mk-studio .flow-empty strong {
  font-size: 14px;
  font-weight: 600;
}
.mk-studio .flow-empty span {
  color: var(--flow-muted);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .mk-studio .template-grid,
  .mk-studio .flow-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .mk-studio .template-grid,
  .mk-studio .flow-form-grid,
  .mk-studio .flow-controls {
    grid-template-columns: 1fr;
  }
  .mk-studio .flow-designer-topbar {
    grid-template-columns: 1fr;
    justify-items: start;
  }
  .mk-studio .flow-node {
    grid-template-columns: 36px minmax(0, 1fr);
  }
  .mk-studio .flow-node-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

```


===== FILE: apps/web/src/lib/journeys.ts =====
```
import { apiFetch } from "@/lib/api";

export type JourneyChannel = "email" | "whatsapp" | "sms" | "api";
export type JourneyStatus = "draft" | "active" | "paused" | "archived";

/** Row shape returned by the shared runtime (contact_journey_steps). */
export type JourneyStep = {
  id: string;
  journey_id: string;
  step_order: number;
  delay_minutes: number;
  business_day_offset: number | null;
  channel: JourneyChannel;
  template_name: string | null;
  brevo_template_id: string | null;
  subject_en: string | null;
  subject_es: string | null;
  message_en: string | null;
  message_es: string | null;
  api_url: string | null;
  api_method: string | null;
  api_headers_json: string | null;
  created_at: string;
};

/** Row shape returned by GET /api/journeys (contact_journeys + aggregates). */
export type Journey = {
  id: string;
  company_id: string;
  list_id: string;
  test_id: string;
  created_by_user_id: string;
  name: string;
  status: JourneyStatus;
  locale: string;
  goal_event: string | null;
  stop_on_reply: number | null;
  stop_events_json: string | null;
  created_at: string;
  updated_at: string;
  list_name: string | null;
  company_name: string | null;
  test_name_en: string | null;
  test_name_es: string | null;
  created_by_name: string | null;
  step_count: number;
  list_member_count: number;
  enrollment_count: number;
  completed_count: number;
  active_enrollment_count: number;
  touched_candidate_count: number;
  contacted_candidate_count: number;
  failed_candidate_count: number;
  assessment_completed_count: number;
  queued_event_count: number;
  accepted_event_count: number;
  skipped_event_count: number;
  failed_event_count: number;
  steps: JourneyStep[];
};

export type JourneyStepInput = {
  channel: JourneyChannel;
  delayHours?: number;
  businessDayOffset?: number | null;
  templateName?: string;
  brevoTemplateId?: string;
  subjectEn?: string;
  subjectEs?: string;
  messageEn?: string;
  messageEs?: string;
  apiUrl?: string;
  apiMethod?: "POST" | "PUT" | "PATCH";
  apiHeadersJson?: string;
};

export type CreateJourneyPayload = {
  name: string;
  listId: string;
  testId: string;
  locale?: "es" | "en";
  status?: "draft" | "active";
  steps: JourneyStepInput[];
};

export function listJourneys() {
  return apiFetch<{ journeys: Journey[] }>("/api/journeys");
}

export function createJourney(payload: CreateJourneyPayload) {
  return apiFetch<{ journeyId: string; journeys: Journey[] }>("/api/journeys", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateJourneyStatus(id: string, status: JourneyStatus) {
  return apiFetch<{ journeys: Journey[] }>(
    `/api/journeys/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

```


===== FILE: apps/web/src/lib/templates.ts =====
```
import { apiFetch } from "@/lib/api";

export type TemplateChannel = "email" | "whatsapp" | "sms";
export type TemplateProvider = "brevo" | "infobip" | "custom";
export type TemplateStatus =
  | "draft"
  | "approved"
  | "active"
  | "paused"
  | "rejected"
  | "archived";

/** Row shape returned by GET /api/templates (message_templates). */
export type MessageTemplate = {
  id: string;
  company_id: string;
  channel: TemplateChannel;
  provider: TemplateProvider;
  name: string;
  provider_template_name: string | null;
  provider_template_id: string | null;
  language: string;
  status: TemplateStatus;
  subject_en: string | null;
  subject_es: string | null;
  message_en: string;
  message_es: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  company_name: string | null;
  created_by_name: string | null;
};

export type CreateTemplatePayload = {
  channel: TemplateChannel;
  name: string;
  messageEn: string;
  messageEs: string;
  provider?: TemplateProvider;
  language?: "es" | "en";
  status?: TemplateStatus;
  providerTemplateName?: string;
  providerTemplateId?: string;
  subjectEn?: string;
  subjectEs?: string;
  companyId?: string;
};

export function listTemplates() {
  return apiFetch<{ templates: MessageTemplate[] }>("/api/templates");
}

export function createTemplate(payload: CreateTemplatePayload) {
  return apiFetch<{ templateId: string; templates: MessageTemplate[] }>(
    "/api/templates",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateTemplateStatus(id: string, status: TemplateStatus) {
  return apiFetch<{ templates: MessageTemplate[] }>(
    `/api/templates/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

```


===== FILE: apps/web/src/lib/recupera.ts =====
```
import { apiFetch } from "@/lib/api";
import type { Journey } from "@/lib/journeys";
import type { MessageTemplate } from "@/lib/templates";

export type StrategyKey = "AMABLE" | "EQUILIBRADA" | "FIRME";

export type RecuperaInstallation = {
  id: string;
  companyId: string;
  playbookKey: string;
  playbookVersion: string;
  status: string;
  config?: {
    strategyKey?: StrategyKey;
    debtType?: string | null;
    channels?: Record<string, boolean>;
    onboardingCompletedAt?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type RecuperaObligation = {
  id: string;
  payerName: string;
  payerEmail: string | null;
  payerPhone: string | null;
  reference: string | null;
  amountCents: number;
  balanceCents: number;
  currency: string;
  dueDate: string;
  stageKey: string;
  status: string;
  subjectCandidateId?: string | null;
};

export type ObligationInput = {
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  reference?: string;
  description?: string;
  amountCents: number;
  balanceCents?: number;
  dueDate: string;
  currency?: string;
};

export type InstallRecuperaOptions = {
  strategyKey?: StrategyKey;
  debtType?: string | null;
  channels?: Record<string, boolean>;
};

export type ImportObligationsOptions = {
  obligations?: ObligationInput[];
  csv?: string;
  autoActivate?: boolean;
  strategyKey?: StrategyKey;
};

export type ImportObligationsResult = {
  imported: RecuperaObligation[];
  activationErrors?: Array<{ obligationId: string; code: string }>;
};

export function installRecupera(options: InstallRecuperaOptions = {}) {
  return apiFetch<{ installation: RecuperaInstallation }>(
    "/api/recupera/install",
    { method: "POST", body: JSON.stringify(options) },
  );
}

export function getInstallation() {
  return apiFetch<{ installation: RecuperaInstallation }>(
    "/api/recupera/installation",
  );
}

export function listObligations() {
  return apiFetch<{ obligations: RecuperaObligation[] }>(
    "/api/recupera/obligations",
  );
}

export function importObligations(
  obligationsOrOptions: ObligationInput[] | ImportObligationsOptions,
  options?: { autoActivate?: boolean },
) {
  const body =
    Array.isArray(obligationsOrOptions)
      ? { obligations: obligationsOrOptions, autoActivate: options?.autoActivate }
      : obligationsOrOptions;
  return apiFetch<ImportObligationsResult>("/api/recupera/obligations/import", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ActivateObligationResult = {
  obligation: RecuperaObligation;
  candidateId: string;
  journeyId: string;
  enrollmentId: string;
  alreadyActive?: boolean;
};

export function activateObligation(obligationId: string) {
  return apiFetch<ActivateObligationResult>(
    `/api/recupera/obligations/${encodeURIComponent(obligationId)}/activate`,
    { method: "POST", body: "{}" },
  );
}

export function markObligationPaid(obligationId: string) {
  return apiFetch<{ obligation: RecuperaObligation; paymentId: string }>(
    `/api/recupera/obligations/${encodeURIComponent(obligationId)}/mark-paid`,
    { method: "POST", body: "{}" },
  );
}

export function createObligationPortalLink(obligationId: string) {
  return apiFetch<{ url: string; expiresAt: string }>(
    `/api/recupera/obligations/${encodeURIComponent(obligationId)}/portal-link`,
    { method: "POST", body: "{}" },
  );
}

export type RocioClassification = {
  intent: string;
  promiseDate: string | null;
  confidence: number;
  needsHuman: boolean;
  suggestedAction: string | null;
};

export function classifyRocioIntent(text: string, obligationId?: string) {
  return apiFetch<{ classification: RocioClassification; obligationId: string | null }>(
    "/api/recupera/rocio/classify",
    {
      method: "POST",
      body: JSON.stringify({ text, obligationId }),
    },
  );
}

export type InboundMessageResult = {
  jobId: string;
  status: string;
  classification: RocioClassification;
  applied: boolean;
  obligation: RecuperaObligation;
};

export function simulateInboundMessage(obligationId: string, text: string) {
  return apiFetch<InboundMessageResult>(
    `/api/recupera/obligations/${encodeURIComponent(obligationId)}/inbound-message`,
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  );
}

export type RecuperaExceptionType =
  | "broken_promise"
  | "dispute"
  | "pending_payment"
  | "needs_human"
  | "aging";

export type RecuperaExceptionItem = {
  id: string;
  type: RecuperaExceptionType;
  obligationId: string;
  title: string;
  subtitle: string;
  amountCents: number;
  currency: string;
  createdAt: string;
};

export type RecuperaExceptionsResult = {
  summary: {
    brokenPromises: number;
    disputes: number;
    pendingPayments: number;
    needsHuman: number;
    total: number;
  };
  items: RecuperaExceptionItem[];
};

export type RecuperaInsights = {
  pendingCents: number;
  recoveredCentsThisMonth: number;
  openObligations: number;
  activePromises: number;
  brokenPromises: number;
  disputesOpen: number;
  aging: Array<{ stageKey: string; cents: number; count: number }>;
  rocio: { jobsToday: number; needsHuman: number };
};

export function getInsights() {
  return apiFetch<RecuperaInsights>("/api/recupera/insights");
}

export function listExceptions() {
  return apiFetch<RecuperaExceptionsResult>("/api/recupera/exceptions");
}

export function resolveException(
  type: RecuperaExceptionType,
  id: string,
  resolution: "dismiss" | "confirm_paid" | "break_promise",
) {
  return apiFetch<{ ok: true; obligationId: string }>(
    `/api/recupera/exceptions/${encodeURIComponent(type)}/${encodeURIComponent(id)}/resolve`,
    { method: "POST", body: JSON.stringify({ resolution }) },
  );
}

export type RecuperaStudio = {
  /** Recupera contact list + bridge test every stage flow is bound to. */
  listId: string;
  testId: string;
  journeys: Journey[];
  templates: MessageTemplate[];
};

/** Seeds the default Recupera flows if missing and returns flows + templates for the studio. */
export function getRecuperaStudio() {
  return apiFetch<RecuperaStudio>("/api/recupera/studio");
}

```


===== FILE: apps/worker/src/legacy/styles.css (EXTRACT: flow/journey/funnel) =====
```
.journey-backdrop { align-items: flex-start; overflow-y: auto; padding: 28px; }

.journey-modal { width: min(920px, 100%); max-height: none; }

.journey-modal .modal-header p:not(.eyebrow) { margin: 5px 0 0; color: var(--muted); font-size: 12px; }

.journey-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-bottom: 1px solid var(--line); background: #f7f9f9; }

.journey-summary > div { min-width: 0; padding: 14px 20px; border-right: 1px solid var(--line); }

.journey-summary > div:last-child { border-right: 0; }

.journey-summary span, .journey-summary strong { display: block; }

.journey-summary span { color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }

.journey-summary strong { margin-top: 5px; font-size: 13px; overflow-wrap: anywhere; }

.journey-body { padding: 0 !important; }

.journey-body > section { padding: 24px; border-bottom: 1px solid var(--line); }

.journey-body > section:last-child { border-bottom: 0; }

.journey-section-title { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }

.journey-section-title h3, .journey-section-title p { margin: 0; }

.journey-section-title h3 { font-size: 16px; }

.journey-section-title p { margin-top: 4px; color: var(--muted); font-size: 12px; line-height: 1.5; }

.journey-section-title > svg { width: 19px; height: 19px; color: var(--teal); }

.journey-builder code { padding: 2px 5px; border-radius: 4px; background: #eef3f2; font-size: 11px; }

.journey-step-grid { display: block; }

.flow-designer { overflow: hidden; border: 1px solid #d7e0df; border-radius: 8px; background: #fff; box-shadow: 0 18px 40px rgba(25, 35, 40, .08); }

.flow-designer-topbar { min-height: 58px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding: 10px 16px; border-bottom: 1px solid var(--line); background: #fff; }

.flow-designer-title, .flow-designer-actions { display: flex; align-items: center; gap: 10px; }

.flow-designer-title strong { font-size: 15px; }

.flow-designer-actions { justify-content: flex-end; }

.flow-tabs { display: inline-flex; align-items: center; gap: 18px; justify-self: center; height: 100%; }

.flow-tabs span { height: 58px; display: inline-flex; align-items: center; gap: 6px; border-bottom: 2px solid transparent; color: var(--muted); font-size: 12px; font-weight: 850; }

.flow-tabs span svg { width: 14px; height: 14px; }

.flow-tabs span.active { border-color: #2784d9; color: #1d74c3; }

.flow-canvas { position: relative; display: grid; justify-items: center; gap: 0; min-height: 760px; padding: 46px 18px; border: 0; border-radius: 0; background-color: #fbfcfd; background-image: radial-gradient(#d8e0e5 1px, transparent 1px); background-size: 10px 10px; }

.flow-canvas::before { content: ""; position: absolute; top: 86px; bottom: 100px; left: 50%; width: 2px; transform: translateX(-50%); background: linear-gradient(#9aa8ad 50%, transparent 0) 0 0 / 2px 16px repeat-y; opacity: .75; }

.flow-node { position: relative; z-index: 1; width: min(100%, 360px); min-height: 78px; display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 15px 14px; border: 1px solid #d6dee4; border-radius: 4px; background: #fff; box-shadow: 0 8px 18px rgba(22, 34, 42, .09); box-sizing: border-box; }

.flow-node.flow-trigger {
  width: 74px;
  height: 74px;
  min-width: 74px;
  max-width: 74px;
  min-height: 74px;
  max-height: 74px;
  aspect-ratio: 1 / 1;
  padding: 0;
  gap: 0;
  grid-template-columns: 1fr;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #24d3ad;
  box-shadow: 0 10px 24px rgba(36, 211, 173, .28);
  overflow: hidden;
}

.flow-node.flow-goal { border-color: #96d1c4; background: #f6fffc; }

.flow-node.flow-whatsapp { border-left: 8px solid #21a65b; }

.flow-node.flow-sms { border-left: 8px solid #d9971c; }

.flow-node.flow-email { border-left: 8px solid var(--teal); }

.flow-node.flow-api { border-left: 8px solid #4777c4; }

.flow-number { position: absolute; top: -12px; left: 50%; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #10a6cf; transform: translateX(-50%); font-size: 12px; font-weight: 900; box-shadow: 0 0 0 3px #fff; }

.flow-trigger .flow-number { background: #ff625d; }

.flow-goal .flow-number { background: var(--teal); }

.flow-trigger .flow-number, .flow-trigger .flow-node-copy { display: none; }

.flow-icon { width: 42px; height: 42px; display: grid; place-items: center; border: 0; border-radius: 50%; color: #fff; background: var(--teal); font-size: 11px; font-weight: 950; }

.flow-trigger .flow-icon { width: 42px; height: 42px; color: #fff; background: transparent; font-size: 0; }

.flow-trigger .flow-icon::before { content: ""; width: 19px; height: 19px; border-radius: 3px; background: #fff; clip-path: polygon(0 0, 100% 15%, 100% 78%, 58% 65%, 58% 100%, 0 100%); }

.flow-whatsapp .flow-icon { background: #21a65b; }

.flow-sms .flow-icon { background: #d9971c; }

.flow-api .flow-icon { background: #4777c4; }

.flow-node-copy { min-width: 0; }

.flow-node-copy strong, .flow-node-copy span, .flow-node-copy small { display: block; }

.flow-node-copy strong { font-size: 15px; }

.flow-node-copy span { margin-top: 4px; color: #536064; font-size: 12px; line-height: 1.45; }

.flow-node-copy small { margin-top: 5px; color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }

.flow-connector { position: relative; z-index: 2; width: 2px; height: 82px; display: grid; place-items: center; background: transparent; }

.flow-connector span { position: absolute; left: 18px; min-width: max-content; padding: 4px 9px; border: 1px solid #d4dcdb; border-radius: 999px; color: #5d696d; background: #fff; font-size: 11px; font-weight: 800; box-shadow: 0 3px 8px rgba(22, 34, 42, .06); }

.flow-connector.compact { height: 34px; }

.flow-inline-add { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid #cfd8df; border-radius: 50%; color: #17242a; background: #fff; box-shadow: 0 6px 16px rgba(22, 34, 42, .08); cursor: pointer; }

.flow-inline-add:hover { border-color: #2784d9; color: #2784d9; }

.flow-inline-add svg { width: 18px; height: 18px; }

.flow-node-actions { display: flex; gap: 6px; justify-content: flex-end; align-self: start; }

.flow-node-actions .material-action { width: 32px; height: 32px; min-height: 32px; }

.flow-node-actions .material-action:disabled { opacity: .35; cursor: not-allowed; transform: none; box-shadow: none; }

.flow-config { grid-column: 1 / -1; width: 100%; margin-top: 8px; border-top: 1px solid var(--line); }

.flow-config summary { padding: 10px 0 0; color: #276f78; font-size: 12px; font-weight: 900; cursor: pointer; }

.flow-controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding-top: 12px; }

.flow-add-step { margin: 14px 0 0; }

.flow-designer-footer { min-height: 54px; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 18px; border-top: 1px solid var(--line); color: var(--muted); background: #fff; font-size: 12px; }

.journey-step-card { min-width: 0; margin: 0; }

.journey-step-card legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }

.journey-step-card .form-wide { grid-column: 1 / -1; }

.journey-flow-list { display: grid; gap: 18px; padding: 18px; }

.journey-flow-card { display: grid; gap: 15px; padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }

.journey-flow-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }

.journey-flow-head strong, .journey-flow-head span { display: block; }

.journey-flow-head strong { font-size: 15px; }

.journey-flow-head span { margin-top: 4px; color: var(--muted); font-size: 12px; }

.flow-stats { display: flex; flex-wrap: wrap; gap: 7px; }

.flow-stats span { padding: 5px 9px; border-radius: 999px; background: #eef3f2; color: #4d5b5f; font-size: 11px; font-weight: 800; }

.journey-flow-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }

.journey-funnel-section .journey-funnel-head { align-items: center; }

.journey-funnel-section-body { display: none; padding: 0 16px 14px; }
```


===== FILE: apps/worker/src/legacy/app.js (EXTRACT: Gazelle Journeys / flow builder) =====
```
// Gazelle Hunt in-app Journeys — separate product from Recupero Journey Studio
```


---

## 4. Notas finales para Claude

- Copy interno prohibido en UI de cliente final cuando sea posible: subject, journey, enrollment, DPD, playbook (ver docs/spec/copy.md si se menciona).
- Recupero pricing es **mensual** (Q0 / Q30 / Q49). No digas “por caso”.
- No propongas unificar Recupero y Gazelle en una sola app de marketing o un inbox omnichannel genérico.
- Preferir minimalismo tipo Asana (densidad controlada, iconos claros, poca jerga) sin perder el outcome del playbook.

Fin del paquete.
