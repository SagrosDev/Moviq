export const supportedLanguages = ["es", "en"] as const;

export type Language = (typeof supportedLanguages)[number];

export const defaultLanguage: Language = "es";

export type MessageKey =
  | "app.brand.home"
  | "app.nav.primary"
  | "app.nav.work"
  | "app.nav.processes"
  | "app.nav.admin"
  | "app.nav.designSystem"
  | "app.language.label"
  | "app.language.spanish"
  | "app.language.english"
  | "home.eyebrow"
  | "home.title"
  | "home.lede"
  | "environment.banner.title"
  | "environment.banner.body"
  | "environment.banner.rule1"
  | "environment.banner.rule2"
  | "environment.banner.rule3"
  | "authority.title"
  | "authority.accessDenied"
  | "authority.completionRejected"
  | "authority.reviewAssignedWork"
  | "status.ready"
  | "status.blocked"
  | "status.needsAttention"
  | "validation.required"
  | "help.requiredField"
  | "password.policy.helper"
  | "password.policy.reveal"
  | "password.policy.hide"
  | "catalog.title"
  | "catalog.subtitle"
  | "catalog.responsive.title"
  | "catalog.responsive.operational"
  | "catalog.responsive.designer"
  | "catalog.metadata.title"
  | "catalog.button.title"
  | "catalog.button.responsive"
  | "catalog.button.permitted"
  | "catalog.button.primary"
  | "catalog.button.loading"
  | "catalog.guidance.title"
  | "catalog.guidance.responsive"
  | "catalog.guidance.permitted"
  | "catalog.guidance.body"
  | "catalog.guidance.action"
  | "catalog.field.title"
  | "catalog.field.responsive"
  | "catalog.field.permitted"
  | "catalog.field.label"
  | "catalog.field.placeholder"
  | "catalog.step.title"
  | "catalog.step.responsive"
  | "catalog.step.permitted"
  | "catalog.step.body"
  | "catalog.step.back"
  | "catalog.step.continue"
  | "catalog.workflow.title"
  | "catalog.workflow.responsive"
  | "catalog.workflow.permitted"
  | "catalog.workflow.name"
  | "catalog.workflow.body"
  | "catalog.task.title"
  | "catalog.task.responsive"
  | "catalog.task.permitted"
  | "catalog.task.name"
  | "catalog.task.workflow"
  | "catalog.task.assignee"
  | "catalog.task.action"
  | "catalog.assignment.title"
  | "catalog.assignment.responsive"
  | "catalog.assignment.permitted"
  | "catalog.assignment.recipient"
  | "catalog.assignment.available"
  | "catalog.assignment.status"
  | "catalog.assignment.action"
  | "catalog.publish.title"
  | "catalog.publish.responsive"
  | "catalog.publish.permitted"
  | "catalog.publish.issue"
  | "catalog.publish.target"
  | "catalog.timeline.title"
  | "catalog.timeline.responsive"
  | "catalog.timeline.permitted"
  | "catalog.timeline.event"
  | "catalog.timeline.position"
  | "catalog.fallbackOnly";

type MessageDictionary = Record<MessageKey, string>;

