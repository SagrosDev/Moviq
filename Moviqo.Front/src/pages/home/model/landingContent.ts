export type LandingLocale = "es" | "en";

export type LandingMetadata = {
  title: string;
  description: string;
  canonical: string;
  locale: "es_CO" | "en_US";
  alternate: { hrefLang: LandingLocale; href: string };
};

export type LandingMeasurementEvent =
  | "page_view"
  | "language_selected"
  | "use_case_engagement"
  | "start_free_beta"
  | "sign_in"
  | "registration_start"
  | "registration_completion";

export type LandingMeasurementPayload = {
  event: LandingMeasurementEvent;
  locale: LandingLocale;
  referrerClass: "direct" | "internal" | "external";
  campaignClass: "campaign-present" | "none";
  deviceClass: "mobile" | "tablet" | "desktop" | "unknown";
  performanceClass: "fast" | "expected" | "slow" | "unknown";
};

// No approved consent provider or measurement policy is configured in this repository.
// Keeping this disabled is the privacy-safe behavior; the typed payload is ready for a future approved adapter.
export const landingMeasurementEnabled = false;

type LandingMeasurementInput = {
  [key: string]: unknown;
  event: LandingMeasurementEvent;
  locale: string;
  referrer?: string;
  campaign?: string;
  device?: string;
  performance?: string;
};

type LandingScenario = {
  label: string;
  name: string;
  description: string;
  details: string[];
  alt: string;
};

type LandingCopy = {
  hero: { eyebrow: string; title: string; body: string; capabilities: string; primary: string; secondary: string };
  nav: { story: string; examples: string; trust: string };
  examples: { eyebrow: string; title: string };
  problem: { eyebrow: string; title: string; body: string };
  howItWorks: { eyebrow: string; title: string; steps: Array<{ title: string; body: string }> };
  scenarios: LandingScenario[];
  visuals: { eyebrow: string; title: string; form: string; task: string; timeline: string; alt: string };
  trust: { eyebrow: string; title: string; body: string; items: string[] };
  beta: { eyebrow: string; title: string; body: string; links: string[]; support: string };
  timeToValue: string;
  final: { title: string; body: string; primary: string; secondary: string };
  footer: { rights: string };
};

export const landingDestinations = {
  register: "/register",
  signIn: "/sign-in",
  betaTerms: "/legal/beta-terms.html",
  privacy: "/legal/privacy-notice.html",
  prohibitedData: "/legal/prohibited-data.html",
  support: "mailto:beta-support@mymoviqo.com"
} as const;

const landingMetadataCopy: Record<LandingLocale, Pick<LandingMetadata, "title" | "description">> = {
  es: {
    title: "Moviqo · Procesos claros",
    description: "Moviqo ayuda a equipos a convertir procesos repetibles en trabajo claro."
  },
  en: {
    title: "Moviqo · Clear processes",
    description: "Moviqo helps teams turn repeatable processes into clear work."
  }
};

export const resolveLandingMetadata = (language: LandingLocale, origin: string): LandingMetadata => {
  let canonical = "https://moviqo.invalid/";
  try {
    const safeOrigin = new URL(origin);
    canonical = new URL("/", safeOrigin.origin).toString();
  } catch {
    // The invalid origin is a safe non-production fallback for server-side rendering/tests.
  }

  const localePath = language === "en" ? "/en/" : "/es/";
  const localizedCanonical = new URL(localePath, canonical).toString();

  return {
    ...landingMetadataCopy[language],
    canonical: localizedCanonical,
    locale: language === "es" ? "es_CO" : "en_US",
    alternate: {
      hrefLang: language === "es" ? "en" : "es",
      href: new URL(language === "es" ? "/en/" : "/es/", canonical).toString()
    }
  };
};

const unsafeLandingClaims = /guaranteed|customer savings|ahorros de clientes|testimonial|testimonio|certified|certificado|interfaz bilingüe|interfaz (?:está|esta) disponible en español e inglés|bilingual interface|interface is available in Spanish and English/i;

export const validateLandingContent = (content: Record<LandingLocale, LandingCopy>): string[] => {
  const errors: string[] = [];
  for (const locale of ["es", "en"] as const) {
    const value = content[locale];
    if (!value) {
      errors.push(`missing locale: ${locale}`);
      continue;
    }
    const requiredText = [
      value.hero.eyebrow,
      value.hero.title,
      value.hero.body,
      value.hero.capabilities,
      value.hero.primary,
      value.hero.secondary,
      value.nav.story,
      value.nav.examples,
      value.nav.trust,
      value.examples.title,
      value.problem.title,
      value.problem.body,
      value.visuals.alt,
      value.trust.body,
      value.beta.title,
      value.beta.body,
      value.timeToValue,
      value.final.title,
      value.final.body,
      value.final.primary,
      value.final.secondary,
      value.footer.rights
    ];
    if (requiredText.some((item) => !item.trim()) || value.scenarios.length !== 3 || value.howItWorks.steps.length !== 3) {
      errors.push(`required sections incomplete: ${locale}`);
    }
    if (value.beta.links.length !== 3 || value.beta.links.some((item) => !item.trim()) || !value.beta.support.trim()) {
      errors.push(`legal/support links incomplete: ${locale}`);
    }
    if (unsafeLandingClaims.test(JSON.stringify(value))) {
      errors.push(`unsafe claim: ${locale}`);
    }
  }
  return errors;
};

