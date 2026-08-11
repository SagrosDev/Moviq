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
  | "workflowCatalog.eyebrow"
  | "workflowCatalog.title"
  | "workflowCatalog.lede"
  | "workflowCatalog.empty"
  | "workflowCatalog.loading"
  | "workflowCatalog.error"
  | "workflowCatalog.retry"
  | "workflowCatalog.open"
  | "workflowCatalog.create"
  | "workflowDesign.route.loading"
  | "workflowDesign.route.error"
  | "workflowDesign.route.back"
  | "formLauncher.eyebrow"
  | "formLauncher.title"
  | "formLauncher.lede"
  | "formLauncher.workflow"
  | "formLauncher.task"
  | "formLauncher.selectWorkflow"
  | "formLauncher.selectTask"
  | "formLauncher.open"
  | "formLauncher.noWorkflows"
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
  | "myWork.eyebrow"
  | "myWork.title"
  | "myWork.lede"
  | "myWork.primaryNav"
  | "myWork.regionNav"
  | "myWork.loading"
  | "myWork.error"
  | "myWork.permissionDenied"
  | "myWork.retry"
  | "myWork.sessionLoading"
  | "myWork.myTasks.title"
  | "myWork.myTasks.summary"
  | "myWork.myTasks.empty"
  | "myWork.myTasks.status"
  | "myWork.myTasks.process"
  | "myWork.myTasks.open"
  | "myWork.startWorkflows.title"
  | "myWork.startWorkflows.summary"
  | "myWork.startWorkflows.empty"
  | "myWork.startWorkflows.version"
  | "myWork.startWorkflows.start"
  | "myWork.startWorkflows.starting"
  | "myWork.startWorkflows.startError"
  | "myWork.startWorkflows.openingTask"
  | "myWork.myProcesses.title"
  | "myWork.myProcesses.summary"
  | "myWork.myProcesses.empty"
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
  "app.nav.dashboard": "Resumen",
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
  "dashboard.startProcess": "Iniciar un proceso autorizado",
  "dashboard.authoring": "Diseñar flujos y formularios",
  "workflowCatalog.eyebrow": "Autoría",
  "workflowCatalog.title": "Flujos",
  "workflowCatalog.lede": "Abre un borrador autorizado o crea un flujo nuevo.",
  "workflowCatalog.empty": "Todavía no hay flujos autorizados para mostrar.",
  "workflowCatalog.loading": "Cargando flujos autorizados...",
  "workflowCatalog.error": "No pudimos cargar los flujos autorizados.",
  "workflowCatalog.retry": "Intentar de nuevo",
  "workflowCatalog.open": "Diseñar flujo",
  "workflowCatalog.create": "Crear flujo",
  "workflowDesign.route.loading": "Cargando el borrador del flujo...",
  "workflowDesign.route.error": "Este borrador no está disponible. Puede haber cambiado o no estar autorizado.",
  "workflowDesign.route.back": "Volver a flujos",
  "formLauncher.eyebrow": "Autoría",
  "formLauncher.title": "Formularios",
  "formLauncher.lede": "Selecciona primero un flujo autorizado y luego una tarea.",
  "formLauncher.workflow": "Flujo",
  "formLauncher.task": "Tarea",
  "formLauncher.selectWorkflow": "Selecciona un flujo",
  "formLauncher.selectTask": "Selecciona una tarea",
  "formLauncher.open": "Diseñar formulario",
  "formLauncher.noWorkflows": "No hay flujos autorizados disponibles.",
  "formLauncher.noTasks": "Este flujo no tiene tareas disponibles para diseñar.",
  "formLauncher.unavailable": "No pudimos abrir esta selección. Elige de nuevo un flujo y una tarea autorizados.",
  "formDesign.eyebrow": "Formulario de tarea",
  "formDesign.title": "Diseñador de formulario",
  "formDesign.reserved": "El diseño del formulario estará disponible aquí. Vuelve al flujo para continuar configurando sus tareas.",
  "formDesign.backToForms": "Volver a formularios",
  "formDesign.backToWorkflow": "Volver al flujo",
  "workflowDesign.editor.designForm": "Diseñar formulario",
  "workflowDesign.leave.title": "Hay cambios sin guardar",
  "workflowDesign.leave.body": "Guarda el borrador, descarta los cambios o permanece en el diseñador.",
  "workflowDesign.leave.save": "Guardar borrador y salir",
  "workflowDesign.leave.discard": "Descartar y salir",
  "workflowDesign.leave.stay": "Permanecer",
  "app.language.label": "Idioma",
  "app.language.spanish": "Español",
  "app.language.english": "Inglés",
  "home.eyebrow": "Base de beta interna",
  "home.title": "Avanza el trabajo con responsables claros.",
  "home.lede":
    "Moviqo mantiene las decisiones del flujo en el servidor mientras esta interfaz prueba la estructura accesible y bilingüe.",
  "home.cta.register": "Registrar organización",
  "auth.signIn": "Ingresar",
  "auth.signOut": "Salir",
  "environment.banner.title": "Entorno interno con datos sintéticos",
  "environment.banner.body":
    "Usa este entorno solo para pruebas internas persistentes. No actives clientes ni registres datos reales.",
  "environment.banner.rule1":
    "Prohibido usar onboarding de clientes o afirmaciones de producción.",
  "environment.banner.rule2":
    "Prohibido ingresar datos reales de negocio, datos personales reales o archivos de producción.",
  "environment.banner.rule3":
    "Las funciones de malware en vivo, copias independientes y ciclos de vida siguen deshabilitados por compuerta.",
  "authority.title": "Respuesta del servidor requerida",
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
  "registration.eyebrow": "Onboarding inicial",
  "registration.title": "Registra la organización y a su primera persona responsable.",
  "registration.lede":
    "Esta solicitud crea una organización pendiente, una cuenta pendiente y una verificación por correo antes de exponer datos protegidos.",
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
    "Debes aceptar los términos beta, la privacidad y la prohibición de datos reales antes de continuar.",
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
  "verification.title": "Activa la organización al confirmar el correo.",
  "verification.lede":
    "Este paso confirma el control de la cuenta antes de habilitar el acceso protegido de la organización.",
  "verification.loading.title": "Verificando enlace",
  "verification.loading.body":
    "Estamos validando el enlace seguro de un solo uso. No cierres esta pagina.",
  "verification.success.title": "Correo verificado",
  "verification.success.body": "La organización ya puede continuar con acceso protegido para",
  "verification.success.next":
    "Inicia sesión con este correo verificado para continuar.",
  "verification.invalid.title": "No se pudo verificar el enlace",
  "verification.invalid.body":
    "El enlace puede haber expirado, haber sido usado o no ser válido. Vuelve al registro para solicitar un acceso nuevo seguro.",
  "verification.cta.home": "Volver al inicio",
  "verification.cta.register": "Registrar de nuevo",
  "signIn.eyebrow": "Acceso seguro",
  "signIn.title": "Ingresa a Moviqo",
  "signIn.lede": "Usa tu correo verificado para continuar al espacio de trabajo.",
  "signIn.email": "Correo electrónico",
  "signIn.password": "Contraseña",
  "signIn.submit": "Ingresar",
  "signIn.submitting": "Ingresando",
  "signIn.failure": "No pudimos autenticarte. Revisa tus datos e inténtalo de nuevo.",
  "myWork.eyebrow": "Trabajo autenticado",
  "myWork.title": "Mi trabajo",
  "myWork.lede": "Consulta lo que puedes iniciar, atender y seguir dentro de tu membresia activa.",
  "myWork.primaryNav": "Navegacion principal de Mi trabajo",
  "myWork.regionNav": "Navegacion de regiones de Mi trabajo",
  "myWork.loading": "Cargando tu trabajo autorizado.",
  "myWork.error": "No pudimos cargar tu trabajo autorizado. Intenta de nuevo.",
  "myWork.permissionDenied": "No tienes permiso para ver este trabajo. Tu sesion sigue activa.",
  "myWork.retry": "Reintentar",
  "myWork.sessionLoading": "Estamos validando tu sesion segura.",
  "myWork.myTasks.title": "Mis tareas",
  "myWork.myTasks.summary": "Trabajo accionable asignado a tu membresia activa.",
  "myWork.myTasks.empty": "No tienes tareas autorizadas para atender ahora.",
  "myWork.myTasks.status": "Estado:",
  "myWork.myTasks.process": "Proceso:",
  "myWork.myTasks.open": "Abrir tarea",
  "myWork.startWorkflows.title": "Iniciar un proceso",
  "myWork.startWorkflows.summary": "Flujos publicados que tu membresia puede iniciar.",
  "myWork.startWorkflows.empty": "No hay procesos autorizados para iniciar ahora.",
  "myWork.startWorkflows.version": "Version",
  "myWork.startWorkflows.start": "Iniciar",
  "myWork.startWorkflows.starting": "Iniciando",
  "myWork.startWorkflows.startError": "No pudimos iniciar este proceso. Intenta de nuevo.",
  "myWork.startWorkflows.openingTask": "Abriremos la primera tarea autorizada.",
  "myWork.myProcesses.title": "Mis procesos",
  "myWork.myProcesses.summary": "Procesos en los que has participado o que puedes seguir.",
  "myWork.myProcesses.empty": "No tienes procesos autorizados para seguir ahora.",
  "myWork.myProcesses.reference": "Proceso:",
  "myWork.myProcesses.status": "Estado:",
  "myWork.myProcesses.step": "Paso actual:",
  "myWork.myProcesses.involvement": "Tu participacion:",
  "myWork.myProcesses.lastActivity": "Ultima actividad:",
  "myWork.myProcesses.searchLabel": "Buscar procesos completados",
  "myWork.myProcesses.searchPlaceholder": "Busca por proceso, flujo o participacion",
  "myWork.myProcesses.searchAction": "Buscar",
  "myWork.myProcesses.discoveryHint": "Usa la busqueda o cambia de pagina para encontrar procesos completados anteriores.",
  "myWork.myProcesses.previousPage": "Pagina anterior",
  "myWork.myProcesses.nextPage": "Pagina siguiente",
  "myWork.myProcesses.view": "Ver proceso",
  "processDetail.eyebrow": "Proceso completado",
  "processDetail.title": "Detalle del proceso",
  "processDetail.back": "Volver a Mi trabajo",
  "processDetail.loading": "Cargando el seguimiento autorizado del proceso.",
  "processDetail.loadError": "No pudimos cargar este proceso autorizado. Intenta de nuevo.",
  "processDetail.retry": "Reintentar",
  "processDetail.reference": "Proceso:",
  "processDetail.version": "Version:",
  "processDetail.status": "Estado:",
  "processDetail.step": "Paso actual:",
  "processDetail.startedAt": "Inicio:",
  "processDetail.completedAt": "Completado:",
  "processDetail.lastActivity": "Ultima actividad:",
  "processDetail.contribution": "Tu aporte:",
  "processDetail.timelineTitle": "Linea de tiempo",
  "processDetail.timelineEmpty": "Aun no hay eventos autorizados para mostrar.",
  "processDetail.event.processStarted": "Proceso iniciado",
  "processDetail.event.taskProgressSaved": "Avance de tarea guardado",
  "processDetail.event.taskCompleted": "Tarea completada",
  "processDetail.event.processCompleted": "Proceso completado",
  "workflowDesign.create.eyebrow": "Diseno de flujos",
  "workflowDesign.create.title": "Crear flujo",
  "workflowDesign.create.lede":
    "Crea un flujo con un borrador compartido y mutable para comenzar la configuracion.",
  "workflowDesign.create.body":
    "Usa un nombre claro. El servidor devolvera el borrador y la revision autorizados.",
  "workflowDesign.create.name": "Nombre del flujo",
  "workflowDesign.create.help":
    "Usa un nombre corto, claro y unico dentro de tu organizacion.",
  "workflowDesign.create.submit": "Crear flujo",
  "workflowDesign.create.submitting": "Creando flujo",
  "workflowDesign.create.back": "Volver",
  "workflowDesign.create.error":
    "No pudimos crear el flujo. Revisa el nombre e intenta de nuevo.",
  "workflowDesign.create.conflict":
    "Ese nombre ya esta en uso. Elige otro antes de continuar.",
  "workflowDesign.create.cta": "Crear flujo",
  "workflowDesign.authoring.narrowTitle": "Autoria disponible en escritorio",
  "workflowDesign.authoring.narrowBody":
    "La vista movil permite orientacion ligera. La autoria completa de flujos y formularios requiere 1280 por 720 px o mas.",
  "workflowDesign.draft.title": "Borrador",
  "workflowDesign.draft.revision": "Revision",
  "workflowDesign.draft.schemaVersion": "Version de esquema",
  "workflowDesign.draft.save": "Guardar borrador",
  "workflowDesign.editor.eyebrow": "Primer camino ejecutable",
  "workflowDesign.editor.title": "Diseña Inicio, Tarea y Fin",
  "workflowDesign.editor.body":
    "Agrega cada paso con controles visibles, conecta el camino y guarda solo cuando el servidor acepte la revision.",
  "workflowDesign.editor.guidanceTitle": "Siguiente accion",
  "workflowDesign.editor.guidanceStart": "Agrega Inicio para abrir el flujo.",
  "workflowDesign.editor.guidanceTask": "Agrega Tarea para definir el trabajo minimo.",
  "workflowDesign.editor.guidanceEnd": "Agrega Fin para cerrar el camino.",
  "workflowDesign.editor.guidanceConnectStartTask": "Conecta Inicio con Tarea para iniciar el camino.",
  "workflowDesign.editor.guidanceConnectTaskEnd": "Conecta Tarea con Fin para completar el camino.",
  "workflowDesign.editor.guidanceSave": "Guarda el borrador para confirmar el camino Inicio -> Tarea -> Fin.",
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
  "workflowDesign.editor.saveSuccess": "El servidor guardo el camino autorizado.",
  "workflowDesign.editor.saveError": "No pudimos guardar este borrador. Corrige el camino e intenta de nuevo.",
  "workflowDesign.editor.reloadError": "No pudimos recargar la ultima revision autorizada. Intenta de nuevo.",
  "workflowDesign.editor.errorTitle": "Corrige este borrador antes de guardar",
  "workflowDesign.editor.conflictTitle": "El servidor tiene una revision mas reciente",
  "workflowDesign.editor.conflictMessage":
    "Otra persona guardo primero. Recarga el ultimo borrador y reaplica tu cambio.",
  "workflowDesign.editor.reloadLatest": "Recargar ultimo borrador",
  "workflowDesign.editor.reapplyChanges": "Reaplicar mis cambios",
  "workflowDesign.editor.validatePublication": "Validar publicacion",
  "workflowDesign.editor.validatingPublication": "Validando publicacion",
  "workflowDesign.editor.publishWorkflow": "Publicar version",
  "workflowDesign.editor.publishingWorkflow": "Publicando version",
  "workflowDesign.editor.publishSuccess": "La version publicada ya esta lista para iniciar. Version",
  "workflowDesign.editor.publishErrorTitle": "No pudimos publicar este flujo",
  "workflowDesign.editor.publishError": "No pudimos publicar este flujo. Revisa el checklist y vuelve a intentarlo.",
  "workflowDesign.editor.checklistTitle": "Checklist de publicacion",
  "workflowDesign.editor.checklistBody":
    "Valida el borrador actual sin publicarlo. Los bloqueos siguen una lista estable y accionable.",
  "workflowDesign.editor.checklistEmpty":
    "Ejecuta la validacion para ver los bloqueos de publicacion de este borrador.",
  "workflowDesign.editor.checklistError":
    "No pudimos validar este borrador para publicacion. Intenta de nuevo.",
  "workflowDesign.editor.publicationSetupTitle": "Preparacion de publicacion",
  "workflowDesign.editor.publicationSetupBody":
    "Marca cuando el borrador ya tiene una decision valida para quien inicia el flujo y quien recibe la primera tarea.",
  "workflowDesign.editor.configureStarter": "Configurar inicio",
  "workflowDesign.editor.starterConfigured": "Inicio listo",
  "workflowDesign.editor.configureAssignment": "Configurar asignacion",
  "workflowDesign.editor.assignmentConfigured": "Asignacion lista",
  "workflowDesign.editor.starterSectionTitle": "Quien puede iniciar",
  "workflowDesign.editor.assignmentSectionTitle": "Quien recibe la primera tarea",
  "workflowDesign.editor.starterAllActiveMembers": "Todas las personas activas",
  "workflowDesign.editor.starterSelectedTeams": "Equipos seleccionados",
  "workflowDesign.editor.starterSelectedMembers": "Personas seleccionadas",
  "workflowDesign.editor.assignmentWorkflowInitiator": "Quien inicia el flujo",
  "workflowDesign.editor.assignmentSpecificMember": "Una persona especifica",
  "workflowDesign.editor.starterSummaryPrefix": "Puede iniciar:",
  "workflowDesign.editor.assignmentSummaryPrefix": "Primera tarea para:",
  "workflowDesign.editor.starterEmpty": "Aun no definiste quien puede iniciar este flujo.",
  "workflowDesign.editor.assignmentEmpty": "Selecciona una opcion de asignacion.",
  "workflowDesign.editor.issue.starterMissing":
    "Necesitamos un detalle mas antes de publicar: define quien puede iniciar este flujo.",
  "workflowDesign.editor.issue.assignmentMissing":
    "Necesitamos un detalle mas antes de publicar: define quien recibe la primera tarea.",
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
  "workflowDesign.editor.issueAction.configureAssignment": "Configurar asignacion",
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
  "workflowDesign.editor.taskBody": "Representa el trabajo minimo.",
  "workflowDesign.editor.endBody": "Cierra el flujo.",
  "workflowDesign.editor.savedTitle": "Ultimo borrador guardado",
  "workflowDesign.editor.savedBody": "Si el servidor rechaza un cambio, este camino autorizado sigue disponible.",
  "workflowDesign.editor.savedEmpty": "Aun no hay un camino guardado.",
  "workflowDesign.editor.fieldTitle": "Primer campo reutilizable",
  "workflowDesign.editor.fieldBody":
    "Define un campo de texto corto y agregalo a la primera Tarea sin duplicar su identidad.",
  "workflowDesign.editor.fieldLabel": "Etiqueta",
  "workflowDesign.editor.fieldHelpText": "Texto de ayuda",
  "workflowDesign.editor.fieldPlaceholder": "Texto de ejemplo",
  "workflowDesign.editor.fieldDefaultValue": "Valor predeterminado",
  "workflowDesign.editor.fieldMinimumLength": "Longitud minima",
  "workflowDesign.editor.fieldMaximumLength": "Longitud maxima",
  "workflowDesign.editor.addShortText": "Crear texto corto",
  "workflowDesign.editor.updateShortText": "Actualizar texto corto",
  "workflowDesign.editor.addToFirstTask": "Agregar a la primera tarea",
  "workflowDesign.editor.removeFromFirstTask": "Quitar de la primera tarea",
  "workflowDesign.editor.fieldSummaryPrefix": "Campo listo:",
  "workflowDesign.editor.fieldEmpty": "Todavia no has creado un campo reutilizable.",
  "taskForm.eyebrow": "Tarea activa",
  "taskForm.process": "Proceso:",
  "taskForm.status": "Estado:",
  "taskForm.revision": "Revision:",
  "taskForm.errorTitle": "Corrige este formulario antes de guardar",
  "taskForm.retry": "Reintentar",
  "taskForm.reloadLatest": "Recargar lo ultimo",
  "taskForm.save": "Guardar borrador",
  "taskForm.saving": "Guardando borrador",
  "taskForm.saveSuccess": "El servidor guardo el avance autorizado.",
  "taskForm.completing": "Completando tarea",
  "taskForm.completeSuccess": "La tarea quedo completa y el proceso llego a su fin.",
  "taskForm.completeError": "No pudimos completar esta tarea. Corrige los datos y vuelve a intentarlo.",
  "taskForm.completeHandoff": "Te llevaremos de regreso a Mi trabajo despues de confirmar el resultado autorizado.",
  "taskForm.processComplete": "Proceso: Completado",
  "taskForm.saveError": "No pudimos guardar este formulario. Corrige los datos e intenta de nuevo.",
  "taskForm.complete": "Completar tarea",
  "taskForm.back": "Volver a Mi trabajo",
  "taskForm.loading": "Cargando la tarea autorizada.",
  "taskForm.loadError": "No pudimos cargar esta tarea autorizada. Intenta de nuevo.",
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
  "passwordRecovery.signIn": "Ir a ingresar",
  "passwordRecovery.requestAgain": "Solicitar un enlace nuevo",
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
  "app.nav.dashboard": "Dashboard",
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
  "workflowCatalog.eyebrow": "Authoring",
  "workflowCatalog.title": "Workflows",
  "workflowCatalog.lede": "Open an authorized draft or create a new workflow.",
  "workflowCatalog.empty": "There are no authorized workflows to show yet.",
  "workflowCatalog.loading": "Loading authorized workflows...",
  "workflowCatalog.error": "We could not load the authorized workflows.",
  "workflowCatalog.retry": "Try again",
  "workflowCatalog.open": "Design workflow",
  "workflowCatalog.create": "Create workflow",
  "workflowDesign.route.loading": "Loading the workflow draft...",
  "workflowDesign.route.error": "This draft is unavailable. It may have changed or you may not be authorized.",
  "workflowDesign.route.back": "Back to workflows",
  "formLauncher.eyebrow": "Authoring",
  "formLauncher.title": "Forms",
  "formLauncher.lede": "Select an authorized workflow first, then select a task.",
  "formLauncher.workflow": "Workflow",
  "formLauncher.task": "Task",
  "formLauncher.selectWorkflow": "Select a workflow",
  "formLauncher.selectTask": "Select a task",
  "formLauncher.open": "Design form",
  "formLauncher.noWorkflows": "No authorized workflows are available.",
  "formLauncher.noTasks": "This workflow has no tasks available for design.",
  "formLauncher.unavailable": "We could not open this selection. Choose an authorized workflow and task again.",
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
  "myWork.eyebrow": "Authenticated work",
  "myWork.title": "My work",
  "myWork.lede": "Review what you can start, do, and follow within your active membership.",
  "myWork.primaryNav": "My work primary navigation",
  "myWork.regionNav": "My work region navigation",
  "myWork.loading": "Loading your authorized work.",
  "myWork.error": "We could not load your authorized work. Try again.",
  "myWork.permissionDenied": "You do not have permission to view this work. Your session remains active.",
  "myWork.retry": "Retry",
  "myWork.sessionLoading": "We are validating your secure session.",
  "myWork.myTasks.title": "My tasks",
  "myWork.myTasks.summary": "Actionable work assigned to your active membership.",
  "myWork.myTasks.empty": "You do not have any authorized tasks to work on right now.",
  "myWork.myTasks.status": "Status:",
  "myWork.myTasks.process": "Process:",
  "myWork.myTasks.open": "Open task",
  "myWork.startWorkflows.title": "Start a process",
  "myWork.startWorkflows.summary": "Published workflows your membership may start.",
  "myWork.startWorkflows.empty": "There are no authorized processes to start right now.",
  "myWork.startWorkflows.version": "Version",
  "myWork.startWorkflows.start": "Start",
  "myWork.startWorkflows.starting": "Starting",
  "myWork.startWorkflows.startError": "We could not start this process. Try again.",
  "myWork.startWorkflows.openingTask": "Opening the first authorized task.",
  "myWork.myProcesses.title": "My processes",
  "myWork.myProcesses.summary": "Processes you have participated in or may follow.",
  "myWork.myProcesses.empty": "You do not have any authorized processes to follow right now.",
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
    "Create one workflow with a shared mutable draft so configuration can begin safely.",
  "workflowDesign.create.body":
    "Use a clear name. The server returns the authoritative draft and revision.",
  "workflowDesign.create.name": "Workflow name",
  "workflowDesign.create.help":
    "Use a short, clear, unique name inside your organization.",
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