export const spanishMessages: MessageDictionary = {
  "app.brand.home": "Inicio de Moviqo",
  "app.nav.primary": "Principal",
  "app.nav.work": "Mi trabajo",
  "app.nav.processes": "Procesos",
  "app.nav.admin": "Administracion",
  "app.nav.designSystem": "Sistema de diseno",
  "app.language.label": "Idioma",
  "app.language.spanish": "Espanol",
  "app.language.english": "Ingles",
  "home.eyebrow": "Base de beta interna",
  "home.title": "Avanza el trabajo con responsables claros.",
  "home.lede":
    "Moviqo mantiene las decisiones del flujo en el servidor mientras esta interfaz prueba la estructura accesible y bilingue.",
  "environment.banner.title": "Entorno interno con datos sinteticos",
  "environment.banner.body":
    "Usa este entorno solo para pruebas internas persistentes. No actives clientes ni registres datos reales.",
  "environment.banner.rule1":
    "Prohibido usar onboarding de clientes o afirmaciones de produccion.",
  "environment.banner.rule2":
    "Prohibido ingresar datos reales de negocio, datos personales reales o archivos de produccion.",
  "environment.banner.rule3":
    "Las funciones de malware en vivo, copias independientes y ciclos de vida siguen deshabilitados por compuerta.",
  "authority.title": "Respuesta del servidor requerida",
  "authority.accessDenied": "No tienes acceso a este elemento de trabajo.",
  "authority.completionRejected":
    "La tarea no se completo. Intentalo de nuevo despues de actualizar el elemento de trabajo.",
  "authority.reviewAssignedWork": "Revisar trabajo asignado",
  "status.ready": "Listo",
  "status.blocked": "Bloqueado",
  "status.needsAttention": "Necesita atencion",
  "validation.required": "Completa este campo para continuar.",
  "help.requiredField": "Usa una descripcion corta y clara.",
  "password.policy.helper":
    "Usa entre 15 y 128 caracteres. Evita contrasenas comunes o expuestas.",
  "password.policy.reveal": "Mostrar contrasena",
  "password.policy.hide": "Ocultar contrasena",
  "catalog.title": "Sistema de diseno",
  "catalog.subtitle": "Componentes base para experiencias operativas seguras.",
  "catalog.responsive.title": "Comportamiento responsivo",
  "catalog.responsive.operational":
    "Las superficies operativas se reorganizan en movil, tableta, portatil y escritorio sin perder la accion requerida.",
  "catalog.responsive.designer":
    "Los ejemplos estrechos del disenador muestran vista y navegacion ligera; la autoria completa requiere 1280 por 720 px o mas.",
  "catalog.metadata.title": "Evidencia del catalogo",
  "catalog.button.title": "Boton principal",
  "catalog.button.responsive": "Mantiene un objetivo practico de 44 por 44 px y ajusta el texto de accion.",
  "catalog.button.permitted": "Solo etiquetas de comando propias de Moviqo.",
  "catalog.button.primary": "Guardar borrador",
  "catalog.button.loading": "Guardando",
  "catalog.guidance.title": "Guia",
  "catalog.guidance.responsive": "Apila titulo, cuerpo y una accion en superficies estrechas.",
  "catalog.guidance.permitted": "Instrucciones generales que no revelan datos del proceso.",
  "catalog.guidance.body": "Revisa los datos autorizados antes de continuar.",
  "catalog.guidance.action": "Continuar",
  "catalog.field.title": "Campo de formulario",
  "catalog.field.responsive": "Mantiene etiqueta, ayuda, entrada y validacion en orden de lectura.",
  "catalog.field.permitted": "Etiquetas propias de Moviqo y valores de ejemplo seguros.",
  "catalog.field.label": "Nombre del proceso",
  "catalog.field.placeholder": "Ejemplo autorizado",
  "catalog.step.title": "Paso guiado",
  "catalog.step.responsive": "Agrupa una decision con acciones para volver y continuar.",
  "catalog.step.permitted": "Solo guia segura del paso.",
  "catalog.step.body": "Confirma una decision antes de avanzar.",
  "catalog.step.back": "Volver",
  "catalog.step.continue": "Continuar",
  "catalog.workflow.title": "Elemento de flujo",
  "catalog.workflow.responsive": "Pasa de lectura horizontal a orden apilado.",
  "catalog.workflow.permitted": "Nombres y explicaciones genericas del flujo.",
  "catalog.workflow.name": "Revision inicial",
  "catalog.workflow.body": "Recibe una solicitud y confirma si puede avanzar.",
  "catalog.task.title": "Tarjeta de tarea",
  "catalog.task.responsive": "Prioriza nombre de tarea, estado, responsable y accion.",
  "catalog.task.permitted": "Solo metadatos autorizados de la tarea.",
  "catalog.task.name": "Revisar solicitud",
  "catalog.task.workflow": "Flujo: Solicitudes internas",
  "catalog.task.assignee": "Asignado a: Equipo de operaciones",
  "catalog.task.action": "Abrir tarea",
  "catalog.assignment.title": "Asignacion",
  "catalog.assignment.responsive": "Mantiene receptor, disponibilidad, estado y accion juntos al ajustar el ancho.",
  "catalog.assignment.permitted": "Tipo de receptor, nombre seguro y regla de disponibilidad.",
  "catalog.assignment.recipient": "Equipo de operaciones",
  "catalog.assignment.available": "Disponible cuando se publique el flujo.",
  "catalog.assignment.status": "Seleccionado para publicacion",
  "catalog.assignment.action": "Cambiar asignacion",
  "catalog.publish.title": "Lista de publicacion",
  "catalog.publish.responsive": "Las filas de problemas mantienen estado y destino de configuracion juntos.",
  "catalog.publish.permitted": "Problemas de configuracion limitados a detalles seguros del flujo.",
  "catalog.publish.issue": "Falta una persona responsable",
  "catalog.publish.target": "Configurar asignacion",
  "catalog.timeline.title": "Linea de tiempo",
  "catalog.timeline.responsive": "Los eventos apilan actor, hora, estado y posicion de tarea.",
  "catalog.timeline.permitted": "Solo actor, hora, estado y posicion de tarea.",
  "catalog.timeline.event": "Ana cambio el estado a listo",
  "catalog.timeline.position": "Paso 2 de 4: Revision",
  "catalog.fallbackOnly": "Texto de respaldo en espanol"
};

