export type BrandKey = "meikapen" | "recupero" | "gazellehunt";

export type ColumnGroup = {
  title: string;
  items: string[];
};

export type PlaybookCard = {
  title: string;
  body: string;
  href?: string;
  status?: "available" | "soon";
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

export type JourneyStageCopy = {
  label: string;
  title: string;
  bubble?: string;
  channel?: "whatsapp" | "email" | "call" | "system";
};

export type ProofStateCopy = {
  label: string;
  hint: string;
};

export type LandingCopy = {
  brand: BrandKey;
  brandLabel: string;
  documentTitle: string;
  metaDescription: string;
  heroImage?: string;
  heroEyebrow?: string;
  headline: string;
  subcopy: string;
  ctaLabel: string;
  ctaHref: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
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
  journeyStages?: JourneyStageCopy[];
  journeyGoalLabel?: string;
  useCasesHeading?: string;
  useCasesSupporting?: string;
  useCases?: { title: string; body: string }[];
  pricingHeading?: string;
  pricingEyebrow?: string;
  pricingIntro?: string;
  pricingFootnote?: string;
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
  proofHeading?: string;
  proofStates?: ProofStateCopy[];
  proofControlLine?: string;
  proofReverseLine?: string;
  showAboutColumns?: boolean;
  showAuthEntry?: boolean;
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
  documentTitle: "Meikapen — Instala. Activa. Sucede.",
  metaDescription:
    "Playbooks ejecutables para resultados de negocio. Instala un playbook, actívalo y el resultado sucede.",
  headline: "Playbooks que producen resultados.",
  subcopy:
    "Instala un playbook, actívalo sobre tus canales y equipos, y el resultado sucede.",
  ctaLabel: "Ver los playbooks",
  ctaHref: "#playbooks",
  trustLine: "Instala. Activa. Sucede.",
  aboutHeading: "Una plataforma operativa para el trabajo detrás del resultado.",
  aboutBody: [
    "Meikapen coordina acciones, decisiones y seguimiento para producir outcomes — sin obligarte a armar flujos desde cero.",
    "Activas un playbook diseñado para un resultado concreto: cobrar, contratar, o el siguiente.",
  ],
  columns: [
    {
      title: "Para",
      items: ["Operadores", "Equipos de revenue", "Finanzas", "Fundadores"],
    },
    {
      title: "En",
      items: ["Cobranza", "Contratación", "Retención", "Seguimiento"],
    },
    {
      title: "Por",
      items: ["Email", "WhatsApp", "Llamada", "Links de pago"],
    },
    {
      title: "Con",
      items: ["Playbooks", "Agentes", "Reglas", "Supervisión humana"],
    },
  ],
  playbooksHeading: "Playbooks en movimiento",
  playbooks: [
    {
      title: "Recupera",
      body: "Cobranza y recuperación de pagos — con Rocío.",
      href: "/recupero",
      status: "available",
    },
    {
      title: "Gazelle Hunt",
      body: "Evaluaciones de contratación con seguimiento automático.",
      href: "/gazellehunt",
      status: "available",
    },
    {
      title: "Más playbooks",
      body: "Sobre la misma capa operativa.",
      status: "soon",
    },
  ],
  contactHeading: "Cuéntanos el resultado que necesitas operar.",
  navMode: "solutions",
  navLinks: [
    { href: "#playbooks", label: "Playbooks" },
    { href: "#about", label: "Acerca de" },
    { href: "#contact", label: "Contacto" },
  ],
  showAboutColumns: true,
  footerBrand: "Meikapen",
  footerTagline: "Instala. Activa. Sucede.",
  formLocale: "es",
};

export const RECUPERO_COPY: LandingCopy = {
  brand: "recupero",
  brandLabel: "RECUPERA",
  documentTitle: "Recupera — Que te paguen. Sin perseguir a nadie.",
  metaDescription:
    "Recupera recuerda, da seguimiento y facilita el pago por WhatsApp, email y llamada. Empieza gratis. Desde Q30 al mes.",
  headline: "Que te paguen.\nSin perseguir a nadie.",
  subcopy:
    "Recupera recuerda, da seguimiento y facilita el pago por WhatsApp, email y llamada. Tú dices quién debe. Nosotros hacemos el resto.",
  ctaLabel: "Empezar gratis",
  ctaHref: RECUPERO_START_URL,
  ctaSecondaryLabel: "Ver cómo funciona",
  ctaSecondaryHref: "#como",
  heroSecondaryLine: "Gratis para 1 pagador · Q30 al mes sin límite · cancela cuando quieras",
  trustLine: "Cobros por WhatsApp, email y llamada · Guatemala",
  aboutHeading: "Un sistema de recuperación construido para trabajo real.",
  aboutBody: [
    "Recupera ayuda a operadores, propietarios y equipos a gestionar el camino completo desde el recordatorio preventivo hasta la recuperación.",
  ],
  columns: [
    { title: "Para", items: ["Rentas", "Facturas", "Contratos", "Cobros recurrentes"] },
    { title: "Etapas", items: ["Preventivo", "1–7 días", "15–30 días", "Recuperación"] },
    { title: "Canales", items: ["WhatsApp", "Email", "Llamada", "Link de pago"] },
    { title: "Con", items: ["Rocío", "Plantillas", "Reglas", "Escalamiento"] },
  ],
  howHeading: "Tú no deberías tener que cobrar.",
  howSteps: [
    { title: "Dinos quién debe pagar.", body: "Nombre, celular, correo, monto y fecha." },
    { title: "Recupera hace el seguimiento.", body: "Recordatorios, seguimiento y opciones de pago." },
    { title: "Tú ves qué pasó.", body: "Pagó, prometió pagar, necesita ayuda o requiere escalamiento." },
  ],
  journeyHeading: "Cada mensaje llega en el momento exacto.",
  journeyBody: "Antes de vencer, el día de pago y después. Corto, respetuoso y con link de pago.",
  journeyGoalLabel: "Pago recibido",
  journeyStages: [
    { label: "−5 días", title: "Recordar", bubble: "WA: Hola, te recordamos tu pago próximo." },
    { label: "Día de pago", title: "Facilitar", bubble: "Email: Aquí tienes tu link de pago." },
    { label: "+5 días", title: "Seguir", bubble: "WA: ¿Pudiste completar el pago?" },
    { label: "+15 días", title: "Rocío", bubble: "☎ Rocío llama y registra la promesa." },
    { label: "+30 días", title: "Escalar", bubble: "Aviso: este caso necesita una persona." },
  ],
  useCasesHeading: "Empieza con lo que hoy estás persiguiendo.",
  useCasesSupporting:
    "Recupera funciona sobre cualquier obligación con un pagador, un monto y una fecha. Para rentas, facturas, contratos y cobros recurrentes — con WhatsApp, email, llamada y link de pago.",
  useCases: [
    { title: "Rentas", body: "Para propietarios que no quieren cobrar todos los meses." },
    { title: "Facturas", body: "Para negocios que venden y luego tienen que perseguir el pago." },
    { title: "Servicios", body: "Para contratos, cuotas y cobros recurrentes." },
  ],
  pricingHeading: "Un precio al mes.\nNingún cobro por caso.",
  pricingEyebrow: "Precios mensuales",
  pricingIntro: "Elige el plan que se ajusta a tu operación. Pagas mes a mes. Sin permanencia.",
  pricingFootnote: "* Dentro de uso razonable de operación. Cartera grande → Portafolio o Empresa.",
  pricingPlans: [
    {
      name: "Probar",
      price: "Q0",
      priceNote: "gratis · 1 pagador",
      features: [
        "1 recordatorio al mes",
        "1 pagador activo",
        "portal del pagador",
        'confirmación de "ya pagué"',
        "ideal para validar el flujo",
      ],
      ctaLabel: "Empezar gratis",
      ctaHref: RECUPERO_START_URL,
    },
    {
      name: "Recupera",
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
      ctaLabel: "Activar Recupera",
      ctaHref: RECUPERO_START_URL,
    },
    {
      name: "Recupera+",
      price: "Q49",
      priceNote: "/ mes · Incluye Rocío",
      features: [
        "todo lo de Recupera",
        "Rocío (seguimiento activo)",
        "promesa de pago",
        "seguimiento de promesa",
        "escalamiento humano",
        "más contactos por caso",
      ],
      ctaLabel: "Activar Recupera+",
      ctaHref: RECUPERO_START_URL,
    },
  ],
  pricingMonthlyHeading: "¿Cobras a decenas cada mes?",
  pricingMonthly: [
    { title: "Portafolio", price: "desde Q199 / mes" },
    { title: "Empresa", price: "a medida" },
  ],
  pricingMonthlyCtaLabel: "Hablar de volumen",
  pricingMonthlyCtaHref: "#contacto",
  featureHeading: "Cuando un mensaje no basta, entra Rocío.",
  featureBody: [
    "Rocío es la operadora de recuperación de Recupera.",
    "Da seguimiento, registra promesas, reenvía opciones de pago y mantiene el caso en movimiento dentro de las reglas que tú definas.",
  ],
  featurePoints: ["Llama.", "Escucha.", "Registra la promesa.", "Te avisa si hay que escalar."],
  featureCtaLabel: "Ver precios",
  featureCtaHref: "#precios",
  proofHeading: "Lo que verás cada día",
  proofStates: [
    { label: "Pagó", hint: "Confirmado en el portal o por ti" },
    { label: "Prometió pagar", hint: "Fecha y canal registrados" },
    { label: "Necesita ayuda", hint: "Requiere atención humana" },
    { label: "Escalado", hint: "Sale del flujo automático" },
  ],
  proofControlLine: "Tú defines el tono, los horarios y cuándo entra una persona.",
  proofReverseLine: "Sin contrato. Pausa o cancela desde tu cuenta.",
  showAboutColumns: false,
  showAuthEntry: false,
  splitStartHeading: "¿Hay alguien a quien no quieres volver a cobrar?",
  splitStartLine: "Empieza gratis. Sube cuando tengas más de un pagador.",
  splitStartCtaLabel: "Empezar gratis",
  splitStartHref: RECUPERO_START_URL,
  splitContactHeading: "¿Cartera, empresa o volumen?",
  splitContactLine: "Cuéntanos y te respondemos en un día hábil.",
  contactHeading: "¿Cartera, empresa o volumen?",
  contactNoteLabel: "Nota opcional / volumen",
  navMode: "platform",
  navLinks: [
    { href: "#como", label: "Cómo funciona" },
    { href: "#precios", label: "Precios" },
  ],
  footerBrand: "Recupera",
  footerTagline: "Recupera · by Meikapen",
  footerLinks: [
    { href: "#cuenta", label: "Cuenta" },
    { href: RECUPERO_LOGIN_URL, label: "Iniciar sesión" },
    { href: "/", label: "Meikapen" },
  ],
  formLocale: "es",
  authLoginLabel: "Iniciar sesión",
  authLoginHref: RECUPERO_LOGIN_URL,
  authSignupLabel: "Empezar gratis",
  authSignupHref: RECUPERO_SIGNUP_URL,
};

export const GAZELLEHUNT_COPY: LandingCopy = {
  brand: "gazellehunt",
  brandLabel: "GAZELLE HUNT",
  documentTitle: "Gazelle Hunt — Contrata a quien sí rinde.",
  metaDescription:
    "Gazelle Hunt envía la evaluación, recuerda a cada persona por email y WhatsApp, y te muestra quién completó y cómo le fue.",
  headline: "Contrata a quien sí rinde.\nSin perseguir candidatos.",
  subcopy:
    "Gazelle Hunt envía la evaluación, recuerda a cada persona por email y WhatsApp y te muestra quién completó y cómo le fue.",
  ctaLabel: "Crear cuenta",
  ctaHref: GAZELLE_SIGNUP_URL,
  ctaSecondaryLabel: "Ver cómo funciona",
  ctaSecondaryHref: "#como",
  heroSecondaryLine: "Gratis para 1 lista · Q99 al mes · cancela cuando quieras",
  trustLine: "Evaluaciones por email y WhatsApp · Guatemala y LatAm",
  aboutHeading: "Evaluaciones con seguimiento que no depende de tu reclutador.",
  aboutBody: [
    "Gazelle Hunt estructura el envío, el seguimiento y la lectura de resultados para que tu equipo vea quién completó y cómo le fue.",
  ],
  columns: [
    { title: "Para", items: ["TA / recruiting", "BPO", "Roles técnicos", "Volumen"] },
    { title: "En", items: ["Invitación", "Recordatorios", "Compleción", "Reportes"] },
    { title: "Por", items: ["Email", "WhatsApp", "Portal", "PDF"] },
    { title: "Con", items: ["Cohortes", "Evaluaciones", "Seguimiento", "Calibración"] },
  ],
  howHeading: "Tú no deberías tener que perseguir a nadie.",
  howSteps: [
    { title: "Elige la evaluación.", body: "Elige la evaluación para el rol." },
    { title: "Carga tu lista.", body: "Importa o agrega personas a una lista." },
    { title: "Gazelle da seguimiento.", body: "Recordatorios por email y WhatsApp hasta que complete." },
  ],
  journeyHeading: "Cada recordatorio llega a tiempo.",
  journeyBody: "Invitación, recordatorio y último aviso — hasta que complete o se detenga el seguimiento.",
  journeyGoalLabel: "Evaluación completada",
  journeyStages: [
    { label: "Día 0", title: "Invitación", bubble: "Email: Tu evaluación está lista." },
    { label: "Día 1", title: "Recordatorio", bubble: "WA: ¿Pudiste empezar tu evaluación?" },
    { label: "Día 3", title: "Último aviso", bubble: "Email: Último recordatorio amable." },
    { label: "Día 3+", title: "Completado", bubble: "Reporte listo para tu equipo." },
  ],
  featureHeading: "Seguimiento que no depende de tu reclutador.",
  featureBody: [
    "Los recordatorios corren solos por email y WhatsApp. Tú ves el progreso por lista y los resultados cuando alguien completa.",
  ],
  featurePoints: ["Multicanal", "Automático", "Con progreso por lista"],
  featureCtaLabel: "Ver precios",
  featureCtaHref: "#precios",
  useCasesHeading: "Empieza con lo que hoy estás reclutando.",
  useCasesSupporting: "Volumen, roles técnicos o BPO — misma evaluación, mismo seguimiento.",
  useCases: [
    { title: "Reclutamiento en volumen", body: "Envía a cientos sin perseguir uno por uno." },
    { title: "Roles técnicos", body: "Evalúa antes de la entrevista, no después." },
    { title: "BPO / contact center", body: "Listas por cohorte con progreso visible." },
  ],
  pricingHeading: "Planes mensuales.\nPara equipos que contratan cada semana.",
  pricingEyebrow: "Precios mensuales",
  pricingIntro: "Elige el plan que se ajusta a tu operación. Pagas mes a mes. Sin permanencia.",
  pricingPlans: [
    {
      name: "Probar",
      price: "Q0",
      priceNote: "gratis · para validar",
      features: ["1 lista", "1 evaluación", "envío por email", "resultados básicos"],
      ctaLabel: "Crear cuenta",
      ctaHref: GAZELLE_SIGNUP_URL,
    },
    {
      name: "Gazelle",
      price: "Q99",
      priceNote: "/ mes",
      badge: "Más elegido",
      featured: true,
      features: [
        "listas y envíos",
        "email + WhatsApp",
        "progreso por lista",
        "reportes PDF",
        "cancela cuando quieras",
      ],
      ctaLabel: "Crear cuenta",
      ctaHref: GAZELLE_SIGNUP_URL,
    },
    {
      name: "Gazelle+",
      price: "Q199",
      priceNote: "/ mes · equipos",
      features: [
        "todo lo de Gazelle",
        "calibración de outcomes",
        "usuarios de equipo",
        "soporte prioritario",
      ],
      ctaLabel: "Crear cuenta",
      ctaHref: GAZELLE_SIGNUP_URL,
    },
  ],
  pricingMonthlyHeading: "¿Contratas en volumen?",
  pricingMonthly: [{ title: "Empresa", price: "a medida" }],
  pricingMonthlyCtaLabel: "Hablar con nosotros",
  pricingMonthlyCtaHref: "#contacto",
  proofHeading: "Tú ves quién completó y cómo le fue",
  proofStates: [
    { label: "Invitado", hint: "Invitación enviada" },
    { label: "En progreso", hint: "Abrió o empezó la evaluación" },
    { label: "Completado", hint: "Resultado listo para revisar" },
    { label: "Sin respuesta", hint: "Recordatorios agotados" },
  ],
  proofControlLine: "Tú defines evaluaciones, listas e idioma. El seguimiento corre solo.",
  proofReverseLine: "Sin contrato. Pausa o cancela desde tu cuenta.",
  showAboutColumns: false,
  showAuthEntry: false,
  splitStartHeading: "¿Listo para dejar de perseguir evaluaciones?",
  splitStartLine: "Crea tu cuenta y envía la primera hoy.",
  splitStartCtaLabel: "Crear cuenta",
  splitStartHref: GAZELLE_SIGNUP_URL,
  splitContactHeading: "¿Contratas en volumen?",
  splitContactLine: "Cuéntanos y te respondemos en un día hábil.",
  contactHeading: "¿Contratas en volumen?",
  contactNoteLabel: "Nota opcional / volumen",
  navMode: "platform",
  navLinks: [
    { href: "#como", label: "Cómo funciona" },
    { href: "#precios", label: "Precios" },
  ],
  footerBrand: "Gazelle Hunt",
  footerTagline: "Gazelle Hunt · by Meikapen",
  footerLinks: [
    { href: "#cuenta", label: "Cuenta" },
    { href: GAZELLE_LOGIN_URL, label: "Iniciar sesión" },
    { href: "/", label: "Meikapen" },
  ],
  formLocale: "es",
  authLoginLabel: "Iniciar sesión",
  authLoginHref: GAZELLE_LOGIN_URL,
  authSignupLabel: "Crear cuenta",
  authSignupHref: GAZELLE_SIGNUP_URL,
};

export function copyForPath(pathname: string): LandingCopy {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/recupero" || path === "/recupera") return RECUPERO_COPY;
  if (path === "/gazellehunt") return GAZELLEHUNT_COPY;
  return MEIKAPEN_COPY;
}