const normalizeMeasurementLocale = (locale: string): LandingLocale => locale.toLowerCase().startsWith("en") ? "en" : "es";
const normalizeBucket = <T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T => {
  return allowed.includes(value as T) ? value as T : fallback;
};

export const createLandingMeasurementPayload = (input: LandingMeasurementInput): LandingMeasurementPayload => {
  let referrerClass: LandingMeasurementPayload["referrerClass"] = "direct";
  if (input.referrer) {
    try {
      referrerClass = new URL(input.referrer).origin === "https://moviqo.invalid" ? "internal" : "external";
    } catch {
      referrerClass = "external";
    }
  }
  return {
    event: input.event,
    locale: normalizeMeasurementLocale(input.locale),
    referrerClass,
    campaignClass: input.campaign ? "campaign-present" : "none",
    deviceClass: normalizeBucket(input.device, ["mobile", "tablet", "desktop"] as const, "unknown"),
    performanceClass: normalizeBucket(input.performance, ["fast", "expected", "slow"] as const, "unknown")
  };
};

export const landingContent: Record<LandingLocale, LandingCopy> = {
  es: {
    hero: {
      eyebrow: "Beta gratuita limitada",
      title: "Convierte procesos repetibles en trabajo claro.",
      body: "Moviqo ayuda a equipos pequeños a diseñar formularios y recorridos de trabajo que los equipos pueden seguir.",
      capabilities: "Formularios, campos de proceso, cálculos, adjuntos, tareas, asignación a miembros o equipos, condiciones visuales, rutas, seguimiento y auditoría.",
      primary: "Iniciar beta gratuita",
      secondary: "Ingresar"
    },
    nav: { story: "Cómo funciona", examples: "Ejemplos", trust: "Beta y confianza" },
    examples: { eyebrow: "Ejemplos seguros", title: "Tres casos ficticios para imaginar el recorrido." },
    problem: {
      eyebrow: "Menos trabajo perdido",
      title: "De solicitudes dispersas a un recorrido visible.",
      body: "Define qué información necesitas, quién revisa cada tarea y qué evidencia queda al avanzar. El equipo ve el estado sin depender de conversaciones aisladas."
    },
    howItWorks: {
      eyebrow: "Cómo funciona",
      title: "Un camino sencillo para publicar un caso simple.",
      steps: [
        { title: "1. Define", body: "Crea un formulario con campos de proceso, cálculos y adjuntos relevantes." },
        { title: "2. Coordina", body: "Conecta tareas, miembros o equipos, condiciones visuales y rutas claras." },
        { title: "3. Da seguimiento", body: "Consulta estados, actividad y auditoría para saber qué ocurrió." }
      ]
    },
    scenarios: [
      { label: "Muestra ficticia · compra", name: "Solicitud de compra", description: "La distribuidora ficticia Norte Claro registra la compra de 12 teclados por 840 EUR.", details: ["Formulario: solicitud de compra", "Tarea: Ana Ruiz · revisión de compras", "Estado: en revisión", "Adjunto: comprobante-demo.pdf"], alt: "Vista de muestra ficticia de una solicitud de compra con formulario, tarea y adjunto demo" },
      { label: "Demo ficticia · documentos", name: "Revisión documental", description: "La empresa ficticia Servicios Lumen recibe el contrato CL-204 y asigna su revisión a Mateo Sol.", details: ["Formulario: ingreso documental", "Tarea: Mateo Sol · validar documento", "Estado: listo para revisar", "Adjunto: documento-muestra.pdf"], alt: "Vista de demo ficticia de revisión documental con tarea, estado y adjunto de muestra" },
      { label: "Muestra ficticia · mantenimiento", name: "Solicitud de servicio", description: "La empresa ficticia Mantenimiento Brisa registra una visita en la sede Centro con prioridad media.", details: ["Formulario: solicitud de mantenimiento", "Tarea: equipo técnico · evaluar servicio", "Estado: programable", "Adjunto: referencia-demo.jpg"], alt: "Vista de muestra ficticia de una solicitud de mantenimiento con prioridad y adjunto demo" }
    ],
    visuals: { eyebrow: "Una vista representativa", title: "La información importante permanece a la vista.", form: "Formulario de proceso", task: "Tarea asignada al equipo", timeline: "Seguimiento y auditoría", alt: "Composición visual de formulario, tarea y seguimiento de un proceso ficticio" },
    trust: { eyebrow: "Confianza y límites", title: "Una beta limitada, con expectativas claras.", body: "Moviqo está en beta gratuita limitada. Usa datos ficticios durante la evaluación y revisa la documentación vigente antes de registrarte.", items: ["Los datos de proceso permanecen dentro del espacio autorizado.", "Las acciones de la aplicación se respaldan en decisiones del servidor."] },
    beta: { eyebrow: "Antes de empezar", title: "Revisa los documentos y pregunta cuando lo necesites.", body: "Esta es una beta gratuita limitada, no una garantía de precio gratuito permanente. Consulta los términos beta vigentes, el aviso de privacidad y la guía de datos prohibidos. Nuestro canal configurable de soporte está disponible para preguntas sobre la beta.", links: ["Términos beta vigentes", "Aviso de privacidad", "Guía de datos prohibidos"], support: "Contactar soporte de beta" },
    timeToValue: "Primer recorrido simple: 30–60 minutos, según la preparación.",
    final: { title: "¿Tienes un caso sencillo para explorar?", body: "Empieza con una muestra ficticia y comprueba si Moviqo encaja con tu forma de trabajar.", primary: "Iniciar beta gratuita", secondary: "Ingresar" },
    footer: { rights: "© 2026 Moviqo. Todos los derechos reservados." }
  },
  en: {
    hero: {
      eyebrow: "Limited free beta",
      title: "Turn repeatable processes into clear work.",
      body: "Moviqo helps small teams design forms and work journeys that teams can follow.",
      capabilities: "Forms, Process Fields, calculations, attachments, Tasks, Member or Team assignment, visual conditions, routing, tracking, and audit.",
      primary: "Start Free Beta",
      secondary: "Sign In"
    },
    nav: { story: "How it works", examples: "Examples", trust: "Beta and trust" },
    examples: { eyebrow: "Safe examples", title: "Three fictional cases to picture the journey." },
    problem: {
      eyebrow: "Less work lost",
      title: "From scattered requests to a visible journey.",
      body: "Define the information you need, who reviews each task, and what evidence remains as work moves forward. Your team can see status without relying on isolated conversations."
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "A simple path to publish a simple case.",
      steps: [
        { title: "1. Define", body: "Create a form with relevant Process Fields, calculations, and attachments." },
        { title: "2. Coordinate", body: "Connect Tasks, Members or Teams, visual conditions, and clear routing." },
        { title: "3. Track", body: "Review status, activity, and audit evidence to understand what happened." }
      ]
    },
    scenarios: [
      { label: "Fictional sample · purchase", name: "Purchase request", description: "Fictional distributor Northstar Supply records 12 keyboards for EUR 840.", details: ["Form: purchase request", "Task: Ana Ruiz · purchasing review", "Status: in review", "Attachment: demo-receipt.pdf"], alt: "Fictional sample view of a purchase request with form, task, and demo attachment" },
      { label: "Fictional demo · documents", name: "Document review", description: "Fictional services company Lumen Services receives contract CL-204 and assigns Mateo Sol to review it.", details: ["Form: document intake", "Task: Mateo Sol · validate document", "Status: ready for review", "Attachment: sample-document.pdf"], alt: "Fictional demo view of document review with task, status, and sample attachment" },
      { label: "Fictional sample · maintenance", name: "Service request", description: "Fictional maintenance company Breeze Works records a medium-priority visit at its Central site.", details: ["Form: maintenance request", "Task: technical team · assess service", "Status: schedulable", "Attachment: demo-reference.jpg"], alt: "Fictional sample view of a maintenance request with priority and demo attachment" }
    ],
    visuals: { eyebrow: "A representative view", title: "Important information stays in view.", form: "Process form", task: "Task assigned to a team", timeline: "Tracking and audit", alt: "Visual composition of a fictional process form, task, and tracking" },
    trust: { eyebrow: "Trust and boundaries", title: "A limited beta with clear expectations.", body: "Moviqo is a limited free beta. Use fictional data while evaluating it and review the current documents before registering.", items: ["Process Data stays within the authorized workspace.", "Application actions are backed by server decisions."] },
    beta: { eyebrow: "Before you start", title: "Review the documents and ask when you need help.", body: "This is a limited free beta, not a guarantee of a permanent free price. Read the current beta terms, privacy notice, and prohibited-data guidance. Our configurable beta support channel is available for questions about the beta.", links: ["Current beta terms", "Privacy notice", "Prohibited-data guidance"], support: "Contact beta support" },
    timeToValue: "First simple journey: 30–60 minutes, depending on preparation.",
    final: { title: "Have a simple case to explore?", body: "Start with a fictional sample and see whether Moviqo fits the way you work.", primary: "Start Free Beta", secondary: "Sign In" },
    footer: { rights: "© 2026 Moviqo. All rights reserved." }
  }
};
