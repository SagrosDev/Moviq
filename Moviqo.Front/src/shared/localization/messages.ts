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
  | "formLauncher.catalogError"
  | "formDesign.eyebrow"
  | "formDesign.title"
  | "formDesign.reserved"
  | "formDesign.backToForms"
  | "formDesign.backToWorkflow"
  | "formDesign.palette"
  | "formDesign.addAccepted"
  | "formDesign.fields"
  | "formDesign.layout"
  | "formDesign.shortText"
  | "formDesign.section"
  | "formDesign.heading"
  | "formDesign.instruction"
  | "formDesign.divider"
  | "formDesign.canvas"
  | "formDesign.empty"
  | "formDesign.moveUp"
  | "formDesign.moveDown"
  | "formDesign.properties"
  | "formDesign.selectItem"
  | "formDesign.label"
  | "formDesign.helpText"
  | "formDesign.placeholder"
  | "formDesign.defaultValue"
  | "formDesign.required"
  | "formDesign.minimumLength"
  | "formDesign.maximumLength"
  | "formDesign.content"
  | "formDesign.width"
  | "formDesign.width.full"
  | "formDesign.width.half"
  | "formDesign.width.third"
  | "formDesign.width.quarter"
  | "formDesign.remove"
  | "formDesign.saving"
  | "formDesign.saved"
  | "formDesign.unsaved"
  | "formDesign.saveError"
  | "formDesign.save"
  | "formDesign.saveAndReturn"
  | "formDesign.validationTitle"
  | "formDesign.validationBody"
  | "formDesign.validation.labelRequired"
  | "formDesign.validation.contentRequired"
  | "formDesign.validation.minimumGreaterThanMaximum"
  | "formDesign.error.invalidValue"
  | "formDesign.error.unsupportedWidth"
  | "formDesign.error.duplicateIdentifier"
  | "formDesign.error.conflict"
  | "formDesign.preview"
  | "formDesign.default.section"
  | "formDesign.default.heading"
  | "formDesign.default.instruction"
  | "formDesign.dragHandle"
  | "formDesign.dragInstructions"
  | "formDesign.dragStart"
  | "formDesign.dragMove"
  | "formDesign.dragDrop"
  | "formDesign.dragCancel"
  | "formDesign.retry"
  | "formDesign.reloadAndReapply"
  | "formDesign.reloadError"
  | "formDesign.leave.title"
  | "formDesign.leave.body"
  | "formDesign.leave.save"
  | "formDesign.leave.discard"
  | "formDesign.leave.stay"
  | "formDesign.lease.acquiring"
  | "formDesign.lease.readOnly"
  | "formDesign.lease.holder"
  | "formDesign.lease.expires"
  | "formDesign.lease.takeover"
  | "formDesign.lease.takeoverWarning"
  | "formDesign.lease.takeoverConfirm"
  | "formDesign.lease.takeoverCancel"
  | "formDesign.lease.takeoverFailed"
  | "formDesign.lease.lost"
  | "formDesign.lease.unavailable"
  | "workflowDesign.editor.designForm"
  | "workflowDesign.leave.title"
  | "workflowDesign.leave.body"
  | "workflowDesign.leave.save"
  | "workflowDesign.leave.saveAndDesignForm"
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
  | "myWork.myProcesses.involvement.initiator"
  | "myWork.myProcesses.involvement.previousParticipant"
  | "myWork.myProcesses.involvement.participant"
  | "myWork.myProcesses.contribution.initiated"
  | "myWork.myProcesses.contribution.completedTask"
  | "myWork.myProcesses.contribution.participated"
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
  | "processDetail.actor"
  | "processDetail.actor.authorizedMember"
  | "processDetail.taskPosition"
  | "processDetail.position.start"
  | "processDetail.position.end"
  | "processDetail.position.task"
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
  | "workflowDesign.editor.title"
  | "workflowDesign.editor.body"
  | "workflowDesign.editor.paletteTitle"
  | "workflowDesign.editor.paletteBody"
  | "workflowDesign.editor.addAccepted"
  | "workflowDesign.editor.addRejected"
  | "workflowDesign.editor.canvasBody"
  | "workflowDesign.editor.canvasTitle"
  | "workflowDesign.editor.incomingHandle"
  | "workflowDesign.editor.outgoingHandle"
  | "workflowDesign.editor.outlineTitle"
  | "workflowDesign.editor.outlineBody"
  | "workflowDesign.editor.propertiesTitle"
  | "workflowDesign.editor.propertiesBody"
  | "workflowDesign.editor.starterHelp"
  | "workflowDesign.editor.taskAssignmentTitle"
  | "workflowDesign.editor.taskAssignmentHelp"
  | "workflowDesign.editor.deleteElement"
  | "workflowDesign.editor.deleteElementTitle"
  | "workflowDesign.editor.deleteElementBody"
  | "workflowDesign.editor.deleteElementConfirm"
  | "workflowDesign.editor.deleteElementCancel"
  | "workflowDesign.editor.taskName"
  | "workflowDesign.editor.taskNameHelp"
  | "workflowDesign.editor.taskNameRequired"
  | "workflowDesign.editor.taskNameRequiredTitle"
  | "workflowDesign.editor.reviewTaskName"
  | "workflowDesign.editor.unnamedTask"
  | "workflowDesign.editor.noSelection"
  | "workflowDesign.editor.formReady"
  | "workflowDesign.editor.formMissing"
  | "workflowDesign.editor.connectionTitle"
  | "workflowDesign.editor.connectionSource"
  | "workflowDesign.editor.connectionTarget"
  | "workflowDesign.editor.connectionEmpty"
  | "workflowDesign.editor.connectionLabel"
  | "workflowDesign.editor.connectionLabelHelp"
  | "workflowDesign.editor.connectAccepted"
  | "workflowDesign.editor.connectRejected"
  | "workflowDesign.editor.checklistReady"
  | "workflowDesign.editor.saveStatusTitle"
  | "workflowDesign.editor.keyboardSaveHint"
  | "workflowDesign.editor.guidanceTitle"
  | "workflowDesign.editor.guidanceStart"
  | "workflowDesign.editor.guidanceTask"
  | "workflowDesign.editor.guidanceEnd"
  | "workflowDesign.editor.guidanceConnectStartTask"
  | "workflowDesign.editor.guidanceConnectTaskEnd"
  | "workflowDesign.editor.guidanceSave"
  | "workflowDesign.editor.addStart"
  | "workflowDesign.editor.addStartRecovery"
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
  | "workflowDesign.editor.saveInvalidTarget"
  | "workflowDesign.editor.saveTargetCanvas"
  | "workflowDesign.editor.saveTargetStarter"
  | "workflowDesign.editor.saveTargetAssignment"
  | "workflowDesign.editor.saveTargetForm"
  | "workflowDesign.editor.saveTargetDraft"
  | "workflowDesign.editor.reloadError"
  | "workflowDesign.editor.errorTitle"
  | "workflowDesign.editor.conflictTitle"
  | "workflowDesign.editor.conflictMessage"
  | "workflowDesign.editor.reloadLatest"
  | "workflowDesign.editor.reapplyChanges"
  | "workflowDesign.editor.revisionRecoveryMessage"
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
  | "workflowDesign.editor.issue.starterInvalid"
  | "workflowDesign.editor.issue.assignmentMissing"
  | "workflowDesign.editor.issue.assignmentInvalid"
  | "workflowDesign.editor.issue.startStepInvalid"
  | "workflowDesign.editor.issue.firstTaskMissing"
  | "workflowDesign.editor.issue.endStepInvalid"
  | "workflowDesign.editor.issue.startPathIncomplete"
  | "workflowDesign.editor.issue.pathDisconnected"
  | "workflowDesign.editor.issue.pathToEndMissing"
  | "workflowDesign.editor.issue.firstTaskFormMissing"
  | "workflowDesign.editor.issue.firstTaskBindingMissingField"
  | "workflowDesign.editor.issue.firstTaskFormDecorative"
  | "workflowDesign.editor.issue.taskFormMissing"
  | "workflowDesign.editor.issue.taskBindingMissingField"
  | "workflowDesign.editor.issue.taskFormDecorative"
  | "workflowDesign.editor.issue.formItemContentMissing"
  | "workflowDesign.editor.issue.unknown"
  | "workflowDesign.editor.issue.taskContext"
  | "workflowDesign.editor.issueAction.configureStarter"
  | "workflowDesign.editor.issueAction.configureAssignment"
  | "workflowDesign.editor.issueAction.reviewWorkflowPath"
  | "workflowDesign.editor.issueAction.openFirstTaskForm"
  | "workflowDesign.editor.issueAction.openTaskForm"
  | "workflowDesign.editor.flowNodeDescription"
  | "workflowDesign.editor.flowNodeKeyboardDisabled"
  | "workflowDesign.editor.flowNodeMoved"
  | "workflowDesign.editor.flowEdgeDescription"
  | "workflowDesign.editor.flowControls"
  | "workflowDesign.editor.flowZoomIn"
  | "workflowDesign.editor.flowZoomOut"
  | "workflowDesign.editor.flowFitView"
  | "workflowDesign.editor.flowInteractive"
  | "workflowDesign.editor.flowHandle"
  | "workflowDesign.editor.graphSummaryConnection"
  | "workflowDesign.editor.connectionTo"
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
  | "taskForm.taskCompleteSuccess"
  | "taskForm.completeError"
  | "taskForm.completeHandoff"
  | "taskForm.taskCompleteHandoff"
  | "taskForm.processComplete"
  | "taskForm.processContinues"
  | "taskForm.saveError"
  | "taskForm.complete"
  | "taskForm.back"
  | "taskForm.viewProcess"
  | "taskForm.viewWork"
  | "taskForm.loading"
  | "taskForm.loadError"
  | "taskForm.unsupportedItem"
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
  "route.notFound.back": "Volver a Mi trabajo",
  "route.error.title": "No pudimos abrir este módulo",
  "route.error.body": "Vuelve a Mi trabajo e inténtalo de nuevo.",
  "workflowCatalog.title": "Flujos",
  "workflowCatalog.lede": "Abre un flujo existente o crea uno nuevo.",
  "workflowCatalog.emptyTitle": "Crea tu primer flujo",
  "workflowCatalog.empty": "Aún no tienes flujos. Crea el primero para configurar tu proceso.",
  "workflowCatalog.loading": "Cargando tus flujos...",
  "workflowCatalog.error": "No pudimos cargar tus flujos",
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
  "formLauncher.catalogError": "No pudimos cargar tus flujos. Actualiza para intentarlo de nuevo.",
  "formDesign.eyebrow": "Formulario de tarea",
  "formDesign.title": "Diseñador de formulario",
  "formDesign.reserved": "Aquí podrás diseñar el formulario de esta tarea. Por ahora, vuelve al flujo para continuar con la configuración.",
  "formDesign.backToForms": "Volver a formularios",
  "formDesign.backToWorkflow": "Volver al flujo",
  "formDesign.palette": "Paleta del formulario",
  "formDesign.addAccepted": "El elemento se agregó y está seleccionado. Revisa sus propiedades.",
  "formDesign.fields": "Campos",
  "formDesign.layout": "Diseño",
  "formDesign.shortText": "Texto corto",
  "formDesign.section": "Sección",
  "formDesign.heading": "Encabezado",
  "formDesign.instruction": "Texto de instrucciones",
  "formDesign.divider": "Separador",
  "formDesign.canvas": "Lienzo del formulario",
  "formDesign.empty": "Agrega un campo o un elemento de diseño para comenzar.",
  "formDesign.moveUp": "Mover arriba",
  "formDesign.moveDown": "Mover abajo",
  "formDesign.properties": "Propiedades",
  "formDesign.selectItem": "Selecciona un elemento para editar sus propiedades.",
  "formDesign.label": "Etiqueta",
  "formDesign.helpText": "Texto de ayuda",
  "formDesign.placeholder": "Texto de ejemplo",
  "formDesign.defaultValue": "Valor predeterminado",
  "formDesign.required": "Campo obligatorio",
  "formDesign.minimumLength": "Longitud mínima",
  "formDesign.maximumLength": "Longitud máxima",
  "formDesign.content": "Contenido",
  "formDesign.width": "Ancho",
  "formDesign.width.full": "Completo",
  "formDesign.width.half": "Mitad",
  "formDesign.width.third": "Tercio",
  "formDesign.width.quarter": "Cuarto",
  "formDesign.remove": "Eliminar elemento",
  "formDesign.saving": "Guardando borrador",
  "formDesign.saved": "Borrador guardado",
  "formDesign.unsaved": "Cambios sin guardar",
  "formDesign.saveError": "No pudimos guardar el formulario. Conservamos tus cambios para que vuelvas a intentarlo.",
  "formDesign.save": "Guardar borrador",
  "formDesign.saveAndReturn": "Guardar y volver al flujo",
  "formDesign.validationTitle": "El formulario necesita atención",
  "formDesign.validationBody": "Puedes guardar este borrador incompleto, pero corrige los elementos indicados antes de publicar.",
  "formDesign.validation.labelRequired": "Agrega una etiqueta visible para este campo.",
  "formDesign.validation.contentRequired": "Agrega contenido visible para este elemento.",
  "formDesign.validation.minimumGreaterThanMaximum": "La longitud mínima no puede superar la longitud máxima.",
  "formDesign.error.invalidValue": "Revisa este valor antes de volver a guardar.",
  "formDesign.error.unsupportedWidth": "Selecciona un ancho disponible para este elemento.",
  "formDesign.error.duplicateIdentifier": "Recarga el formulario para resolver identificadores duplicados.",
  "formDesign.error.conflict": "Otra persona guardó una versión más reciente de este flujo.",
  "formDesign.preview": "Vista previa",
  "formDesign.default.section": "Nueva sección",
  "formDesign.default.heading": "Nuevo encabezado",
  "formDesign.default.instruction": "Agrega instrucciones para la persona que complete la tarea.",
  "formDesign.dragHandle": "Arrastrar para reordenar",
  "formDesign.dragInstructions": "Presiona la barra espaciadora para tomar el elemento, usa las flechas para moverlo y vuelve a presionar la barra para soltarlo.",
  "formDesign.dragStart": "Elemento tomado.",
  "formDesign.dragMove": "Elemento movido.",
  "formDesign.dragDrop": "Elemento colocado.",
  "formDesign.dragCancel": "Movimiento cancelado.",
  "formDesign.retry": "Reintentar guardado",
  "formDesign.reloadAndReapply": "Cargar la última versión y reaplicar mis cambios",
  "formDesign.reloadError": "No pudimos cargar la última versión. Tus cambios siguen disponibles.",
  "formDesign.leave.title": "Hay cambios del formulario sin guardar",
  "formDesign.leave.body": "Guarda el borrador, descarta los cambios o permanece en el Diseñador de formulario.",
  "formDesign.leave.save": "Guardar y salir",
  "formDesign.leave.discard": "Descartar y salir",
  "formDesign.leave.stay": "Permanecer",
  "formDesign.lease.acquiring": "Preparando una sesión segura de edición del formulario…",
  "formDesign.lease.readOnly": "Este formulario está abierto en modo de solo lectura.",
  "formDesign.lease.holder": "Editando actualmente:",
  "formDesign.lease.expires": "La sesión de edición vence:",
  "formDesign.lease.takeover": "Tomar control de la edición",
  "formDesign.lease.takeoverWarning": "Tomar el control revocará el acceso de edición actual. Los cambios que esa persona no haya guardado podrían perderse.",
  "formDesign.lease.takeoverConfirm": "Confirmar y tomar control",
  "formDesign.lease.takeoverCancel": "Cancelar",
  "formDesign.lease.takeoverFailed": "No pudimos transferir la sesión de edición. Inténtalo de nuevo.",
  "formDesign.lease.lost": "Tu sesión de edición venció o fue transferida. Conservamos los cambios localmente en modo de solo lectura.",
  "formDesign.lease.unavailable": "No pudimos confirmar una sesión de edición. El formulario permanece en modo de solo lectura.",
  "workflowDesign.editor.designForm": "Diseñar formulario",
  "workflowDesign.leave.title": "Hay cambios sin guardar",
  "workflowDesign.leave.body": "Guarda el borrador, descarta los cambios o quédate en el diseñador.",
  "workflowDesign.leave.save": "Guardar borrador y salir",
  "workflowDesign.leave.saveAndDesignForm": "Guardar y diseñar formulario",
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
  "myWork.startWorkflows.starting": "Iniciando el proceso...",
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
  "myWork.myProcesses.involvement.initiator": "Iniciaste este proceso",
  "myWork.myProcesses.involvement.previousParticipant": "Participaste anteriormente",
  "myWork.myProcesses.involvement.participant": "Participaste en este proceso",
  "myWork.myProcesses.contribution.initiated": "Iniciaste este proceso.",
  "myWork.myProcesses.contribution.completedTask": "Completaste una tarea autorizada.",
  "myWork.myProcesses.contribution.participated": "Participaste en este proceso.",
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
  "processDetail.back": "Volver a Mis procesos",
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
  "processDetail.actor": "Persona",
  "processDetail.actor.authorizedMember": "Miembro autorizado",
  "processDetail.taskPosition": "Tarea",
  "processDetail.position.start": "Inicio",
  "processDetail.position.end": "Fin",
  "processDetail.position.task": "Tarea",
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
  "workflowDesign.editor.title": "Diseña tu flujo de trabajo",
  "workflowDesign.editor.body":
    "Agrega cada paso, conecta el recorrido y guarda los cambios para continuar.",
  "workflowDesign.editor.paletteTitle": "Elementos",
  "workflowDesign.editor.paletteBody":
    "Agrega con un clic o el teclado, o arrastra el elemento al lienzo.",
  "workflowDesign.editor.addAccepted": "El elemento se agregó y está seleccionado.",
  "workflowDesign.editor.addRejected":
    "Este borrador ya tiene ese elemento. Inicio y Fin se agregan una sola vez.",
  "workflowDesign.editor.canvasBody":
    "Mueve los pasos o arrastra desde el conector visible de salida hasta el conector de entrada. Con el teclado, activa primero la salida y luego la entrada.",
  "workflowDesign.editor.canvasTitle": "Lienzo del flujo",
  "workflowDesign.editor.incomingHandle": "Conexión de secuencia entrante",
  "workflowDesign.editor.outgoingHandle": "Conexión de secuencia saliente",
  "workflowDesign.editor.outlineTitle": "Esquema accesible",
  "workflowDesign.editor.outlineBody":
    "Selecciona cualquier elemento sin usar gestos de arrastre.",
  "workflowDesign.editor.propertiesTitle": "Propiedades",
  "workflowDesign.editor.propertiesBody":
    "Revisa y configura el elemento seleccionado.",
  "workflowDesign.editor.starterHelp":
    "Define quién tiene permiso para iniciar un proceso nuevo con este flujo. No asigna ninguna tarea.",
  "workflowDesign.editor.taskAssignmentTitle": "Quién recibe esta tarea",
  "workflowDesign.editor.taskAssignmentHelp":
    "Define la persona responsable cuando el proceso llegue a esta tarea.",
  "workflowDesign.editor.deleteElement": "Eliminar elemento",
  "workflowDesign.editor.deleteElementTitle": "¿Eliminar este elemento?",
  "workflowDesign.editor.deleteElementBody":
    "También se eliminarán sus conexiones, su posición y los campos colocados en esta tarea. Los campos reutilizables se conservarán.",
  "workflowDesign.editor.deleteElementConfirm": "Sí, eliminar elemento",
  "workflowDesign.editor.deleteElementCancel": "Cancelar",
  "workflowDesign.editor.taskName": "Nombre de la tarea",
  "workflowDesign.editor.taskNameHelp":
    "Este nombre aparecerá en el trabajo pendiente y los procesos nuevos publicados.",
  "workflowDesign.editor.taskNameRequired": "Escribe un nombre para la tarea antes de guardar.",
  "workflowDesign.editor.taskNameRequiredTitle": "Falta el nombre de una tarea",
  "workflowDesign.editor.reviewTaskName": "Revisar nombre de la tarea",
  "workflowDesign.editor.unnamedTask": "Tarea sin nombre",
  "workflowDesign.editor.noSelection": "Selecciona un paso o una conexión en el lienzo.",
  "workflowDesign.editor.formReady": "Formulario configurado",
  "workflowDesign.editor.formMissing": "Formulario pendiente",
  "workflowDesign.editor.connectionTitle": "Conexión de secuencia",
  "workflowDesign.editor.connectionSource": "Origen",
  "workflowDesign.editor.connectionTarget": "Destino",
  "workflowDesign.editor.connectionEmpty": "Selecciona un elemento",
  "workflowDesign.editor.connectionLabel": "Etiqueta de la conexión",
  "workflowDesign.editor.connectionLabelHelp":
    "Opcional. Explica por qué el flujo continúa por esta conexión.",
  "workflowDesign.editor.connectAccepted": "La conexión se agregó al borrador.",
  "workflowDesign.editor.connectRejected":
    "Esa conexión no cumple el orden o la cantidad permitida para este flujo.",
  "workflowDesign.editor.checklistReady": "El borrador guardado está listo para publicar.",
  "workflowDesign.editor.saveStatusTitle": "Estado del borrador",
  "workflowDesign.editor.keyboardSaveHint": "Atajo: Ctrl o Cmd + S",
  "workflowDesign.editor.guidanceTitle": "Siguiente acción",
  "workflowDesign.editor.guidanceStart": "Agrega Inicio para abrir el flujo.",
  "workflowDesign.editor.guidanceTask": "Agrega Tarea para definir el trabajo mínimo.",
  "workflowDesign.editor.guidanceEnd": "Agrega Fin para cerrar el camino.",
  "workflowDesign.editor.guidanceConnectStartTask": "Conecta Inicio con Tarea para iniciar el camino.",
  "workflowDesign.editor.guidanceConnectTaskEnd": "Conecta Tarea con Fin para completar el camino.",
  "workflowDesign.editor.guidanceSave": "Guarda el borrador para confirmar el recorrido Inicio → Tarea → Fin.",
  "workflowDesign.editor.addStart": "Agregar Inicio",
  "workflowDesign.editor.addStartRecovery": "Restaurar Inicio faltante",
  "workflowDesign.editor.addTask": "Agregar Tarea",
  "workflowDesign.editor.addEnd": "Agregar Fin",
  "workflowDesign.editor.connectStartTask": "Conectar Inicio con Tarea",
  "workflowDesign.editor.connectTaskEnd": "Conectar Tarea con Fin",
  "workflowDesign.editor.saving": "Guardando borrador",
  "workflowDesign.editor.unsaved": "Cambios sin guardar",
  "workflowDesign.editor.retrying": "Reintentando guardado",
  "workflowDesign.editor.retrySave": "Reintentar guardado",
  "workflowDesign.editor.saveNow": "Guardar ahora",
  "workflowDesign.editor.saveSuccess": "Cambios guardados",
  "workflowDesign.editor.saveError": "No pudimos guardar este borrador. Corrige el camino e intenta de nuevo.",
  "workflowDesign.editor.saveInvalidTarget": "Revisa esta parte del borrador y vuelve a guardar.",
  "workflowDesign.editor.saveTargetCanvas": "Camino del flujo",
  "workflowDesign.editor.saveTargetStarter": "Quién puede iniciar",
  "workflowDesign.editor.saveTargetAssignment": "Asignación de la tarea",
  "workflowDesign.editor.saveTargetForm": "Formulario de la tarea",
  "workflowDesign.editor.saveTargetDraft": "Borrador del flujo",
  "workflowDesign.editor.reloadError": "No pudimos cargar la última versión guardada. Inténtalo de nuevo.",
  "workflowDesign.editor.errorTitle": "Corrige este borrador antes de guardar",
  "workflowDesign.editor.conflictTitle": "Hay una versión más reciente del flujo",
  "workflowDesign.editor.conflictMessage":
    "Otra persona guardó primero. Carga la versión más reciente y vuelve a aplicar tus cambios.",
  "workflowDesign.editor.reloadLatest": "Cargar última versión",
  "workflowDesign.editor.reapplyChanges": "Reaplicar mis cambios",
  "workflowDesign.editor.revisionRecoveryMessage":
    "El borrador guardado cambió. Carga la última versión antes de validar o publicar otra vez.",
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
    "Al publicar, se validará el diseño actual y aquí aparecerá cualquier corrección necesaria.",
  "workflowDesign.editor.checklistError":
    "No pudimos validar este borrador. Inténtalo de nuevo.",
  "workflowDesign.editor.publicationSetupTitle": "Preparación para publicar",
  "workflowDesign.editor.publicationSetupBody":
    "Define quién puede iniciar el flujo. La persona responsable se configura en cada tarea.",
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
  "workflowDesign.editor.issue.starterInvalid":
    "La persona o el equipo elegido para iniciar ya no está disponible. Actualiza la selección.",
  "workflowDesign.editor.issue.assignmentMissing":
    "Falta un detalle antes de publicar: define quién recibe esta tarea.",
  "workflowDesign.editor.issue.assignmentInvalid":
    "La persona elegida para esta tarea ya no está disponible. Actualiza la asignación.",
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
    "Agrega una etiqueta a este elemento del formulario antes de publicar.",
  "workflowDesign.editor.issue.taskFormMissing":
    "Agrega un campo visible al formulario de esta tarea antes de publicar.",
  "workflowDesign.editor.issue.taskBindingMissingField":
    "Reconecta este campo de la tarea con un campo reutilizable existente antes de publicar.",
  "workflowDesign.editor.issue.taskFormDecorative":
    "Agrega una etiqueta a este elemento del formulario antes de publicar.",
  "workflowDesign.editor.issue.formItemContentMissing":
    "Agrega contenido visible a este elemento del formulario antes de publicar.",
  "workflowDesign.editor.issue.unknown":
    "Revisa este requisito del flujo antes de publicar.",
  "workflowDesign.editor.issue.taskContext": "Tarea afectada:",
  "workflowDesign.editor.issueAction.configureStarter": "Configurar inicio",
  "workflowDesign.editor.issueAction.configureAssignment": "Configurar asignación",
  "workflowDesign.editor.issueAction.reviewWorkflowPath": "Revisar camino",
  "workflowDesign.editor.issueAction.openFirstTaskForm": "Abrir formulario",
  "workflowDesign.editor.issueAction.openTaskForm": "Abrir formulario de la tarea",
  "workflowDesign.editor.flowNodeDescription":
    "Presiona Entrar o Espacio para seleccionar un paso. Usa las flechas para moverlo.",
  "workflowDesign.editor.flowNodeKeyboardDisabled": "Selecciona este paso para revisar sus propiedades.",
  "workflowDesign.editor.flowNodeMoved": "Paso movido en el lienzo.",
  "workflowDesign.editor.flowEdgeDescription": "Conexión de secuencia entre pasos del flujo.",
  "workflowDesign.editor.flowControls": "Controles del lienzo del flujo",
  "workflowDesign.editor.flowZoomIn": "Acercar lienzo",
  "workflowDesign.editor.flowZoomOut": "Alejar lienzo",
  "workflowDesign.editor.flowFitView": "Ajustar flujo a la vista",
  "workflowDesign.editor.flowInteractive": "Cambiar interacción del lienzo",
  "workflowDesign.editor.flowHandle": "Punto de conexión del flujo",
  "workflowDesign.editor.graphSummaryConnection": "conexión de secuencia",
  "workflowDesign.editor.connectionTo": "hacia",
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
  "taskForm.taskCompleteSuccess": "La tarea quedó completa.",
  "taskForm.completeError": "No pudimos completar esta tarea. Corrige los datos y vuelve a intentarlo.",
  "taskForm.completeHandoff": "La línea de tiempo del proceso ya está disponible para revisión.",
  "taskForm.taskCompleteHandoff": "El proceso continúa con la siguiente tarea. Revisa Mi trabajo para ver si tienes alguna tarea asignada.",
  "taskForm.processComplete": "Proceso: Completado",
  "taskForm.processContinues": "Proceso: En curso",
  "taskForm.saveError": "No pudimos guardar este formulario. Corrige los datos e intenta de nuevo.",
  "taskForm.complete": "Completar tarea",
  "taskForm.back": "Volver a Mi trabajo",
  "taskForm.viewProcess": "Ver línea de tiempo",
  "taskForm.viewWork": "Ver Mi trabajo",
  "taskForm.loading": "Cargando la tarea.",
  "taskForm.loadError": "No pudimos cargar esta tarea. Selecciona Actualizar para volver a cargarla.",
  "taskForm.unsupportedItem": "Este elemento del formulario no es compatible. Vuelve al diseñador y corrígelo.",
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
  "route.notFound.back": "Back to My work",
  "route.error.title": "We could not open this module",
  "route.error.body": "Return to My work and try again.",
  "workflowCatalog.title": "Workflows",
  "workflowCatalog.lede": "Open an existing workflow or create a new one.",
  "workflowCatalog.emptyTitle": "Create your first workflow",
  "workflowCatalog.empty": "You do not have any workflows yet. Create the first one to configure your process.",
  "workflowCatalog.loading": "Loading your workflows...",
  "workflowCatalog.error": "We could not load your workflows",
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
  "formLauncher.catalogError": "We could not load your workflows. Refresh to try again.",
  "formDesign.eyebrow": "Task form",
  "formDesign.title": "Form designer",
  "formDesign.reserved": "Form design will be available here. Return to the workflow to continue configuring its tasks.",
  "formDesign.backToForms": "Back to forms",
  "formDesign.backToWorkflow": "Back to workflow",
  "formDesign.palette": "Form palette",
  "formDesign.addAccepted": "The item was added and selected. Review its properties.",
  "formDesign.fields": "Fields",
  "formDesign.layout": "Layout",
  "formDesign.shortText": "Short text",
  "formDesign.section": "Section",
  "formDesign.heading": "Heading",
  "formDesign.instruction": "Instruction text",
  "formDesign.divider": "Divider",
  "formDesign.canvas": "Form canvas",
  "formDesign.empty": "Add a field or layout item to begin.",
  "formDesign.moveUp": "Move up",
  "formDesign.moveDown": "Move down",
  "formDesign.properties": "Properties",
  "formDesign.selectItem": "Select an item to edit its properties.",
  "formDesign.label": "Label",
  "formDesign.helpText": "Help text",
  "formDesign.placeholder": "Placeholder",
  "formDesign.defaultValue": "Default value",
  "formDesign.required": "Required field",
  "formDesign.minimumLength": "Minimum length",
  "formDesign.maximumLength": "Maximum length",
  "formDesign.content": "Content",
  "formDesign.width": "Width",
  "formDesign.width.full": "Full",
  "formDesign.width.half": "Half",
  "formDesign.width.third": "Third",
  "formDesign.width.quarter": "Quarter",
  "formDesign.remove": "Remove item",
  "formDesign.saving": "Saving draft",
  "formDesign.saved": "Draft saved",
  "formDesign.unsaved": "Unsaved changes",
  "formDesign.saveError": "We could not save the Form. Your changes are preserved so you can try again.",
  "formDesign.save": "Save draft",
  "formDesign.saveAndReturn": "Save and return to workflow",
  "formDesign.validationTitle": "The Form needs attention",
  "formDesign.validationBody": "You can save this incomplete draft, but correct the listed items before publication.",
  "formDesign.validation.labelRequired": "Add a visible label for this field.",
  "formDesign.validation.contentRequired": "Add visible content for this item.",
  "formDesign.validation.minimumGreaterThanMaximum": "Minimum length cannot exceed maximum length.",
  "formDesign.error.invalidValue": "Review this value before saving again.",
  "formDesign.error.unsupportedWidth": "Select an available width for this item.",
  "formDesign.error.duplicateIdentifier": "Reload the Form to resolve duplicate identifiers.",
  "formDesign.error.conflict": "Someone else saved a newer version of this workflow.",
  "formDesign.preview": "Preview",
  "formDesign.default.section": "New section",
  "formDesign.default.heading": "New heading",
  "formDesign.default.instruction": "Add instructions for the person completing this task.",
  "formDesign.dragHandle": "Drag to reorder",
  "formDesign.dragInstructions": "Press Space to pick up the item, use the arrow keys to move it, and press Space again to drop it.",
  "formDesign.dragStart": "Item picked up.",
  "formDesign.dragMove": "Item moved.",
  "formDesign.dragDrop": "Item dropped.",
  "formDesign.dragCancel": "Move cancelled.",
  "formDesign.retry": "Retry save",
  "formDesign.reloadAndReapply": "Load latest and reapply my changes",
  "formDesign.reloadError": "We could not load the latest version. Your changes are still available.",
  "formDesign.leave.title": "There are unsaved Form changes",
  "formDesign.leave.body": "Save the draft, discard your changes, or stay in the Form Designer.",
  "formDesign.leave.save": "Save and leave",
  "formDesign.leave.discard": "Discard and leave",
  "formDesign.leave.stay": "Stay",
  "formDesign.lease.acquiring": "Preparing a secure Form editing session…",
  "formDesign.lease.readOnly": "This Form is open in read-only mode.",
  "formDesign.lease.holder": "Currently editing:",
  "formDesign.lease.expires": "The editing session expires:",
  "formDesign.lease.takeover": "Take over editing",
  "formDesign.lease.takeoverWarning": "Taking control will revoke the current editing access. That person's unsaved changes could be lost.",
  "formDesign.lease.takeoverConfirm": "Confirm and take over",
  "formDesign.lease.takeoverCancel": "Cancel",
  "formDesign.lease.takeoverFailed": "We could not transfer the editing session. Try again.",
  "formDesign.lease.lost": "Your editing session expired or was transferred. Local changes remain available in read-only mode.",
  "formDesign.lease.unavailable": "We could not confirm an editing session. The Form remains read-only.",
  "workflowDesign.editor.designForm": "Design form",
  "workflowDesign.leave.title": "There are unsaved changes",
  "workflowDesign.leave.body": "Save the draft, discard the changes, or stay in the designer.",
  "workflowDesign.leave.save": "Save draft and leave",
  "workflowDesign.leave.saveAndDesignForm": "Save and design form",
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
  "myWork.startWorkflows.starting": "Starting the process...",
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
  "myWork.myProcesses.involvement.initiator": "You started this process",
  "myWork.myProcesses.involvement.previousParticipant": "Previous participant",
  "myWork.myProcesses.involvement.participant": "Process participant",
  "myWork.myProcesses.contribution.initiated": "You started this process.",
  "myWork.myProcesses.contribution.completedTask": "You completed one authorized task.",
  "myWork.myProcesses.contribution.participated": "You participated in this process.",
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
  "processDetail.back": "Back to My processes",
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
  "processDetail.actor": "Person",
  "processDetail.actor.authorizedMember": "Authorized member",
  "processDetail.taskPosition": "Task",
  "processDetail.position.start": "Start",
  "processDetail.position.end": "End",
  "processDetail.position.task": "Task",
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
  "workflowDesign.editor.title": "Design your workflow",
  "workflowDesign.editor.body":
    "Add each step with visible controls, connect the path, and save only when the server accepts the revision.",
  "workflowDesign.editor.paletteTitle": "Elements",
  "workflowDesign.editor.paletteBody":
    "Add with a click or the keyboard, or drag the element onto the canvas.",
  "workflowDesign.editor.addAccepted": "The element was added and selected.",
  "workflowDesign.editor.addRejected":
    "This draft already has that element. Start and End can each be added once.",
  "workflowDesign.editor.canvasBody":
    "Move steps or drag from the visible outgoing connector to an incoming connector. With the keyboard, activate the output and then the input.",
  "workflowDesign.editor.canvasTitle": "Workflow canvas",
  "workflowDesign.editor.incomingHandle": "Incoming sequence connection",
  "workflowDesign.editor.outgoingHandle": "Outgoing sequence connection",
  "workflowDesign.editor.outlineTitle": "Accessible outline",
  "workflowDesign.editor.outlineBody":
    "Select any element without using drag gestures.",
  "workflowDesign.editor.propertiesTitle": "Properties",
  "workflowDesign.editor.propertiesBody":
    "Review and configure the selected element.",
  "workflowDesign.editor.starterHelp":
    "Controls who may start a new process with this workflow. It does not assign any Task.",
  "workflowDesign.editor.taskAssignmentTitle": "Who receives this Task",
  "workflowDesign.editor.taskAssignmentHelp":
    "Controls who becomes responsible when the process reaches this Task.",
  "workflowDesign.editor.deleteElement": "Delete element",
  "workflowDesign.editor.deleteElementTitle": "Delete this element?",
  "workflowDesign.editor.deleteElementBody":
    "Its connections, position, and fields placed on this Task will also be removed. Reusable fields will be kept.",
  "workflowDesign.editor.deleteElementConfirm": "Yes, delete element",
  "workflowDesign.editor.deleteElementCancel": "Cancel",
  "workflowDesign.editor.taskName": "Task name",
  "workflowDesign.editor.taskNameHelp":
    "This name appears in pending work and newly published processes.",
  "workflowDesign.editor.taskNameRequired": "Enter a task name before saving.",
  "workflowDesign.editor.taskNameRequiredTitle": "A Task name is missing",
  "workflowDesign.editor.reviewTaskName": "Review Task name",
  "workflowDesign.editor.unnamedTask": "Unnamed Task",
  "workflowDesign.editor.noSelection": "Select a step or connection on the canvas.",
  "workflowDesign.editor.formReady": "Form configured",
  "workflowDesign.editor.formMissing": "Form pending",
  "workflowDesign.editor.connectionTitle": "Sequence connection",
  "workflowDesign.editor.connectionSource": "Source",
  "workflowDesign.editor.connectionTarget": "Target",
  "workflowDesign.editor.connectionEmpty": "Select an element",
  "workflowDesign.editor.connectionLabel": "Connection label",
  "workflowDesign.editor.connectionLabelHelp":
    "Optional. Explain why the workflow continues through this connection.",
  "workflowDesign.editor.connectAccepted": "The connection was added to the draft.",
  "workflowDesign.editor.connectRejected":
    "That connection does not meet the allowed order or cardinality for this workflow.",
  "workflowDesign.editor.checklistReady": "The saved draft is ready to publish.",
  "workflowDesign.editor.saveStatusTitle": "Draft status",
  "workflowDesign.editor.keyboardSaveHint": "Shortcut: Ctrl or Cmd + S",
  "workflowDesign.editor.guidanceTitle": "Next action",
  "workflowDesign.editor.guidanceStart": "Add Start to open the workflow.",
  "workflowDesign.editor.guidanceTask": "Add Task to define the minimum work.",
  "workflowDesign.editor.guidanceEnd": "Add End to close the path.",
  "workflowDesign.editor.guidanceConnectStartTask": "Connect Start to Task to begin the path.",
  "workflowDesign.editor.guidanceConnectTaskEnd": "Connect Task to End to complete the path.",
  "workflowDesign.editor.guidanceSave": "Save the draft to confirm the Start -> Task -> End path.",
  "workflowDesign.editor.addStart": "Add Start",
  "workflowDesign.editor.addStartRecovery": "Restore missing Start",
  "workflowDesign.editor.addTask": "Add Task",
  "workflowDesign.editor.addEnd": "Add End",
  "workflowDesign.editor.connectStartTask": "Connect Start to Task",
  "workflowDesign.editor.connectTaskEnd": "Connect Task to End",
  "workflowDesign.editor.saving": "Saving draft",
  "workflowDesign.editor.unsaved": "Unsaved changes",
  "workflowDesign.editor.retrying": "Retrying save",
  "workflowDesign.editor.retrySave": "Retry save",
  "workflowDesign.editor.saveNow": "Save now",
  "workflowDesign.editor.saveSuccess": "Changes saved",
  "workflowDesign.editor.saveError": "We could not save this draft. Correct the path and try again.",
  "workflowDesign.editor.saveInvalidTarget": "Review this part of the draft and save again.",
  "workflowDesign.editor.saveTargetCanvas": "Workflow path",
  "workflowDesign.editor.saveTargetStarter": "Who can start",
  "workflowDesign.editor.saveTargetAssignment": "Task assignment",
  "workflowDesign.editor.saveTargetForm": "Task form",
  "workflowDesign.editor.saveTargetDraft": "Workflow draft",
  "workflowDesign.editor.reloadError":
    "We could not reload the latest authorized draft. Try again.",
  "workflowDesign.editor.errorTitle": "Correct this draft before saving",
  "workflowDesign.editor.conflictTitle": "The server has a newer revision",
  "workflowDesign.editor.conflictMessage":
    "Another person saved first. Reload the latest draft and reapply your change.",
  "workflowDesign.editor.reloadLatest": "Reload latest draft",
  "workflowDesign.editor.reapplyChanges": "Reapply my changes",
  "workflowDesign.editor.revisionRecoveryMessage":
    "The saved draft changed. Reload the latest revision before validating or publishing again.",
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
    "Publishing validates the current design; any required corrections will appear here.",
  "workflowDesign.editor.checklistError":
    "We could not validate this draft for publication. Try again.",
  "workflowDesign.editor.publicationSetupTitle": "Publication setup",
  "workflowDesign.editor.publicationSetupBody":
    "Choose who can start the workflow. Configure responsibility separately on each Task.",
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
  "workflowDesign.editor.issue.starterInvalid":
    "A selected starter or team is no longer available. Update the starter selection.",
  "workflowDesign.editor.issue.assignmentMissing":
    "We need one more detail before publishing: choose who receives this Task.",
  "workflowDesign.editor.issue.assignmentInvalid":
    "The selected Task assignee is no longer available. Update the assignment.",
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
    "Add a label to this Form item before publishing.",
  "workflowDesign.editor.issue.taskFormMissing":
    "Add one visible field to this Task form before publishing.",
  "workflowDesign.editor.issue.taskBindingMissingField":
    "Reconnect this Task field to an existing reusable field before publishing.",
  "workflowDesign.editor.issue.taskFormDecorative":
    "Add a label to this Form item before publishing.",
  "workflowDesign.editor.issue.formItemContentMissing":
    "Add visible content to this Form item before publishing.",
  "workflowDesign.editor.issue.unknown":
    "Review this workflow requirement before publishing.",
  "workflowDesign.editor.issue.taskContext": "Affected Task:",
  "workflowDesign.editor.issueAction.configureStarter": "Configure starter",
  "workflowDesign.editor.issueAction.configureAssignment": "Configure assignment",
  "workflowDesign.editor.issueAction.reviewWorkflowPath": "Review workflow path",
  "workflowDesign.editor.issueAction.openFirstTaskForm": "Open first task form",
  "workflowDesign.editor.issueAction.openTaskForm": "Open Task form",
  "workflowDesign.editor.flowNodeDescription":
    "Press Enter or Space to select a step. Use the arrow keys to move it.",
  "workflowDesign.editor.flowNodeKeyboardDisabled": "Select this step to review its properties.",
  "workflowDesign.editor.flowNodeMoved": "Step moved on the canvas.",
  "workflowDesign.editor.flowEdgeDescription": "Sequence connection between workflow steps.",
  "workflowDesign.editor.flowControls": "Workflow canvas controls",
  "workflowDesign.editor.flowZoomIn": "Zoom in",
  "workflowDesign.editor.flowZoomOut": "Zoom out",
  "workflowDesign.editor.flowFitView": "Fit workflow to view",
  "workflowDesign.editor.flowInteractive": "Toggle canvas interaction",
  "workflowDesign.editor.flowHandle": "Workflow connection point",
  "workflowDesign.editor.graphSummaryConnection": "sequence connection",
  "workflowDesign.editor.connectionTo": "to",
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
  "taskForm.taskCompleteSuccess": "The task is complete.",
  "taskForm.completeError": "We could not complete this task. Correct the values and try again.",
  "taskForm.completeHandoff": "The process timeline is now available for review.",
  "taskForm.taskCompleteHandoff": "The process continues with its next task. Review My work for any task assigned to you.",
  "taskForm.processComplete": "Process: Completed",
  "taskForm.processContinues": "Process: In progress",
  "taskForm.saveError": "We could not save this form. Correct the values and try again.",
  "taskForm.complete": "Complete task",
  "taskForm.back": "Back to My work",
  "taskForm.viewProcess": "View process timeline",
  "taskForm.viewWork": "View My work",
  "taskForm.loading": "Loading the authorized task.",
  "taskForm.loadError": "We could not load this authorized task. Try again.",
  "taskForm.unsupportedItem": "This Form item is not supported. Return to the designer and correct it.",
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