export const englishMessages: Partial<MessageDictionary> = {
  "app.brand.home": "Moviqo home",
  "app.nav.primary": "Primary",
  "app.nav.work": "My work",
  "app.nav.processes": "Processes",
  "app.nav.admin": "Administration",
  "app.nav.designSystem": "Design system",
  "app.language.label": "Language",
  "app.language.spanish": "Spanish",
  "app.language.english": "English",
  "home.eyebrow": "Internal beta foundation",
  "home.title": "Move work forward with clear ownership.",
  "home.lede":
    "Moviqo keeps workflow decisions on the server while this interface proves the accessible bilingual structure.",
  "environment.banner.title": "Internal synthetic-data environment",
  "environment.banner.body":
    "Use this environment for persistent internal testing only. Do not onboard customers or enter real data.",
  "environment.banner.rule1":
    "Customer onboarding and production claims are prohibited here.",
  "environment.banner.rule2":
    "Do not enter real business data, real personal data, or production files.",
  "environment.banner.rule3":
    "Live malware scanning, independent backups, and lifecycle schedules remain disabled by gate.",
  "authority.title": "Server response required",
  "authority.accessDenied": "You do not have access to this work item.",
  "authority.completionRejected":
    "The task was not completed. Try again after refreshing the work item.",
  "authority.reviewAssignedWork": "Review assigned work",
  "status.ready": "Ready",
  "status.blocked": "Blocked",
  "status.needsAttention": "Needs attention",
  "validation.required": "Complete this field to continue.",
  "help.requiredField": "Use a short and clear description.",
  "password.policy.helper":
    "Use 15 to 128 characters. Avoid common or exposed passwords.",
  "password.policy.reveal": "Show password",
  "password.policy.hide": "Hide password",
  "catalog.title": "Design system",
  "catalog.subtitle": "Base components for safe operational experiences.",
  "catalog.responsive.title": "Responsive behavior",
  "catalog.responsive.operational":
    "Operational surfaces reflow on mobile, tablet, laptop, and desktop without losing the required action.",
  "catalog.responsive.designer":
    "Narrow Designer examples show view and light navigation; full authoring requires 1280 by 720 px or larger.",
  "catalog.metadata.title": "Catalog evidence",
  "catalog.button.title": "Primary button",
  "catalog.button.responsive": "Keeps a practical 44 by 44 px target and wraps action text.",
  "catalog.button.permitted": "Plain Moviqo-owned command labels only.",
  "catalog.button.primary": "Save draft",
  "catalog.button.loading": "Saving",
  "catalog.guidance.title": "Guidance",
  "catalog.guidance.responsive": "Stacks title, body, and one action on narrow surfaces.",
  "catalog.guidance.permitted": "General instructions that do not reveal Process Data.",
  "catalog.guidance.body": "Review authorized data before continuing.",
  "catalog.guidance.action": "Continue",
  "catalog.field.title": "Form field",
  "catalog.field.responsive": "Keeps label, help, input, and validation in reading order.",
  "catalog.field.permitted": "Moviqo-owned labels and safe example values.",
  "catalog.field.label": "Process name",
  "catalog.field.placeholder": "Authorized example",
  "catalog.step.title": "Guided step",
  "catalog.step.responsive": "Groups one decision with Back and Continue actions.",
  "catalog.step.permitted": "Safe step guidance only.",
  "catalog.step.body": "Confirm one decision before moving forward.",
  "catalog.step.back": "Back",
  "catalog.step.continue": "Continue",
  "catalog.workflow.title": "Workflow element",
  "catalog.workflow.responsive": "Moves from horizontal scan to stacked reading order.",
  "catalog.workflow.permitted": "Generic workflow names and explanations.",
  "catalog.workflow.name": "Initial review",
  "catalog.workflow.body": "Receives a request and confirms whether it can move forward.",
  "catalog.task.title": "Task card",
  "catalog.task.responsive": "Prioritizes task name, status, assignee, and action.",
  "catalog.task.permitted": "Authorized task metadata only.",
  "catalog.task.name": "Review request",
  "catalog.task.workflow": "Workflow: Internal requests",
  "catalog.task.assignee": "Assigned to: Operations team",
  "catalog.task.action": "Open task",
  "catalog.assignment.title": "Assignment",
  "catalog.assignment.responsive": "Keeps recipient, availability, state, and action together when wrapping.",
  "catalog.assignment.permitted": "Recipient type, safe display name, and availability rule.",
  "catalog.assignment.recipient": "Operations team",
  "catalog.assignment.available": "Available when the workflow is published.",
  "catalog.assignment.status": "Selected for publication",
  "catalog.assignment.action": "Change assignment",
  "catalog.publish.title": "Publish checklist",
  "catalog.publish.responsive": "Issue rows keep status text and configuration target together.",
  "catalog.publish.permitted": "Configuration issues limited to safe workflow setup details.",
  "catalog.publish.issue": "A responsible person is missing",
  "catalog.publish.target": "Configure assignment",
  "catalog.timeline.title": "Timeline",
  "catalog.timeline.responsive": "Timeline items stack actor, time, state, and task position.",
  "catalog.timeline.permitted": "Actor, time, state, and task position only.",
  "catalog.timeline.event": "Ana changed the state to ready",
  "catalog.timeline.position": "Step 2 of 4: Review"
};
