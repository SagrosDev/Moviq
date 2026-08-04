export type LandingLocale = "es" | "en";

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
};

export const landingDestinations = {
  register: "/register",
  signIn: "/sign-in",
  betaTerms: "",
  privacy: "",
  prohibitedData: "",
  support: ""
} as const;

export const landingContent: Record<LandingLocale, LandingCopy> = {
  es: {
    hero: {
      eyebrow: "Beta gratuita limitada",
      title: "Convierte procesos repetibles en trabajo claro.",
      body: "Moviqo ayuda a equipos pequeños a diseñar formularios y recorridos de trabajo que los equipos pueden seguir.",
      capabilities: "Formularios, campos de proceso, cálculos, adjuntos, tareas, asignación a miembros o equipos, condiciones visuales, rutas, seguimiento y auditoría, con interfaz bilingüe.",
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
    trust: { eyebrow: "Confianza y límites", title: "Una beta limitada, con expectativas claras.", body: "Moviqo está en beta gratuita limitada. Usa datos ficticios durante la evaluación y revisa la documentación vigente antes de registrarte.", items: ["La interfaz está disponible en español e inglés.", "Los datos de proceso permanecen dentro del espacio autorizado.", "Las acciones de la aplicación se respaldan en decisiones del servidor."] },
    beta: { eyebrow: "Antes de empezar", title: "Revisa los documentos y pregunta cuando lo necesites.", body: "Consulta los términos beta vigentes, el aviso de privacidad y la guía de datos prohibidos. Nuestro canal configurable de soporte está disponible para preguntas sobre la beta.", links: ["Términos beta vigentes", "Aviso de privacidad", "Guía de datos prohibidos"], support: "Contactar soporte de beta" },
    timeToValue: "Meta para un caso simple: publicar un primer recorrido en 30–60 minutos, según su alcance y preparación.",
    final: { title: "¿Tienes un caso sencillo para explorar?", body: "Empieza con una muestra ficticia y comprueba si Moviqo encaja con tu forma de trabajar.", primary: "Iniciar beta gratuita", secondary: "Ingresar" }
  },
  en: {
    hero: {
      eyebrow: "Limited free beta",
      title: "Turn repeatable processes into clear work.",
      body: "Moviqo helps small teams design forms and work journeys that teams can follow.",
      capabilities: "Forms, Process Fields, calculations, attachments, Tasks, Member or Team assignment, visual conditions, routing, tracking, and audit, with a bilingual interface.",
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
    trust: { eyebrow: "Trust and boundaries", title: "A limited beta with clear expectations.", body: "Moviqo is a limited free beta. Use fictional data while evaluating it and review the current documents before registering.", items: ["The interface is available in Spanish and English.", "Process Data stays within the authorized workspace.", "Application actions are backed by server decisions."] },
    beta: { eyebrow: "Before you start", title: "Review the documents and ask when you need help.", body: "Read the current beta terms, privacy notice, and prohibited-data guidance. Our configurable beta support channel is available for questions about the beta.", links: ["Current beta terms", "Privacy notice", "Prohibited-data guidance"], support: "Contact beta support" },
    timeToValue: "Simple-case target: publish a first journey in 30–60 minutes, depending on its scope and preparation.",
    final: { title: "Have a simple case to explore?", body: "Start with a fictional sample and see whether Moviqo fits the way you work.", primary: "Start Free Beta", secondary: "Sign In" }
  }
};
