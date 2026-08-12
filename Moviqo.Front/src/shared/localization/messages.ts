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
  | "app.nav.dashboard"
  | "app.nav.tasks"
  | "app.nav.startProcess"
  | "app.nav.workflows"
  | "app.nav.forms"
  | "app.skipToContent"
  | "app.loading"
  | "route.notFound.title"
  | "route.notFound.body"
  | "route.notFound.back"
  | "route.error.title"
  | "route.error.body"
  | "dashboard.title"
  | "dashboard.lede"
  | "dashboard.tasks"
  | "dashboard.processes"
  | "dashboard.startProcess"
  | "dashboard.authoring"
  | "workflowCatalog.title"
  | "workflowCatalog.lede"
  | "workflowCatalog.emptyTitle"
  | "workflowCatalog.empty"
  | "workflowCatalog.loading"
  | "workflowCatalog.error"
  | "workflowCatalog.retry"
  | "workflowCatalog.open"
  | "workflowCatalog.create"
  | "workflowDesign.route.loading"
  | "workflowDesign.route.error"
  | "workflowDesign.route.back"
  | "formLauncher.title"
  | "formLauncher.lede"
  | "formLauncher.workflow"
  | "formLauncher.task"
  | "formLauncher.selectWorkflow"
  | "formLauncher.selectTask"
  | "formLauncher.open"
  | "formLauncher.noWorkflows"
  | "formLauncher.emptyStepWorkflow"
  | "formLauncher.emptyStepForm"
  | "formLauncher.noTasks"
  | "formLauncher.unavailable"
  | "formDesign.eyebrow"
  | "formDesign.title"
  | "formDesign.reserved"
  | "formDesign.backToForms"
  | "formDesign.backToWorkflow"
  | "workflowDesign.editor.designForm"
  | "workflowDesign.leave.title"
  | "workflowDesign.leave.body"
  | "workflowDesign.leave.save"
  | "workflowDesign.leave.discard"
  | "workflowDesign.leave.stay"
  | "app.language.label"
  | "app.language.spanish"
  | "app.language.english"
  | "home.eyebrow"
  | "home.title"
  | "home.lede"
  | "home.cta.register"
  | "auth.signIn"
  | "auth.signOut"
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
  | "status.assigned"
  | "status.inProgress"
  | "status.completed"
  | "validation.required"
  | "validation.generic"
  | "validation.email"
  | "help.requiredField"
  | "password.policy.helper"
  | "password.policy.reveal"
  | "password.policy.hide"
  | "registration.eyebrow"
  | "registration.title"
  | "registration.lede"
  | "registration.form.title"
  | "registration.form.body"
  | "registration.errors.title"
  | "registration.errors.documents"
  | "registration.errors.form"
  | "registration.identity.title"
  | "registration.identity.body"
  | "registration.organization.title"
  | "registration.organization.body"
  | "registration.regional.title"
  | "registration.regional.body"
  | "registration.ownerName.label"
  | "registration.organizationName.label"
  | "registration.email.label"
  | "registration.password.label"
  | "registration.language.label"
  | "registration.region.label"
  | "registration.timezone.label"
  | "registration.currency.label"
  | "registration.consent.title"
  | "registration.consent.body"
  | "registration.documents.current"
  | "registration.terms.label"
  | "registration.privacy.label"
  | "registration.prohibited.label"
  | "registration.submit"
  | "registration.submitting"
  | "registration.success"
  | "registration.failure"
  | "verification.eyebrow"
  | "verification.title"
  | "verification.lede"
  | "verification.loading.title"
  | "verification.loading.body"
  | "verification.success.title"
  | "verification.success.body"
  | "verification.success.next"
  | "verification.invalid.title"
  | "verification.invalid.body"
  | "verification.cta.home"
  | "verification.cta.register"
  | "signIn.eyebrow"
  | "signIn.title"
  | "signIn.lede"
  | "signIn.email"
  | "signIn.password"
  | "signIn.submit"
  | "signIn.submitting"
  | "signIn.failure"
  | "myWork.title"
  | "myWork.lede"
  | "myWork.primaryNav"
  | "myWork.regionNav"
  | "myWork.tabs"
  | "myWork.loading"
  | "myWork.error"
  | "myWork.networkError"
  | "myWork.sessionExpired"
  | "myWork.permissionDenied"
  | "myWork.retry"
  | "myWork.sessionLoading"
  | "myWork.myTasks.title"
  | "myWork.myTasks.summary"
  | "myWork.myTasks.empty"
  | "myWork.myTasks.noMatches"
  | "myWork.myTasks.unavailable"
  | "myWork.myTasks.searchLabel"
  | "myWork.myTasks.searchPlaceholder"
  | "myWork.myTasks.searchAction"
  | "myWork.myTasks.loading"
  | "myWork.myTasks.error"
  | "myWork.myTasks.status"
  | "myWork.myTasks.process"
  | "myWork.myTasks.open"
  | "myWork.startWorkflows.title"
  | "myWork.startWorkflows.pageLede"
  | "myWork.startWorkflows.summary"
  | "myWork.startWorkflows.empty"
  | "myWork.startWorkflows.emptyAuthor"
  | "myWork.startWorkflows.emptyMember"
  | "myWork.startWorkflows.emptyHelp"
  | "myWork.startWorkflows.unavailable"
  | "myWork.startWorkflows.loading"
  | "myWork.startWorkflows.error"
  | "myWork.startWorkflows.version"
  | "myWork.startWorkflows.start"
  | "myWork.startWorkflows.starting"
  | "myWork.startWorkflows.startError"
  | "myWork.startWorkflows.openingTask"
  | "myWork.myProcesses.title"
  | "myWork.myProcesses.summary"
  | "myWork.myProcesses.empty"
  | "myWork.myProcesses.noMatches"
  | "myWork.myProcesses.unavailable"
  | "myWork.myProcesses.loading"
  | "myWork.myProcesses.error"
  | "myWork.myProcesses.tableRegion"
  | "myWork.myProcesses.workflowColumn"
  | "myWork.myProcesses.referenceColumn"
  | "myWork.myProcesses.statusColumn"
  | "myWork.myProcesses.stepColumn"
  | "myWork.myProcesses.involvementColumn"
  | "myWork.myProcesses.lastActivityColumn"
  | "myWork.myProcesses.actionsColumn"
  | "myWork.myProcesses.reference"
  | "myWork.myProcesses.status"
  | "myWork.myProcesses.step"
  | "myWork.myProcesses.involvement"
  | "myWork.myProcesses.lastActivity"
  | "myWork.myProcesses.searchLabel"
  | "myWork.myProcesses.searchPlaceholder"
  | "myWork.myProcesses.searchAction"
  | "myWork.myProcesses.discoveryHint"
  | "myWork.myProcesses.previousPage"
  | "myWork.myProcesses.nextPage"
  | "myWork.myProcesses.view"
  | "processDetail.eyebrow"
  | "processDetail.title"
  | "processDetail.back"
  | "processDetail.loading"
  | "processDetail.loadError"
  | "processDetail.retry"
  | "processDetail.reference"
  | "processDetail.version"
  | "processDetail.status"
  | "processDetail.step"
  | "processDetail.startedAt"
  | "processDetail.completedAt"
  | "processDetail.lastActivity"
  | "processDetail.contribution"
  | "processDetail.timelineTitle"
  | "processDetail.timelineEmpty"
  | "processDetail.event.processStarted"
  | "processDetail.event.taskProgressSaved"
  | "processDetail.event.taskCompleted"
  | "processDetail.event.processCompleted"
  | "workflowDesign.create.eyebrow"
  | "workflowDesign.create.title"
  | "workflowDesign.create.lede"
  | "workflowDesign.create.body"
  | "workflowDesign.create.name"
  | "workflowDesign.create.help"
  | "workflowDesign.create.submit"
  | "workflowDesign.create.submitting"
  | "workflowDesign.create.back"
  | "workflowDesign.create.error"
  | "workflowDesign.create.conflict"
  | "workflowDesign.create.cta"
  | "workflowDesign.authoring.narrowTitle"
  | "workflowDesign.authoring.narrowBody"
  | "workflowDesign.draft.title"
  | "workflowDesign.draft.revision"
  | "workflowDesign.draft.schemaVersion"
  | "workflowDesign.draft.save"
  | "workflowDesign.editor.eyebrow"
  | "workflowDesign.editor.title"
  | "workflowDesign.editor.body"
  | "workflowDesign.editor.guidanceTitle"
  | "workflowDesign.editor.guidanceStart"
  | "workflowDesign.editor.guidanceTask"
  | "workflowDesign.editor.guidanceEnd"
  | "workflowDesign.editor.guidanceConnectStartTask"
  | "workflowDesign.editor.guidanceConnectTaskEnd"
  | "workflowDesign.editor.guidanceSave"
  | "workflowDesign.editor.addStart"
  | "workflowDesign.editor.addTask"
  | "workflowDesign.editor.addEnd"
  | "workflowDesign.editor.connectStartTask"
  | "workflowDesign.editor.connectTaskEnd"
  | "workflowDesign.editor.saving"
  | "workflowDesign.editor.unsaved"
  | "workflowDesign.editor.retrying"
  | "workflowDesign.editor.retrySave"
  | "workflowDesign.editor.saveNow"
  | "workflowDesign.editor.saveSuccess"
  | "workflowDesign.editor.saveError"
  | "workflowDesign.editor.reloadError"
  | "workflowDesign.editor.errorTitle"
  | "workflowDesign.editor.conflictTitle"
  | "workflowDesign.editor.conflictMessage"
  | "workflowDesign.editor.reloadLatest"
  | "workflowDesign.editor.reapplyChanges"
  | "workflowDesign.editor.validatePublication"
  | "workflowDesign.editor.validatingPublication"
  | "workflowDesign.editor.publishWorkflow"
  | "workflowDesign.editor.publishingWorkflow"
  | "workflowDesign.editor.publishSuccess"
  | "workflowDesign.editor.publishErrorTitle"
  | "workflowDesign.editor.publishError"
  | "workflowDesign.editor.checklistTitle"
  | "workflowDesign.editor.checklistBody"
  | "workflowDesign.editor.checklistEmpty"
  | "workflowDesign.editor.checklistError"
  | "workflowDesign.editor.publicationSetupTitle"
  | "workflowDesign.editor.publicationSetupBody"
  | "workflowDesign.editor.configureStarter"
  | "workflowDesign.editor.starterConfigured"
  | "workflowDesign.editor.configureAssignment"
  | "workflowDesign.editor.assignmentConfigured"
  | "workflowDesign.editor.starterSectionTitle"
  | "workflowDesign.editor.assignmentSectionTitle"
  | "workflowDesign.editor.starterAllActiveMembers"
  | "workflowDesign.editor.starterSelectedTeams"
  | "workflowDesign.editor.starterSelectedMembers"
  | "workflowDesign.editor.assignmentWorkflowInitiator"
  | "workflowDesign.editor.assignmentSpecificMember"
  | "workflowDesign.editor.starterSummaryPrefix"
  | "workflowDesign.editor.assignmentSummaryPrefix"
  | "workflowDesign.editor.starterEmpty"
  | "workflowDesign.editor.assignmentEmpty"
  | "workflowDesign.editor.issue.starterMissing"
  | "workflowDesign.editor.issue.assignmentMissing"
  | "workflowDesign.editor.issue.startStepInvalid"
  | "workflowDesign.editor.issue.firstTaskMissing"
  | "workflowDesign.editor.issue.endStepInvalid"
  | "workflowDesign.editor.issue.startPathIncomplete"
  | "workflowDesign.editor.issue.pathDisconnected"
  | "workflowDesign.editor.issue.pathToEndMissing"
  | "workflowDesign.editor.issue.firstTaskFormMissing"
  | "workflowDesign.editor.issue.firstTaskBindingMissingField"
  | "workflowDesign.editor.issue.firstTaskFormDecorative"
  | "workflowDesign.editor.issueAction.configureStarter"
  | "workflowDesign.editor.issueAction.configureAssignment"
  | "workflowDesign.editor.issueAction.reviewWorkflowPath"
  | "workflowDesign.editor.issueAction.openFirstTaskForm"
  | "workflowDesign.editor.issueAction.openReusableField"
  | "workflowDesign.editor.previewTitle"
  | "workflowDesign.editor.previewBody"
  | "workflowDesign.editor.connectLabel"
  | "workflowDesign.editor.startLabel"
  | "workflowDesign.editor.taskLabel"
  | "workflowDesign.editor.endLabel"
  | "workflowDesign.editor.startBody"
  | "workflowDesign.editor.taskBody"
  | "workflowDesign.editor.endBody"
  | "workflowDesign.editor.savedTitle"
  | "workflowDesign.editor.savedBody"
  | "workflowDesign.editor.savedEmpty"
  | "workflowDesign.editor.fieldTitle"
  | "workflowDesign.editor.fieldBody"
  | "workflowDesign.editor.fieldLabel"
  | "workflowDesign.editor.fieldHelpText"
  | "workflowDesign.editor.fieldPlaceholder"
  | "workflowDesign.editor.fieldDefaultValue"
  | "workflowDesign.editor.fieldMinimumLength"
  | "workflowDesign.editor.fieldMaximumLength"
  | "workflowDesign.editor.addShortText"
  | "workflowDesign.editor.updateShortText"
  | "workflowDesign.editor.addToFirstTask"
  | "workflowDesign.editor.removeFromFirstTask"
  | "workflowDesign.editor.fieldSummaryPrefix"
  | "workflowDesign.editor.fieldEmpty"
  | "taskForm.eyebrow"
  | "taskForm.process"
  | "taskForm.status"
  | "taskForm.revision"
  | "taskForm.errorTitle"
  | "taskForm.retry"
  | "taskForm.reloadLatest"
  | "taskForm.save"
  | "taskForm.saving"
  | "taskForm.saveSuccess"
  | "taskForm.completing"
  | "taskForm.completeSuccess"
  | "taskForm.completeError"
  | "taskForm.completeHandoff"
  | "taskForm.processComplete"
  | "taskForm.saveError"
  | "taskForm.complete"
  | "taskForm.back"
  | "taskForm.loading"
  | "taskForm.loadError"
  | "taskForm.leave.title"
  | "taskForm.leave.body"
  | "taskForm.leave.save"
  | "taskForm.leave.discard"
  | "taskForm.leave.stay"
  | "passwordRecovery.eyebrow"
  | "passwordRecovery.title"
  | "passwordRecovery.lede"
  | "passwordRecovery.email"
  | "passwordRecovery.submit"
  | "passwordRecovery.submitting"
  | "passwordRecovery.confirmation"
  | "passwordRecovery.failure"
  | "passwordRecovery.forgotLink"
  | "passwordRecovery.resetTitle"
  | "passwordRecovery.resetLede"
  | "passwordRecovery.password"
  | "passwordRecovery.resetSubmit"
  | "passwordRecovery.resetting"
  | "passwordRecovery.resetFailure"
  | "passwordRecovery.resetComplete"
  | "passwordRecovery.signIn"
  | "passwordRecovery.requestAgain"
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
  "app.nav.admin": "Administración",
  "app.nav.designSystem": "Sistema de diseño",
  "app.nav.dashboard": "Mi trabajo",
  "app.nav.tasks": "Tareas",
  "app.nav.startProcess": "Iniciar proceso",
  "app.nav.workflows": "Flujos",
  "app.nav.forms": "Formularios",
  "app.skipToContent": "Saltar al contenido principal",
  "app.loading": "Cargando tu espacio de trabajo...",
  "route.notFound.title": "No encontramos esta página",
  "route.notFound.body": "La dirección puede estar desactualizada. Vuelve a un módulo disponible.",
  "route.notFound.back": "Volver al resumen",
  "route.error.title": "No pudimos abrir este módulo",
  "route.error.body": "Vuelve al resumen e inténtalo de nuevo.",
  "dashboard.title": "Resumen",
  "dashboard.lede": "Elige el módulo donde quieres continuar tu trabajo.",
  "dashboard.tasks": "Revisar tareas asignadas",
  "dashboard.processes": "Consultar mis procesos",
  "dashboard.startProcess": "Iniciar un proceso",
  "dashboard.authoring": "Diseñar flujos y formularios",
  "workflowCatalog.title": "Flujos",
  "workflowCatalog.lede": "Abre un flujo existente o crea uno nuevo.",
  "workflowCatalog.emptyTitle": "Crea tu primer flujo",
  "workflowCatalog.empty": "Aún no tienes flujos. Crea el primero para configurar tu proceso.",
  "workflowCatalog.loading": "Cargando tus flujos...",
  "workflowCatalog.error": "Aún no tienes flujos. Crea el primero para configurar tu proceso.",
  "workflowCatalog.retry": "Actualizar",
  "workflowCatalog.open": "Diseñar flujo",
  "workflowCatalog.create": "Crear flujo",
  "workflowDesign.route.loading": "Cargando el borrador del flujo...",
  "workflowDesign.route.error": "No encontramos este borrador. Verifica el enlace o vuelve a Flujos.",
  "workflowDesign.route.back": "Volver a flujos",
  "formLauncher.title": "Formularios",
  "formLauncher.lede": "Selecciona primero un flujo y luego una tarea.",
  "formLauncher.workflow": "Flujo",
  "formLauncher.task": "Tarea",
  "formLauncher.selectWorkflow": "Selecciona un flujo",
  "formLauncher.selectTask": "Selecciona una tarea",
  "formLauncher.open": "Diseñar formulario",
  "formLauncher.noWorkflows": "Aún no tienes formularios",
  "formLauncher.emptyStepWorkflow": "Crea un flujo de proceso y agrega al menos una tarea.",
  "formLauncher.emptyStepForm": "Vuelve a Formularios para diseñar los campos de esa tarea.",
  "formLauncher.noTasks": "Este flujo aún no tiene tareas. Agrega una antes de diseñar su formulario.",
  "formLauncher.unavailable": "Aún no tienes formularios. Crea un flujo y agrega una tarea para diseñar el primero.",
  "formDesign.eyebrow": "Formulario de tarea",
  "formDesign.title": "Diseñador de formulario",
  "formDesign.reserved": "Aquí podrás diseñar el formulario de esta tarea. Por ahora, vuelve al flujo para continuar con la configuración.",
  "formDesign.backToForms": "Volver a formularios",
  "formDesign.backToWorkflow": "Volver al flujo",
  "workflowDesign.editor.designForm": "Diseñar formulario",
  "workflowDesign.leave.title": "Hay cambios sin guardar",
  "workflowDesign.leave.body": "Guarda el borrador, descarta los cambios o quédate en el diseñador.",
  "workflowDesign.leave.save": "Guardar borrador y salir",
  "workflowDesign.leave.discard": "Descartar y salir",
  "workflowDesign.leave.stay": "Permanecer",
  "app.language.label": "Idioma",
  "app.language.spanish": "Español",
  "app.language.english": "Inglés",
  "home.eyebrow": "Base de beta interna",
  "home.title": "Avanza el trabajo con responsables claros.",
  "home.lede":
    "Moviqo conserva de forma segura las decisiones de cada flujo y ofrece una experiencia accesible en español e inglés.",
  "home.cta.register": "Registrar organización",
  "auth.signIn": "Ingresar",
  "auth.signOut": "Salir",
  "environment.banner.title": "Entorno interno con datos sintéticos",
  "environment.banner.body":
    "Usa este entorno solo para pruebas internas persistentes. No actives clientes ni registres datos reales.",
  "environment.banner.rule1":
    "No uses este entorno para registrar clientes ni para actividades de producción.",
  "environment.banner.rule2":
    "Prohibido ingresar datos reales de negocio, datos personales reales o archivos de producción.",
  "environment.banner.rule3":
    "El análisis de malware en tiempo real, las copias de seguridad independientes y la gestión del ciclo de vida siguen desactivados.",
  "authority.title": "Revisa la información antes de continuar",
  "authority.accessDenied": "No tienes acceso a este elemento de trabajo.",
  "authority.completionRejected":
    "La tarea no se completó. Inténtalo de nuevo después de actualizar el elemento de trabajo.",
  "authority.reviewAssignedWork": "Revisar trabajo asignado",
  "status.ready": "Listo",
  "status.blocked": "Bloqueado",
  "status.needsAttention": "Necesita atención",
  "status.assigned": "Asignada",
  "status.inProgress": "En curso",
  "status.completed": "Completada",
  "validation.required": "Completa este campo para continuar.",
  "validation.generic": "Revisa este campo e intenta de nuevo.",
  "validation.email": "Escribe un correo electrónico válido.",
  "help.requiredField": "Usa una descripción corta y clara.",
  "password.policy.helper":
    "Usa entre 15 y 128 caracteres. Evita contraseñas comunes o expuestas.",
  "password.policy.reveal": "Mostrar contraseña",
  "password.policy.hide": "Ocultar contraseña",
  "registration.eyebrow": "Registro inicial",
  "registration.title": "Registra tu organización y la primera persona responsable.",
  "registration.lede":
    "Completa estos datos y confirma tu correo para activar la organización de forma segura.",
  "registration.form.title": "Formulario de registro",
  "registration.form.body":
    "Revisa el idioma, la región, la zona horaria y la moneda antes de enviar.",
  "registration.errors.title": "Corrige los siguientes datos",
  "registration.errors.documents":
    "Revisa y vuelve a aceptar los documentos vigentes.",
  "registration.errors.form":
    "Revisa los datos del registro e inténtalo de nuevo. Si el problema continúa, contacta a soporte.",
  "registration.identity.title": "Tu identidad",
  "registration.identity.body":
    "Indica quién será la primera persona responsable y cómo accederá.",
  "registration.organization.title": "Organización",
  "registration.organization.body": "Usa el nombre que tu equipo reconocerá.",
  "registration.regional.title": "Preferencias regionales",
  "registration.regional.body":
    "Confirma el idioma, la región, la zona horaria y la moneda sugeridos.",
  "registration.ownerName.label": "Nombre de la persona responsable",
  "registration.organizationName.label": "Nombre de la organización",
  "registration.email.label": "Correo de acceso",
  "registration.password.label": "Contraseña",
  "registration.language.label": "Idioma preferido",
  "registration.region.label": "Región",
  "registration.timezone.label": "Zona horaria",
  "registration.currency.label": "Moneda",
  "registration.consent.title": "Aceptaciones requeridas",
  "registration.consent.body":
    "Debes aceptar los términos beta, el aviso de privacidad y la prohibición de usar datos reales antes de continuar.",
  "registration.documents.current":
    "Documentos vigentes: beta-2026-08-04 y privacy-2026-08-04.",
  "registration.terms.label":
    "Confirmo que acepto los términos beta vigentes para continuar con el registro.",
  "registration.privacy.label":
    "Confirmo que acepto el aviso de privacidad vigente para continuar con el registro.",
  "registration.prohibited.label":
    "Confirmo que no ingresaré datos personales reales, datos de clientes ni archivos de producción.",
  "registration.submit": "Enviar registro",
  "registration.submitting": "Enviando registro",
  "registration.success": "Se envió un enlace de verificación a",
  "registration.failure": "Corrige los datos marcados y vuelve a enviar.",
  "verification.eyebrow": "Verificación de correo",
  "verification.title": "Activa tu organización al confirmar el correo.",
  "verification.lede":
    "Este paso confirma el control de la cuenta antes de habilitar el acceso protegido de la organización.",
  "verification.loading.title": "Verificando enlace",
  "verification.loading.body":
    "Estamos validando este enlace seguro de un solo uso. No cierres esta página.",
  "verification.success.title": "Correo verificado",
  "verification.success.body": "La cuenta quedó verificada para",
  "verification.success.next":
    "Inicia sesión con este correo verificado para continuar.",
  "verification.invalid.title": "No se pudo verificar el enlace",
  "verification.invalid.body":
    "El enlace puede haber expirado, haberse usado o no ser válido. Vuelve al registro para solicitar un enlace nuevo y seguro.",
  "verification.cta.home": "Volver al inicio",
  "verification.cta.register": "Registrar de nuevo",
  "signIn.eyebrow": "Acceso seguro",
  "signIn.title": "Ingresa a Moviqo",
  "signIn.lede": "Usa tu correo verificado para continuar al espacio de trabajo.",
  "signIn.email": "Correo electrónico",
  "signIn.password": "Contraseña",
  "signIn.submit": "Ingresar",
  "signIn.submitting": "Ingresando",
  "signIn.failure": "El correo o la contraseña no coinciden. Revisa los datos e inténtalo de nuevo.",
  "myWork.title": "Mi trabajo",
  "myWork.lede": "Consulta los procesos que puedes iniciar, las tareas pendientes y el trabajo que has realizado.",
  "myWork.primaryNav": "Navegación principal de Mi trabajo",
  "myWork.regionNav": "Navegación de secciones de Mi trabajo",
  "myWork.tabs": "Tareas y procesos",
  "myWork.loading": "Cargando tu trabajo.",
  "myWork.error": "No pudimos cargar esta información. Intenta de nuevo.",
  "myWork.networkError": "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.",
  "myWork.sessionExpired": "Tu sesión terminó. Inicia sesión de nuevo para continuar.",
  "myWork.permissionDenied": "No tienes permiso para ver este trabajo. Tu sesión sigue activa.",
  "myWork.retry": "Actualizar",
  "myWork.sessionLoading": "Estamos validando tu sesión segura.",
  "myWork.myTasks.title": "Mis tareas",
  "myWork.myTasks.summary": "Tareas que necesitan tu atención.",
  "myWork.myTasks.empty": "No tienes tareas pendientes. Cuando te asignen una, aparecerá aquí.",
  "myWork.myTasks.noMatches": "No hay tareas que coincidan con tu búsqueda.",
  "myWork.myTasks.unavailable": "Actualiza para cargar tus tareas.",
  "myWork.myTasks.searchLabel": "Buscar tareas",
  "myWork.myTasks.searchPlaceholder": "Busca por tarea, flujo o proceso",
  "myWork.myTasks.searchAction": "Buscar",
  "myWork.myTasks.loading": "Cargando tus tareas asignadas.",
  "myWork.myTasks.error": "No pudimos cargar tus tareas. Intenta de nuevo en unos momentos.",
  "myWork.myTasks.status": "Estado:",
  "myWork.myTasks.process": "Proceso:",
  "myWork.myTasks.open": "Abrir tarea",
  "myWork.startWorkflows.title": "Iniciar un proceso",
  "myWork.startWorkflows.pageLede": "Elige un flujo publicado para iniciar un proceso nuevo.",
  "myWork.startWorkflows.summary": "Flujos publicados que puedes iniciar.",
  "myWork.startWorkflows.empty": "Todavía no hay flujos para iniciar.",
  "myWork.startWorkflows.emptyAuthor": "Crea un flujo para iniciar",
  "myWork.startWorkflows.emptyMember": "Todavía no hay flujos para iniciar.",
  "myWork.startWorkflows.emptyHelp": "Cuando tu equipo publique un flujo que puedas iniciar, aparecerá aquí.",
  "myWork.startWorkflows.unavailable": "Actualiza para cargar los flujos que puedes iniciar.",
  "myWork.startWorkflows.loading": "Buscando flujos que puedes iniciar.",
  "myWork.startWorkflows.error": "No pudimos cargar los flujos disponibles. Intenta de nuevo en unos momentos.",
  "myWork.startWorkflows.version": "Versión",
  "myWork.startWorkflows.start": "Iniciar",
  "myWork.startWorkflows.starting": "Iniciando",
  "myWork.startWorkflows.startError": "No pudimos iniciar este proceso. Intenta de nuevo.",
  "myWork.startWorkflows.openingTask": "Abriremos la primera tarea del proceso.",
  "myWork.myProcesses.title": "Mis procesos",
  "myWork.myProcesses.summary": "Procesos en los que has participado o que puedes seguir.",
  "myWork.myProcesses.empty": "Aún no hay procesos relacionados contigo. Los que inicies o en los que participes aparecerán aquí.",
  "myWork.myProcesses.noMatches": "No hay procesos que coincidan con tu búsqueda.",
  "myWork.myProcesses.unavailable": "Actualiza para cargar tus procesos.",
  "myWork.myProcesses.loading": "Cargando tus procesos.",
  "myWork.myProcesses.error": "No pudimos cargar tus procesos. Intenta de nuevo en unos momentos.",
  "myWork.myProcesses.tableRegion": "Tabla de procesos; puedes desplazarla horizontalmente si es necesario",
  "myWork.myProcesses.workflowColumn": "Flujo",
  "myWork.myProcesses.referenceColumn": "Proceso",
  "myWork.myProcesses.statusColumn": "Estado",
  "myWork.myProcesses.stepColumn": "Paso actual",
  "myWork.myProcesses.involvementColumn": "Tu participación",
  "myWork.myProcesses.lastActivityColumn": "Última actividad",
  "myWork.myProcesses.actionsColumn": "Acciones",
  "myWork.myProcesses.reference": "Proceso:",
  "myWork.myProcesses.status": "Estado:",
  "myWork.myProcesses.step": "Paso actual:",
  "myWork.myProcesses.involvement": "Tu participación:",
  "myWork.myProcesses.lastActivity": "Última actividad:",
  "myWork.myProcesses.searchLabel": "Buscar procesos completados",
  "myWork.myProcesses.searchPlaceholder": "Busca por proceso, flujo o participación",
  "myWork.myProcesses.searchAction": "Buscar",
  "myWork.myProcesses.discoveryHint": "Usa la búsqueda o cambia de página para encontrar procesos completados anteriores.",
  "myWork.myProcesses.previousPage": "Página anterior",
  "myWork.myProcesses.nextPage": "Página siguiente",
  "myWork.myProcesses.view": "Ver proceso",
  "processDetail.eyebrow": "Proceso completado",
  "processDetail.title": "Detalle del proceso",
  "processDetail.back": "Volver a Mi trabajo",
  "processDetail.loading": "Cargando el seguimiento del proceso.",
  "processDetail.loadError": "No pudimos cargar este proceso. Selecciona Actualizar para volver a cargarlo.",
  "processDetail.retry": "Actualizar",
  "processDetail.reference": "Proceso:",
  "processDetail.version": "Versión:",
  "processDetail.status": "Estado:",
  "processDetail.step": "Paso actual:",
  "processDetail.startedAt": "Inicio:",
  "processDetail.completedAt": "Completado:",
  "processDetail.lastActivity": "Última actividad:",
  "processDetail.contribution": "Tu aporte:",
  "processDetail.timelineTitle": "Línea de tiempo",
  "processDetail.timelineEmpty": "Aún no hay actividad para mostrar.",
  "processDetail.event.processStarted": "Proceso iniciado",
  "processDetail.event.taskProgressSaved": "Avance de tarea guardado",
  "processDetail.event.taskCompleted": "Tarea completada",
  "processDetail.event.processCompleted": "Proceso completado",
  "workflowDesign.create.eyebrow": "Diseño de flujos",
  "workflowDesign.create.title": "Crear flujo",
  "workflowDesign.create.lede":
    "Crea un flujo para organizar las tareas de tu proceso.",
  "workflowDesign.create.body":
    "Usa un nombre claro para identificar el flujo. Después podrás agregar las tareas y definir quién participa.",
  "workflowDesign.create.name": "Nombre del flujo",
  "workflowDesign.create.help":
    "Usa un nombre corto y único que tu equipo pueda reconocer.",
  "workflowDesign.create.submit": "Crear flujo",
  "workflowDesign.create.submitting": "Creando flujo",
  "workflowDesign.create.back": "Volver",
  "workflowDesign.create.error":
    "No pudimos crear el flujo. Revisa el nombre e intenta de nuevo.",
  "workflowDesign.create.conflict":
    "Ese nombre ya está en uso. Elige otro antes de continuar.",
  "workflowDesign.create.cta": "Crear flujo",
  "workflowDesign.authoring.narrowTitle": "Creación disponible en computadoras",
  "workflowDesign.authoring.narrowBody":
    "En dispositivos móviles puedes consultar el contenido. Para crear flujos y formularios, usa una pantalla de al menos 1280 por 720 píxeles.",
  "workflowDesign.draft.title": "Borrador",
  "workflowDesign.draft.revision": "Revisión",
  "workflowDesign.draft.schemaVersion": "Versión del esquema",
  "workflowDesign.draft.save": "Guardar borrador",
  "workflowDesign.editor.eyebrow": "Primer camino ejecutable",
  "workflowDesign.editor.title": "Diseña Inicio, Tarea y Fin",
  "workflowDesign.editor.body":
    "Agrega cada paso, conecta el recorrido y guarda los cambios para continuar.",
  "workflowDesign.editor.guidanceTitle": "Siguiente acción",
  "workflowDesign.editor.guidanceStart": "Agrega Inicio para abrir el flujo.",
  "workflowDesign.editor.guidanceTask": "Agrega Tarea para definir el trabajo mínimo.",
  "workflowDesign.editor.guidanceEnd": "Agrega Fin para cerrar el camino.",
  "workflowDesign.editor.guidanceConnectStartTask": "Conecta Inicio con Tarea para iniciar el camino.",
  "workflowDesign.editor.guidanceConnectTaskEnd": "Conecta Tarea con Fin para completar el camino.",
  "workflowDesign.editor.guidanceSave": "Guarda el borrador para confirmar el recorrido Inicio → Tarea → Fin.",
  "workflowDesign.editor.addStart": "Agregar Inicio",
  "workflowDesign.editor.addTask": "Agregar Tarea",
  "workflowDesign.editor.addEnd": "Agregar Fin",
  "workflowDesign.editor.connectStartTask": "Conectar Inicio con Tarea",
  "workflowDesign.editor.connectTaskEnd": "Conectar Tarea con Fin",
  "workflowDesign.editor.saving": "Guardando borrador",
  "workflowDesign.editor.unsaved": "Cambios sin guardar",
  "workflowDesign.editor.retrying": "Reintentando guardado",
  "workflowDesign.editor.retrySave": "Reintentar guardado",
  "workflowDesign.editor.saveNow": "Guardar ahora",
  "workflowDesign.editor.saveSuccess": "El flujo se guardó correctamente.",
  "workflowDesign.editor.saveError": "No pudimos guardar este borrador. Corrige el camino e intenta de nuevo.",
  "workflowDesign.editor.reloadError": "No pudimos cargar la última versión guardada. Inténtalo de nuevo.",
  "workflowDesign.editor.errorTitle": "Corrige este borrador antes de guardar",
  "workflowDesign.editor.conflictTitle": "Hay una versión más reciente del flujo",
  "workflowDesign.editor.conflictMessage":
    "Otra persona guardó primero. Carga la versión más reciente y vuelve a aplicar tus cambios.",
  "workflowDesign.editor.reloadLatest": "Cargar última versión",
  "workflowDesign.editor.reapplyChanges": "Reaplicar mis cambios",
  "workflowDesign.editor.validatePublication": "Validar publicación",
  "workflowDesign.editor.validatingPublication": "Validando publicación",
  "workflowDesign.editor.publishWorkflow": "Publicar versión",
  "workflowDesign.editor.publishingWorkflow": "Publicando versión",
  "workflowDesign.editor.publishSuccess": "La versión publicada ya está lista para iniciar. Versión",
  "workflowDesign.editor.publishErrorTitle": "No pudimos publicar este flujo",
  "workflowDesign.editor.publishError": "No pudimos publicar este flujo. Revisa la lista de verificación y vuelve a intentarlo.",
  "workflowDesign.editor.checklistTitle": "Lista de verificación para publicar",
  "workflowDesign.editor.checklistBody":
    "Revisa el borrador antes de publicarlo. La lista muestra lo que debes corregir.",
  "workflowDesign.editor.checklistEmpty":
    "Valida el borrador para ver qué debes corregir antes de publicarlo.",
  "workflowDesign.editor.checklistError":
    "No pudimos validar este borrador. Inténtalo de nuevo.",
  "workflowDesign.editor.publicationSetupTitle": "Preparación para publicar",
  "workflowDesign.editor.publicationSetupBody":
    "Define quién puede iniciar el flujo y quién recibe la primera tarea.",
  "workflowDesign.editor.configureStarter": "Configurar inicio",
  "workflowDesign.editor.starterConfigured": "Inicio listo",
  "workflowDesign.editor.configureAssignment": "Configurar asignación",
  "workflowDesign.editor.assignmentConfigured": "Asignación lista",
  "workflowDesign.editor.starterSectionTitle": "Quién puede iniciar",
  "workflowDesign.editor.assignmentSectionTitle": "Quién recibe la primera tarea",
  "workflowDesign.editor.starterAllActiveMembers": "Todas las personas activas",
  "workflowDesign.editor.starterSelectedTeams": "Equipos seleccionados",
  "workflowDesign.editor.starterSelectedMembers": "Personas seleccionadas",
  "workflowDesign.editor.assignmentWorkflowInitiator": "Quien inicia el flujo",
  "workflowDesign.editor.assignmentSpecificMember": "Una persona específica",
  "workflowDesign.editor.starterSummaryPrefix": "Puede iniciar:",
  "workflowDesign.editor.assignmentSummaryPrefix": "Primera tarea para:",
  "workflowDesign.editor.starterEmpty": "Aún no has definido quién puede iniciar este flujo.",
  "workflowDesign.editor.assignmentEmpty": "Selecciona una opción de asignación.",
  "workflowDesign.editor.issue.starterMissing":
    "Falta un detalle antes de publicar: define quién puede iniciar este flujo.",
  "workflowDesign.editor.issue.assignmentMissing":
    "Falta un detalle antes de publicar: define quién recibe la primera tarea.",
  "workflowDesign.editor.issue.startStepInvalid":
    "Agrega exactamente un paso Inicio antes de publicar este flujo.",
  "workflowDesign.editor.issue.firstTaskMissing":
    "Agrega la primera tarea antes de publicar este flujo.",
  "workflowDesign.editor.issue.endStepInvalid":
    "Agrega exactamente un paso Fin antes de publicar este flujo.",
  "workflowDesign.editor.issue.startPathIncomplete":
    "Conecta Inicio con la primera tarea antes de publicar este flujo.",
  "workflowDesign.editor.issue.pathDisconnected":
    "Conecta este paso dentro del camino de Inicio a Fin antes de publicar.",
  "workflowDesign.editor.issue.pathToEndMissing":
    "Conecta este paso para que el flujo llegue a Fin antes de publicar.",
  "workflowDesign.editor.issue.firstTaskFormMissing":
    "Agrega un campo visible al formulario de la primera tarea antes de publicar.",
  "workflowDesign.editor.issue.firstTaskBindingMissingField":
    "Reconecta este campo de la tarea con un campo reutilizable existente antes de publicar.",
  "workflowDesign.editor.issue.firstTaskFormDecorative":
    "Reemplaza el contenido decorativo por una etiqueta de campo visible antes de publicar.",
  "workflowDesign.editor.issueAction.configureStarter": "Configurar inicio",
  "workflowDesign.editor.issueAction.configureAssignment": "Configurar asignación",
  "workflowDesign.editor.issueAction.reviewWorkflowPath": "Revisar camino",
  "workflowDesign.editor.issueAction.openFirstTaskForm": "Abrir formulario",
  "workflowDesign.editor.issueAction.openReusableField": "Abrir campo reutilizable",
  "workflowDesign.editor.previewTitle": "Vista previa del camino",
  "workflowDesign.editor.previewBody": "Esta vista muestra el orden actual del borrador local.",
  "workflowDesign.editor.connectLabel": "Conectar",
  "workflowDesign.editor.startLabel": "Inicio",
  "workflowDesign.editor.taskLabel": "Tarea",
  "workflowDesign.editor.endLabel": "Fin",
  "workflowDesign.editor.startBody": "Abre el flujo.",
  "workflowDesign.editor.taskBody": "Representa el trabajo mínimo.",
  "workflowDesign.editor.endBody": "Cierra el flujo.",
  "workflowDesign.editor.savedTitle": "Último borrador guardado",
  "workflowDesign.editor.savedBody": "Si un cambio no se puede guardar, conservarás esta versión del recorrido.",
  "workflowDesign.editor.savedEmpty": "Aún no hay un recorrido guardado.",
  "workflowDesign.editor.fieldTitle": "Primer campo reutilizable",
  "workflowDesign.editor.fieldBody":
    "Define un campo de texto corto y agrégalo a la primera tarea.",
  "workflowDesign.editor.fieldLabel": "Etiqueta",
  "workflowDesign.editor.fieldHelpText": "Texto de ayuda",
  "workflowDesign.editor.fieldPlaceholder": "Texto de ejemplo",
  "workflowDesign.editor.fieldDefaultValue": "Valor predeterminado",
  "workflowDesign.editor.fieldMinimumLength": "Longitud mínima",
  "workflowDesign.editor.fieldMaximumLength": "Longitud máxima",
  "workflowDesign.editor.addShortText": "Crear texto corto",
  "workflowDesign.editor.updateShortText": "Actualizar texto corto",
  "workflowDesign.editor.addToFirstTask": "Agregar a la primera tarea",
  "workflowDesign.editor.removeFromFirstTask": "Quitar de la primera tarea",
  "workflowDesign.editor.fieldSummaryPrefix": "Campo listo:",
  "workflowDesign.editor.fieldEmpty": "Todavía no has creado un campo reutilizable.",
  "taskForm.eyebrow": "Tarea activa",
  "taskForm.process": "Proceso:",
  "taskForm.status": "Estado:",
  "taskForm.revision": "Revisión:",
  "taskForm.errorTitle": "Corrige este formulario antes de guardar",
  "taskForm.retry": "Reintentar",
  "taskForm.reloadLatest": "Cargar última versión",
  "taskForm.save": "Guardar borrador",
  "taskForm.saving": "Guardando borrador",
  "taskForm.saveSuccess": "El avance se guardó correctamente.",
  "taskForm.completing": "Completando tarea",
  "taskForm.completeSuccess": "La tarea quedó completa y el proceso llegó a su fin.",
  "taskForm.completeError": "No pudimos completar esta tarea. Corrige los datos y vuelve a intentarlo.",
  "taskForm.completeHandoff": "Al terminar, volverás a Mi trabajo.",
  "taskForm.processComplete": "Proceso: Completado",
  "taskForm.saveError": "No pudimos guardar este formulario. Corrige los datos e intenta de nuevo.",
  "taskForm.complete": "Completar tarea",
  "taskForm.back": "Volver a Mi trabajo",
  "taskForm.loading": "Cargando la tarea.",
  "taskForm.loadError": "No pudimos cargar esta tarea. Selecciona Actualizar para volver a cargarla.",
  "taskForm.leave.title": "Hay cambios sin guardar",
  "taskForm.leave.body": "Guarda el formulario, descarta los cambios o permanece en la tarea.",
  "taskForm.leave.save": "Guardar y salir",
  "taskForm.leave.discard": "Descartar y salir",
  "taskForm.leave.stay": "Permanecer",
  "passwordRecovery.eyebrow": "Recuperación segura",
  "passwordRecovery.title": "Recupera tu contraseña",
  "passwordRecovery.lede": "Te enviaremos instrucciones si la cuenta puede recibirlas.",
  "passwordRecovery.email": "Correo electrónico",
  "passwordRecovery.submit": "Enviar instrucciones",
  "passwordRecovery.submitting": "Enviando",
  "passwordRecovery.confirmation": "Si existe una cuenta elegible, recibirás instrucciones para recuperar el acceso.",
  "passwordRecovery.failure": "No pudimos procesar la solicitud. Inténtalo de nuevo.",
  "passwordRecovery.forgotLink": "Olvidé mi contraseña",
  "passwordRecovery.resetTitle": "Define una contraseña nueva",
  "passwordRecovery.resetLede": "Usa una contraseña que cumpla la política de seguridad.",
  "passwordRecovery.password": "Contraseña nueva",
  "passwordRecovery.resetSubmit": "Cambiar contraseña",
  "passwordRecovery.resetting": "Cambiando contraseña",
  "passwordRecovery.resetFailure": "El enlace no es válido o la contraseña no cumple la política.",
  "passwordRecovery.resetComplete": "Tu contraseña fue actualizada. Ahora puedes ingresar.",
  "passwordRecovery.signIn": "Ir a iniciar sesión",
  "passwordRecovery.requestAgain": "Solicitar un enlace nuevo",
  "catalog.title": "Sistema de diseño",
  "catalog.subtitle": "Componentes base para experiencias operativas seguras.",
  "catalog.responsive.title": "Comportamiento responsivo",
  "catalog.responsive.operational":
    "Las superficies operativas se reorganizan en móvil, tableta, portátil y escritorio sin perder la acción requerida.",
  "catalog.responsive.designer":
    "En pantallas estrechas, el diseñador permite consultar y navegar; para crear contenido se requiere una pantalla de al menos 1280 por 720 píxeles.",
  "catalog.metadata.title": "Evidencia del catálogo",
  "catalog.button.title": "Botón principal",
  "catalog.button.responsive": "Mantiene un área práctica de 44 por 44 píxeles y ajusta el texto de la acción.",
  "catalog.button.permitted": "Solo etiquetas de comando propias de Moviqo.",
  "catalog.button.primary": "Guardar borrador",
  "catalog.button.loading": "Guardando",
  "catalog.guidance.title": "Guía",
  "catalog.guidance.responsive": "Apila título, cuerpo y una acción en superficies estrechas.",
  "catalog.guidance.permitted": "Instrucciones generales que no revelan datos del proceso.",
  "catalog.guidance.body": "Revisa los datos autorizados antes de continuar.",
  "catalog.guidance.action": "Continuar",
  "catalog.field.title": "Campo de formulario",
  "catalog.field.responsive": "Mantiene la etiqueta, la ayuda, la entrada y la validación en orden de lectura.",
  "catalog.field.permitted": "Etiquetas propias de Moviqo y valores de ejemplo seguros.",
  "catalog.field.label": "Nombre del proceso",
  "catalog.field.placeholder": "Ejemplo autorizado",
  "catalog.step.title": "Paso guiado",
  "catalog.step.responsive": "Agrupa una decisión con acciones para volver y continuar.",
  "catalog.step.permitted": "Solo muestra instrucciones seguras para completar el paso.",
  "catalog.step.body": "Confirma una decisión antes de avanzar.",
  "catalog.step.back": "Volver",
  "catalog.step.continue": "Continuar",
  "catalog.workflow.title": "Elemento de flujo",
  "catalog.workflow.responsive": "Pasa de lectura horizontal a orden apilado.",
  "catalog.workflow.permitted": "Nombres y explicaciones genéricas del flujo.",
  "catalog.workflow.name": "Revisión inicial",
  "catalog.workflow.body": "Recibe una solicitud y confirma si puede avanzar.",
  "catalog.task.title": "Tarjeta de tarea",
  "catalog.task.responsive": "Prioriza el nombre de la tarea, el estado, la persona responsable y la acción.",
  "catalog.task.permitted": "Solo metadatos autorizados de la tarea.",
  "catalog.task.name": "Revisar solicitud",
  "catalog.task.workflow": "Flujo: Solicitudes internas",
  "catalog.task.assignee": "Asignado a: Equipo de operaciones",
  "catalog.task.action": "Abrir tarea",
  "catalog.assignment.title": "Asignación",
  "catalog.assignment.responsive": "Mantiene juntos el destinatario, la disponibilidad, el estado y la acción al ajustar el ancho.",
  "catalog.assignment.permitted": "Tipo de receptor, nombre seguro y regla de disponibilidad.",
  "catalog.assignment.recipient": "Equipo de operaciones",
  "catalog.assignment.available": "Disponible cuando se publique el flujo.",
  "catalog.assignment.status": "Seleccionado para publicación",
  "catalog.assignment.action": "Cambiar asignación",
  "catalog.publish.title": "Lista de publicación",
  "catalog.publish.responsive": "Las filas de problemas mantienen juntos el estado y el destino de configuración.",
  "catalog.publish.permitted": "Problemas de configuración limitados a detalles seguros del flujo.",
  "catalog.publish.issue": "Falta una persona responsable",
  "catalog.publish.target": "Configurar asignación",
  "catalog.timeline.title": "Línea de tiempo",
  "catalog.timeline.responsive": "Los eventos apilan la persona, la hora, el estado y la posición de la tarea.",
  "catalog.timeline.permitted": "Solo muestra la persona, la hora, el estado y la posición de la tarea.",
  "catalog.timeline.event": "Ana cambió el estado a listo",
  "catalog.timeline.position": "Paso 2 de 4: Revisión",
  "catalog.fallbackOnly": "Texto de respaldo en español"
};

export const englishMessages: Partial<MessageDictionary> = {
  "app.brand.home": "Moviqo home",
  "app.nav.primary": "Primary",
  "app.nav.work": "My work",
  "app.nav.processes": "Processes",
  "app.nav.admin": "Administration",
  "app.nav.designSystem": "Design system",
  "app.nav.dashboard": "My work",
  "app.nav.tasks": "Tasks",
  "app.nav.startProcess": "Start process",
  "app.nav.workflows": "Workflows",
  "app.nav.forms": "Forms",
  "app.skipToContent": "Skip to main content",
  "app.loading": "Loading your workspace...",
  "route.notFound.title": "We could not find this page",
  "route.notFound.body": "The address may be out of date. Return to an available module.",
  "route.notFound.back": "Back to dashboard",
  "route.error.title": "We could not open this module",
  "route.error.body": "Return to the dashboard and try again.",
  "dashboard.title": "Dashboard",
  "dashboard.lede": "Choose the module where you want to continue working.",
  "dashboard.tasks": "Review assigned tasks",
  "dashboard.processes": "View my processes",
  "dashboard.startProcess": "Start an authorized process",
  "dashboard.authoring": "Design workflows and forms",
  "workflowCatalog.title": "Workflows",
  "workflowCatalog.lede": "Open an existing workflow or create a new one.",
  "workflowCatalog.emptyTitle": "Create your first workflow",
  "workflowCatalog.empty": "You do not have any workflows yet. Create the first one to configure your process.",
  "workflowCatalog.loading": "Loading your workflows...",
  "workflowCatalog.error": "You do not have any workflows yet. Create the first one to configure your process.",
  "workflowCatalog.retry": "Refresh",
  "workflowCatalog.open": "Design workflow",
  "workflowCatalog.create": "Create workflow",
  "workflowDesign.route.loading": "Loading the workflow draft...",
  "workflowDesign.route.error": "We could not find this draft. It may have changed or belong to another team.",
  "workflowDesign.route.back": "Back to workflows",
  "formLauncher.title": "Forms",
  "formLauncher.lede": "Select a workflow first, then select a task.",
  "formLauncher.workflow": "Workflow",
  "formLauncher.task": "Task",
  "formLauncher.selectWorkflow": "Select a workflow",
  "formLauncher.selectTask": "Select a task",
  "formLauncher.open": "Design form",
  "formLauncher.noWorkflows": "You do not have any forms yet",
  "formLauncher.emptyStepWorkflow": "Create a process workflow and add at least one task.",
  "formLauncher.emptyStepForm": "Return to Forms to design the fields for that task.",
  "formLauncher.noTasks": "This workflow has no tasks available for design.",
  "formLauncher.unavailable": "You do not have any forms yet. Create a workflow and add a task to design the first one.",
  "formDesign.eyebrow": "Task form",
  "formDesign.title": "Form designer",
  "formDesign.reserved": "Form design will be available here. Return to the workflow to continue configuring its tasks.",
  "formDesign.backToForms": "Back to forms",
  "formDesign.backToWorkflow": "Back to workflow",
  "workflowDesign.editor.designForm": "Design form",
  "workflowDesign.leave.title": "There are unsaved changes",
  "workflowDesign.leave.body": "Save the draft, discard the changes, or stay in the designer.",
  "workflowDesign.leave.save": "Save draft and leave",
  "workflowDesign.leave.discard": "Discard and leave",
  "workflowDesign.leave.stay": "Stay",
  "app.language.label": "Language",
  "app.language.spanish": "Spanish",
  "app.language.english": "English",
  "home.eyebrow": "Internal beta foundation",
  "home.title": "Move work forward with clear ownership.",
  "home.lede":
    "Moviqo keeps workflow decisions on the server while this interface proves the accessible bilingual structure.",
  "home.cta.register": "Register organization",
  "auth.signIn": "Sign in",
  "auth.signOut": "Sign out",
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
  "status.assigned": "Assigned",
  "status.inProgress": "In progress",
  "status.completed": "Completed",
  "validation.required": "Complete this field to continue.",
  "validation.generic": "Review this field and try again.",
  "validation.email": "Enter a valid email address.",
  "help.requiredField": "Use a short and clear description.",
  "password.policy.helper":
    "Use 15 to 128 characters. Avoid common or exposed passwords.",
  "password.policy.reveal": "Show password",
  "password.policy.hide": "Hide password",
  "registration.eyebrow": "Initial onboarding",
  "registration.title": "Register the organization and its first owner.",
  "registration.lede":
    "This request creates a pending organization, pending account, and email verification before any protected data is exposed.",
  "registration.form.title": "Registration form",
  "registration.form.body":
    "Review the language, region, timezone, and currency before sending.",
  "registration.errors.title": "Correct the following details",
  "registration.errors.documents":
    "Review and accept the current documents again.",
  "registration.errors.form":
    "Review the registration details and try again. If the problem continues, contact support.",
  "registration.identity.title": "Your identity",
  "registration.identity.body":
    "Tell us who the first responsible person will be and how they will sign in.",
  "registration.organization.title": "Organization",
  "registration.organization.body": "Use the name your team will recognize.",
  "registration.regional.title": "Regional preferences",
  "registration.regional.body":
    "Confirm the suggested language, region, timezone, and currency.",
  "registration.ownerName.label": "Owner name",
  "registration.organizationName.label": "Organization name",
  "registration.email.label": "Access email",
  "registration.password.label": "Password",
  "registration.language.label": "Preferred language",
  "registration.region.label": "Region",
  "registration.timezone.label": "Timezone",
  "registration.currency.label": "Currency",
  "registration.consent.title": "Required acceptances",
  "registration.consent.body":
    "You must accept the beta terms, privacy notice, and real-data prohibition before continuing.",
  "registration.documents.current":
    "Current documents: beta-2026-08-04 and privacy-2026-08-04.",
  "registration.terms.label":
    "I confirm that I accept the current beta terms to continue with registration.",
  "registration.privacy.label":
    "I confirm that I accept the current privacy notice to continue with registration.",
  "registration.prohibited.label":
    "I confirm that I will not enter real personal data, customer data, or production files.",
  "registration.submit": "Send registration",
  "registration.submitting": "Sending registration",
  "registration.success": "A verification link was sent to",
  "registration.failure": "Correct the marked values and try again.",
  "verification.eyebrow": "Email verification",
  "verification.title": "Activate the organization by confirming the email.",
  "verification.lede":
    "This step confirms account control before the organization gets protected access.",
  "verification.loading.title": "Verifying link",
  "verification.loading.body":
    "We are validating the secure single-use link. Do not close this page.",
  "verification.success.title": "Email verified",
  "verification.success.body":
    "The organization can now continue toward protected access for",
  "verification.success.next":
    "Sign in with this verified email to continue.",
  "verification.invalid.title": "The link could not be verified",
  "verification.invalid.body":
    "The link may be expired, already used, or invalid. Return to registration to request a new safe path.",
  "verification.cta.home": "Return home",
  "verification.cta.register": "Register again",
  "signIn.eyebrow": "Secure access",
  "signIn.title": "Sign in to Moviqo",
  "signIn.lede": "Use your verified email to continue to the workspace.",
  "signIn.email": "Email address",
  "signIn.password": "Password",
  "signIn.submit": "Sign in",
  "signIn.submitting": "Signing in",
  "signIn.failure": "We could not authenticate you. Check your details and try again.",
  "myWork.title": "My work",
  "myWork.lede": "Review what you can start, do, and follow within your active membership.",
  "myWork.primaryNav": "My work primary navigation",
  "myWork.regionNav": "My work region navigation",
  "myWork.tabs": "Tasks and processes",
  "myWork.loading": "Loading your work.",
  "myWork.error": "We could not load this information. Try again.",
  "myWork.networkError": "We could not connect. Check your connection and try again.",
  "myWork.sessionExpired": "Your session ended. Sign in again to continue.",
  "myWork.permissionDenied": "You do not have permission to view this work. Your session remains active.",
  "myWork.retry": "Refresh",
  "myWork.sessionLoading": "We are validating your secure session.",
  "myWork.myTasks.title": "My tasks",
  "myWork.myTasks.summary": "Tasks that need your attention.",
  "myWork.myTasks.empty": "You have no pending tasks. New assignments will appear here.",
  "myWork.myTasks.noMatches": "No tasks match your search.",
  "myWork.myTasks.unavailable": "Refresh to load your tasks.",
  "myWork.myTasks.searchLabel": "Search tasks",
  "myWork.myTasks.searchPlaceholder": "Search by task, workflow, or process",
  "myWork.myTasks.searchAction": "Search",
  "myWork.myTasks.loading": "Loading your assigned tasks.",
  "myWork.myTasks.error": "We could not load your tasks. Try again in a few moments.",
  "myWork.myTasks.status": "Status:",
  "myWork.myTasks.process": "Process:",
  "myWork.myTasks.open": "Open task",
  "myWork.startWorkflows.title": "Start a process",
  "myWork.startWorkflows.pageLede": "Choose a published workflow to start a new process.",
  "myWork.startWorkflows.summary": "Published workflows you can start.",
  "myWork.startWorkflows.empty": "You do not have any workflows created or assigned to start a process.",
  "myWork.startWorkflows.emptyAuthor": "Create a workflow to get started",
  "myWork.startWorkflows.emptyMember": "There are no workflows available to start yet.",
  "myWork.startWorkflows.emptyHelp": "When a published workflow is available to you, it will appear here.",
  "myWork.startWorkflows.unavailable": "Refresh to load the workflows you can start.",
  "myWork.startWorkflows.loading": "Finding workflows you can start.",
  "myWork.startWorkflows.error": "We could not load the available workflows. Try again in a few moments.",
  "myWork.startWorkflows.version": "Version",
  "myWork.startWorkflows.start": "Start",
  "myWork.startWorkflows.starting": "Starting",
  "myWork.startWorkflows.startError": "We could not start this process. Try again.",
  "myWork.startWorkflows.openingTask": "Opening the first authorized task.",
  "myWork.myProcesses.title": "My processes",
  "myWork.myProcesses.summary": "Processes you have participated in or may follow.",
  "myWork.myProcesses.empty": "There are no processes related to you yet. Processes you start or participate in will appear here.",
  "myWork.myProcesses.noMatches": "No processes match your search.",
  "myWork.myProcesses.unavailable": "Refresh to load your processes.",
  "myWork.myProcesses.loading": "Loading your processes.",
  "myWork.myProcesses.error": "We could not load your processes. Try again in a few moments.",
  "myWork.myProcesses.tableRegion": "Process table; scroll horizontally if needed",
  "myWork.myProcesses.workflowColumn": "Workflow",
  "myWork.myProcesses.referenceColumn": "Process",
  "myWork.myProcesses.statusColumn": "Status",
  "myWork.myProcesses.stepColumn": "Current step",
  "myWork.myProcesses.involvementColumn": "Your involvement",
  "myWork.myProcesses.lastActivityColumn": "Last activity",
  "myWork.myProcesses.actionsColumn": "Actions",
  "myWork.myProcesses.reference": "Process:",
  "myWork.myProcesses.status": "Status:",
  "myWork.myProcesses.step": "Current step:",
  "myWork.myProcesses.involvement": "Your involvement:",
  "myWork.myProcesses.lastActivity": "Last activity:",
  "myWork.myProcesses.searchLabel": "Search completed processes",
  "myWork.myProcesses.searchPlaceholder": "Search by process, workflow, or involvement",
  "myWork.myProcesses.searchAction": "Search",
  "myWork.myProcesses.discoveryHint": "Use search or change the page to find older completed processes.",
  "myWork.myProcesses.previousPage": "Previous page",
  "myWork.myProcesses.nextPage": "Next page",
  "myWork.myProcesses.view": "View process",
  "processDetail.eyebrow": "Completed process",
  "processDetail.title": "Process detail",
  "processDetail.back": "Back to My work",
  "processDetail.loading": "Loading the authorized process timeline.",
  "processDetail.loadError": "We could not load this authorized process. Try again.",
  "processDetail.retry": "Retry",
  "processDetail.reference": "Process:",
  "processDetail.version": "Version:",
  "processDetail.status": "Status:",
  "processDetail.step": "Current step:",
  "processDetail.startedAt": "Started:",
  "processDetail.completedAt": "Completed:",
  "processDetail.lastActivity": "Last activity:",
  "processDetail.contribution": "Your contribution:",
  "processDetail.timelineTitle": "Timeline",
  "processDetail.timelineEmpty": "There are no authorized events to show yet.",
  "processDetail.event.processStarted": "Process started",
  "processDetail.event.taskProgressSaved": "Task progress saved",
  "processDetail.event.taskCompleted": "Task completed",
  "processDetail.event.processCompleted": "Process completed",
  "workflowDesign.create.eyebrow": "Workflow design",
  "workflowDesign.create.title": "Create workflow",
  "workflowDesign.create.lede":
    "Create a workflow to organize the tasks in your process.",
  "workflowDesign.create.body":
    "Use a clear name to identify the workflow. You can then add tasks and decide who participates.",
  "workflowDesign.create.name": "Workflow name",
  "workflowDesign.create.help":
    "Use a short, unique name your team will recognize.",
  "workflowDesign.create.submit": "Create workflow",
  "workflowDesign.create.submitting": "Creating workflow",
  "workflowDesign.create.back": "Back",
  "workflowDesign.create.error":
    "We could not create the workflow. Review the name and try again.",
  "workflowDesign.create.conflict":
    "That name is already in use. Choose a different one before continuing.",
  "workflowDesign.create.cta": "Create workflow",
  "workflowDesign.authoring.narrowTitle": "Authoring is available on desktop",
  "workflowDesign.authoring.narrowBody":
    "The mobile view provides light orientation. Full Workflow and Form authoring requires 1280 by 720 px or larger.",
  "workflowDesign.draft.title": "Draft",
  "workflowDesign.draft.revision": "Revision",
  "workflowDesign.draft.schemaVersion": "Schema version",
  "workflowDesign.draft.save": "Save draft",
  "workflowDesign.editor.eyebrow": "First executable path",
  "workflowDesign.editor.title": "Design Start, Task, and End",
  "workflowDesign.editor.body":
    "Add each step with visible controls, connect the path, and save only when the server accepts the revision.",
  "workflowDesign.editor.guidanceTitle": "Next action",
  "workflowDesign.editor.guidanceStart": "Add Start to open the workflow.",
  "workflowDesign.editor.guidanceTask": "Add Task to define the minimum work.",
  "workflowDesign.editor.guidanceEnd": "Add End to close the path.",
  "workflowDesign.editor.guidanceConnectStartTask": "Connect Start to Task to begin the path.",
  "workflowDesign.editor.guidanceConnectTaskEnd": "Connect Task to End to complete the path.",
  "workflowDesign.editor.guidanceSave": "Save the draft to confirm the Start -> Task -> End path.",
  "workflowDesign.editor.addStart": "Add Start",
  "workflowDesign.editor.addTask": "Add Task",
  "workflowDesign.editor.addEnd": "Add End",
  "workflowDesign.editor.connectStartTask": "Connect Start to Task",
  "workflowDesign.editor.connectTaskEnd": "Connect Task to End",
  "workflowDesign.editor.saving": "Saving draft",
  "workflowDesign.editor.unsaved": "Unsaved changes",
  "workflowDesign.editor.retrying": "Retrying save",
  "workflowDesign.editor.retrySave": "Retry save",
  "workflowDesign.editor.saveNow": "Save now",
  "workflowDesign.editor.saveSuccess": "The server saved the authorized path.",
  "workflowDesign.editor.saveError": "We could not save this draft. Correct the path and try again.",
  "workflowDesign.editor.reloadError":
    "We could not reload the latest authorized draft. Try again.",
  "workflowDesign.editor.errorTitle": "Correct this draft before saving",
  "workflowDesign.editor.conflictTitle": "The server has a newer revision",
  "workflowDesign.editor.conflictMessage":
    "Another person saved first. Reload the latest draft and reapply your change.",
  "workflowDesign.editor.reloadLatest": "Reload latest draft",
  "workflowDesign.editor.reapplyChanges": "Reapply my changes",
  "workflowDesign.editor.validatePublication": "Validate publication",
  "workflowDesign.editor.validatingPublication": "Validating publication",
  "workflowDesign.editor.publishWorkflow": "Publish version",
  "workflowDesign.editor.publishingWorkflow": "Publishing version",
  "workflowDesign.editor.publishSuccess": "This published version is now ready to start. Version",
  "workflowDesign.editor.publishErrorTitle": "We could not publish this workflow",
  "workflowDesign.editor.publishError": "We could not publish this workflow. Review the checklist and try again.",
  "workflowDesign.editor.checklistTitle": "Publish checklist",
  "workflowDesign.editor.checklistBody":
    "Validate the current draft without publishing it. Blocking rows stay stable and actionable.",
  "workflowDesign.editor.checklistEmpty":
    "Run validation to see this draft's publication blockers.",
  "workflowDesign.editor.checklistError":
    "We could not validate this draft for publication. Try again.",
  "workflowDesign.editor.publicationSetupTitle": "Publication setup",
  "workflowDesign.editor.publicationSetupBody":
    "Mark when this draft already has a valid decision for who can start the workflow and who receives the first task.",
  "workflowDesign.editor.configureStarter": "Configure starter",
  "workflowDesign.editor.starterConfigured": "Starter ready",
  "workflowDesign.editor.configureAssignment": "Configure assignment",
  "workflowDesign.editor.assignmentConfigured": "Assignment ready",
  "workflowDesign.editor.starterSectionTitle": "Who can start",
  "workflowDesign.editor.assignmentSectionTitle": "Who receives the first task",
  "workflowDesign.editor.starterAllActiveMembers": "All active members",
  "workflowDesign.editor.starterSelectedTeams": "Selected teams",
  "workflowDesign.editor.starterSelectedMembers": "Selected members",
  "workflowDesign.editor.assignmentWorkflowInitiator": "The workflow initiator",
  "workflowDesign.editor.assignmentSpecificMember": "One specific member",
  "workflowDesign.editor.starterSummaryPrefix": "Can start:",
  "workflowDesign.editor.assignmentSummaryPrefix": "First task goes to:",
  "workflowDesign.editor.starterEmpty": "You have not chosen who can start this workflow yet.",
  "workflowDesign.editor.assignmentEmpty": "Choose one assignment option.",
  "workflowDesign.editor.issue.starterMissing":
    "We need one more detail before publishing: choose who can start this workflow.",
  "workflowDesign.editor.issue.assignmentMissing":
    "We need one more detail before publishing: choose who receives the first task.",
  "workflowDesign.editor.issue.startStepInvalid":
    "Add exactly one Start step before publishing this workflow.",
  "workflowDesign.editor.issue.firstTaskMissing":
    "Add the first Task step before publishing this workflow.",
  "workflowDesign.editor.issue.endStepInvalid":
    "Add exactly one End step before publishing this workflow.",
  "workflowDesign.editor.issue.startPathIncomplete":
    "Connect Start to the first Task before publishing this workflow.",
  "workflowDesign.editor.issue.pathDisconnected":
    "Connect this step into the Start to End path before publishing.",
  "workflowDesign.editor.issue.pathToEndMissing":
    "Connect this step so the workflow reaches End before publishing.",
  "workflowDesign.editor.issue.firstTaskFormMissing":
    "Add one visible field to the first Task form before publishing.",
  "workflowDesign.editor.issue.firstTaskBindingMissingField":
    "Reconnect this Task field to an existing reusable field before publishing.",
  "workflowDesign.editor.issue.firstTaskFormDecorative":
    "Replace decorative-only form content with a visible field label before publishing.",
  "workflowDesign.editor.issueAction.configureStarter": "Configure starter",
  "workflowDesign.editor.issueAction.configureAssignment": "Configure assignment",
  "workflowDesign.editor.issueAction.reviewWorkflowPath": "Review workflow path",
  "workflowDesign.editor.issueAction.openFirstTaskForm": "Open first task form",
  "workflowDesign.editor.issueAction.openReusableField": "Open reusable field",
  "workflowDesign.editor.previewTitle": "Path preview",
  "workflowDesign.editor.previewBody": "This view shows the current order of the local draft.",
  "workflowDesign.editor.connectLabel": "Connect",
  "workflowDesign.editor.startLabel": "Start",
  "workflowDesign.editor.taskLabel": "Task",
  "workflowDesign.editor.endLabel": "End",
  "workflowDesign.editor.startBody": "Opens the workflow.",
  "workflowDesign.editor.taskBody": "Represents the minimum work.",
  "workflowDesign.editor.endBody": "Closes the workflow.",
  "workflowDesign.editor.savedTitle": "Last saved draft",
  "workflowDesign.editor.savedBody": "If the server rejects a change, this authorized path remains available.",
  "workflowDesign.editor.savedEmpty": "There is no saved path yet.",
  "workflowDesign.editor.fieldTitle": "First reusable field",
  "workflowDesign.editor.fieldBody":
    "Define one Short text field and place it on the first Task without duplicating its identity.",
  "workflowDesign.editor.fieldLabel": "Label",
  "workflowDesign.editor.fieldHelpText": "Help text",
  "workflowDesign.editor.fieldPlaceholder": "Placeholder",
  "workflowDesign.editor.fieldDefaultValue": "Default value",
  "workflowDesign.editor.fieldMinimumLength": "Minimum length",
  "workflowDesign.editor.fieldMaximumLength": "Maximum length",
  "workflowDesign.editor.addShortText": "Create Short text",
  "workflowDesign.editor.updateShortText": "Update Short text",
  "workflowDesign.editor.addToFirstTask": "Add to first task",
  "workflowDesign.editor.removeFromFirstTask": "Remove from first task",
  "workflowDesign.editor.fieldSummaryPrefix": "Field ready:",
  "workflowDesign.editor.fieldEmpty": "You have not created a reusable field yet.",
  "taskForm.eyebrow": "Active task",
  "taskForm.process": "Process:",
  "taskForm.status": "Status:",
  "taskForm.revision": "Revision:",
  "taskForm.errorTitle": "Correct this form before saving",
  "taskForm.retry": "Retry",
  "taskForm.reloadLatest": "Reload latest",
  "taskForm.save": "Save draft",
  "taskForm.saving": "Saving draft",
  "taskForm.saveSuccess": "The server saved the authorized progress.",
  "taskForm.completing": "Completing task",
  "taskForm.completeSuccess": "The task is complete and the process reached its end.",
  "taskForm.completeError": "We could not complete this task. Correct the values and try again.",
  "taskForm.completeHandoff": "We will return you to My work after confirming the authorized result.",
  "taskForm.processComplete": "Process: Completed",
  "taskForm.saveError": "We could not save this form. Correct the values and try again.",
  "taskForm.complete": "Complete task",
  "taskForm.back": "Back to My work",
  "taskForm.loading": "Loading the authorized task.",
  "taskForm.loadError": "We could not load this authorized task. Try again.",
  "taskForm.leave.title": "There are unsaved changes",
  "taskForm.leave.body": "Save the form, discard the changes, or stay on this task.",
  "taskForm.leave.save": "Save and leave",
  "taskForm.leave.discard": "Discard and leave",
  "taskForm.leave.stay": "Stay",
  "passwordRecovery.eyebrow": "Secure recovery",
  "passwordRecovery.title": "Recover your password",
  "passwordRecovery.lede": "We will send instructions if the account can receive them.",
  "passwordRecovery.email": "Email address",
  "passwordRecovery.submit": "Send instructions",
  "passwordRecovery.submitting": "Sending",
  "passwordRecovery.confirmation": "If an eligible account exists, you will receive instructions to recover access.",
  "passwordRecovery.failure": "We could not process the request. Try again.",
  "passwordRecovery.forgotLink": "Forgot password?",
  "passwordRecovery.resetTitle": "Set a new password",
  "passwordRecovery.resetLede": "Use a password that meets the security policy.",
  "passwordRecovery.password": "New password",
  "passwordRecovery.resetSubmit": "Change password",
  "passwordRecovery.resetting": "Changing password",
  "passwordRecovery.resetFailure": "The link is invalid or the password does not meet the policy.",
  "passwordRecovery.resetComplete": "Your password was updated. You can now sign in.",
  "passwordRecovery.signIn": "Go to sign in",
  "passwordRecovery.requestAgain": "Request a new link",
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
