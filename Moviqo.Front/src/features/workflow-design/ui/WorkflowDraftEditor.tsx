import { useEffect, useReducer, useState, type Dispatch } from "react";
import { useLanguage } from "../../../shared/localization";
import { type DraftState } from "../../../shared/drafts";
import { StatusBadge } from "../../../shared/ui/catalog";
import {
  autosaveDelayMs,
  applyWorkflowDraftSave,
  canPublishWorkflow,
  createWorkflowPublishRequestKey,
  publicationIssuesFromInvalidParams,
  shouldScheduleAutosave,
  createPublicationValidationRequestKey,
  createWorkflowDraftEditorState,
  focusChecklistTarget,
  publishWorkflow,
  readWorkflowDraft,
  reduceWorkflowDraftEditorState,
  saveWorkflowDraft,
  summarizeStarterSelection,
  validateWorkflowPublication,
  workflowPathPreview
} from "../model/editor";
import { createWorkflowDraftState } from "../model/draft";
import { createDraftState } from "../../../shared/drafts";
import type {
  WorkflowCreationAccepted,
  WorkflowConfigurationDirectory,
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement,
  WorkflowPublicationIssue
} from "../model/types";

type WorkflowDraftEditorProps = {
  configurationDirectory: WorkflowConfigurationDirectory;
  draftState: DraftState<WorkflowDraftDocument>;
  onAccepted: (
    draftState: DraftState<WorkflowDraftDocument>,
    accepted: WorkflowCreationAccepted
  ) => void;
};

export const WorkflowDraftEditor = ({
  configurationDirectory,
  draftState,
  onAccepted
}: WorkflowDraftEditorProps) => {
  const { t } = useLanguage();
  const [editorState, dispatch] = useReducer(
    reduceWorkflowDraftEditorState,
    draftState,
    createWorkflowDraftEditorState
  );
  const [fieldDraft, setFieldDraft] = useState({
    label: "",
    helpText: "",
    placeholder: "",
    defaultValue: "",
    minimumLength: 0,
    maximumLength: 255
  });

  useEffect(() => {
    dispatch({ type: "server-synced", draftState });
  }, [draftState]);

  useEffect(() => {
    const currentField = editorState.localDraft.processFields[0];
    setFieldDraft({
      label: currentField?.label ?? "",
      helpText: currentField?.helpText ?? "",
      placeholder: currentField?.placeholder ?? "",
      defaultValue: currentField?.defaultValue ?? "",
      minimumLength: currentField?.minimumLength ?? 0,
      maximumLength: currentField?.maximumLength ?? 255
    });
  }, [editorState.localDraft.processFields]);

  const start = editorState.localDraft.elements.find((element) => element.type === "start");
  const firstTask = editorState.localDraft.elements.find((element) => element.type === "task");
  const end = editorState.localDraft.elements.find((element) => element.type === "end");
  const firstField = editorState.localDraft.processFields[0];
  const starterMode =
    editorState.localDraft.publication?.starter.mode ?? "unconfigured";
  const assignmentMode =
    editorState.localDraft.publication?.assignment.mode ?? "unconfigured";
  const starterSummary = summarizeStarterSelection(
    editorState.localDraft,
    configurationDirectory
  );
  const starterSummaryText =
    starterMode === "allActiveMembers"
      ? t("workflowDesign.editor.starterAllActiveMembers")
      : starterSummary;
  const showScopedStarterSelections =
    starterMode === "selectedTeams" || starterMode === "selectedMembers";
  const assignmentMembershipId =
    editorState.localDraft.publication?.assignment.membershipId ?? null;
  const assignmentMember = configurationDirectory.memberships.find(
    (membership) => membership.membershipId === assignmentMembershipId
  );
  const firstBinding = firstTask
    ? editorState.localDraft.formBindings.find(
        (binding) =>
          binding.taskElementId === firstTask.id &&
          binding.fieldId === editorState.localDraft.processFields[0]?.id
      )
    : undefined;
  const elementLabels = {
    start: t("workflowDesign.editor.startLabel"),
    task: t("workflowDesign.editor.taskLabel"),
    end: t("workflowDesign.editor.endLabel")
  };

  const startConnectedToTask =
    start && firstTask
      ? editorState.localDraft.connections.some(
          (connection) =>
            connection.sourceId === start.id && connection.targetId === firstTask.id
        )
      : false;
  const taskConnectedToEnd =
    firstTask && end
      ? editorState.localDraft.connections.some(
          (connection) =>
            connection.sourceId === firstTask.id && connection.targetId === end.id
        )
      : false;
  const isEditingDisabled =
    (editorState.saveStatus === "saving" || editorState.saveStatus === "retrying") ||
    editorState.publicationStatus === "validating";
  const publishDisabled =
    !canPublishWorkflow(editorState) ||
    editorState.saveStatus === "conflict" ||
    editorState.saveStatus === "error";

  const save = async (retry = false) => {
    const requestKey = editorState.pendingAutosaveRequestKey;
    if (!requestKey) {
      return;
    }
    dispatch({ type: "save-requested", requestKey, retry });
    const expectedRevision = editorState.lastAcknowledgedRevision;
    const result = await saveWorkflowDraft(expectedRevision, editorState.localDraft, requestKey);

    if (!result.ok) {
      const conflict = result.error.code === "workflow_draft_revision_conflict";
      dispatch({
        type: "save-failed",
        errorCode: result.error.code,
        invalidFieldNames:
          result.error.invalidParams?.map((entry) => entry.name) ?? [], 
        errorMessages:
          result.error.invalidParams?.map((entry) => entry.reason) ??
          [t("workflowDesign.editor.saveError")],
        retryable:
          !conflict &&
          result.error.code !== "workflow_draft_invalid" &&
          result.error.code !== "idempotency_key_reused",
        conflict
      });
      return;
    }

    const nextDraftState = applyWorkflowDraftSave(
      createDraftState(draftState.value, expectedRevision),
      result.data,
      expectedRevision
    );
    onAccepted(nextDraftState, result.data);
    dispatch({ type: "save-succeeded", draftState: nextDraftState });
  };

  useEffect(() => {
    if (!shouldScheduleAutosave(editorState)) {
      return;
    }
    const delay = autosaveDelayMs(editorState);
    if (delay === null) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      void save(editorState.saveStatus === "retrying");
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    draftState,
    editorState.hasLocalChanges,
    editorState.lastAcknowledgedRevision,
    editorState.localDraft,
    editorState.pendingAutosaveRequestKey,
    editorState.retryCount,
    editorState.saveStatus
  ]);

  const reloadLatestDraft = async () => {
    const result = await readWorkflowDraft(editorState.localDraft.workflowId);
    if (!result.ok) {
      dispatch({
        type: "save-failed",
        errorCode: result.error.code,
        invalidFieldNames: result.error.invalidParams?.map((entry) => entry.name) ?? [],
        errorMessages:
          result.error.invalidParams?.map((entry) => entry.reason) ??
          [t("workflowDesign.editor.reloadError")],
        retryable: false,
        conflict: true
      });
      return;
    }

    const nextDraftState = createWorkflowDraftState(result.data);
    onAccepted(nextDraftState, result.data);
    dispatch({ type: "reload-latest-succeeded", draftState: nextDraftState });
  };

  const validatePublication = async () => {
    const requestKey = createPublicationValidationRequestKey(
      editorState.localDraft.workflowId
    );
    dispatch({ type: "publication-validation-requested", requestKey });
    const result = await validateWorkflowPublication(
      draftState,
      editorState.localDraft,
      requestKey
    );

    if (!result.ok) {
      dispatch({
        type: "publication-validation-failed",
        requestKey,
        errorCode: result.error.code,
        errorMessage:
          result.error.invalidParams?.map((entry) => entry.reason).join(" ") ||
          t("workflowDesign.editor.checklistError")
      });
      return;
    }

    dispatch({
      type: "publication-validation-succeeded",
      requestKey,
      validation: result.data
    });
  };

  const publish = async () => {
    if (!canPublishWorkflow(editorState)) {
      return;
    }

    const requestKey = createWorkflowPublishRequestKey(editorState.localDraft.workflowId);
    dispatch({ type: "publish-requested", requestKey });
    const result = await publishWorkflow(
      editorState.lastAcknowledgedRevision,
      editorState.localDraft,
      requestKey
    );

    if (!result.ok) {
      dispatch({
        type: "publish-failed",
        requestKey,
        errorCode: result.error.code,
        errorMessage:
          result.error.invalidParams?.map((entry) => entry.reason).join(" ") ||
          t("workflowDesign.editor.publishError"),
        issues: publicationIssuesFromInvalidParams(result.error.invalidParams)
      });
      return;
    }

    const nextDraftState = createDraftState(
      result.data.draft,
      result.data.revision as DraftState<WorkflowDraftDocument>["revision"]
    );
    onAccepted(nextDraftState, result.data);
    dispatch({
      type: "publish-succeeded",
      requestKey,
      accepted: result.data
    });
  };

  const updateFieldDraft = (
    key: keyof typeof fieldDraft,
    value: string | number
  ) => {
    setFieldDraft((current) => ({
      ...current,
      [key]: value
    }));
  };

  const fieldMessagesFor = (...suffixes: string[]) =>
    errorMessagesFor(editorState.invalidFieldNames, editorState.errorMessages, suffixes);

  const labelErrors = fieldMessagesFor(".label");
  const minimumLengthErrors = fieldMessagesFor(".minimumLength");
  const maximumLengthErrors = fieldMessagesFor(".maximumLength");
  const bindingErrors = fieldMessagesFor(".taskElementId", ".fieldId");

  return <section className="workflow-editor" aria-labelledby="workflow-editor-title">
    <article className="status-panel" aria-labelledby="workflow-editor-title">
      <p className="eyebrow">{t("workflowDesign.editor.eyebrow")}</p>
      <h2 id="workflow-editor-title">{t("workflowDesign.editor.title")}</h2>
      <p>{t("workflowDesign.editor.body")}</p>
      <div className="workflow-editor__meta">
        <span>{t("workflowDesign.draft.revision")} {draftState.revision}</span>
        <span>{t("workflowDesign.draft.schemaVersion")} {draftState.value.schemaVersion}</span>
      </div>
    </article>

    <article className="workflow-guidance">
      <h3>{t("workflowDesign.editor.guidanceTitle")}</h3>
      <p>{nextGuidanceMessage(t, start, firstTask, end, startConnectedToTask, taskConnectedToEnd)}</p>
      <div className="button-row">
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={Boolean(start) || isEditingDisabled}
          onClick={() => dispatch({ type: "start-added", labels: elementLabels })}
        >
          {t("workflowDesign.editor.addStart")}
        </button>
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={Boolean(firstTask) || isEditingDisabled}
          onClick={() => dispatch({ type: "task-added", labels: elementLabels })}
        >
          {t("workflowDesign.editor.addTask")}
        </button>
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={Boolean(end) || isEditingDisabled}
          onClick={() => dispatch({ type: "end-added", labels: elementLabels })}
        >
          {t("workflowDesign.editor.addEnd")}
        </button>
      </div>
      <div className="button-row">
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={!start || !firstTask || startConnectedToTask || isEditingDisabled}
          onClick={() =>
            start && firstTask
              ? dispatch({
                  type: "connected",
                  sourceId: start.id,
                  targetId: firstTask.id
                })
              : undefined
          }
        >
          {t("workflowDesign.editor.connectStartTask")}
        </button>
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={!firstTask || !end || taskConnectedToEnd || isEditingDisabled}
          onClick={() =>
            firstTask && end
              ? dispatch({
                  type: "connected",
                  sourceId: firstTask.id,
                  targetId: end.id
                })
              : undefined
          }
        >
          {t("workflowDesign.editor.connectTaskEnd")}
        </button>
        <button
          className="button"
          type="button"
          disabled={isEditingDisabled || !editorState.hasLocalChanges}
          onClick={() => void save(false)}
        >
          {editorState.saveStatus === "saving" || editorState.saveStatus === "retrying"
            ? t("workflowDesign.editor.saving")
            : t("workflowDesign.editor.saveNow")}
        </button>
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={isEditingDisabled || editorState.publishStatus === "publishing"}
          onClick={() => void validatePublication()}
        >
          {editorState.publicationStatus === "validating"
            ? t("workflowDesign.editor.validatingPublication")
            : t("workflowDesign.editor.validatePublication")}
        </button>
        <button
          className="button"
          type="button"
          disabled={publishDisabled}
          onClick={() => void publish()}
        >
          {editorState.publishStatus === "publishing"
            ? t("workflowDesign.editor.publishingWorkflow")
            : t("workflowDesign.editor.publishWorkflow")}
        </button>
      </div>
      <p className="success-message" aria-live="polite">
        {editorState.publishStatus === "success" && editorState.publishedVersion
          ? `${t("workflowDesign.editor.publishSuccess")} ${editorState.publishedVersion.versionNumber}.`
          : editorState.saveStatus === "saved"
          ? t("workflowDesign.editor.saveSuccess")
          : editorState.saveStatus === "saving"
            ? t("workflowDesign.editor.saving")
            : editorState.saveStatus === "retrying"
              ? t("workflowDesign.editor.retrying")
              : editorState.saveStatus === "unsaved"
                ? t("workflowDesign.editor.unsaved")
                : editorState.saveStatus === "conflict"
                  ? t("workflowDesign.editor.conflictMessage")
                  : null}
      </p>
      {editorState.publishStatus === "error" && editorState.publishErrorMessage ? (
        <div className="workflow-editor__errors" role="alert">
          <strong>{t("workflowDesign.editor.publishErrorTitle")}</strong>
          <p>{editorState.publishErrorMessage}</p>
        </div>
      ) : null}
      {editorState.errorMessages.length > 0 ? (
        <div className="workflow-editor__errors" role="alert">
          <strong>{editorState.errorCode === "workflow_draft_revision_conflict"
            ? t("workflowDesign.editor.conflictTitle")
            : t("workflowDesign.editor.errorTitle")}</strong>
          <ul>
            {editorState.errorMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          {editorState.saveStatus === "conflict" ? (
            <div className="button-row">
              <button
                className="button"
                type="button"
                onClick={() => void reloadLatestDraft()}
              >
                {t("workflowDesign.editor.reloadLatest")}
              </button>
              <button
                className="button"
                data-variant="secondary"
                type="button"
                disabled={!editorState.conflictSnapshot}
                onClick={() => dispatch({ type: "reapply-conflict-draft" })}
              >
                {t("workflowDesign.editor.reapplyChanges")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>

    <article className="workflow-guidance" aria-labelledby="workflow-publication-setup-title">
      <h3 id="workflow-publication-setup-title">
        {t("workflowDesign.editor.publicationSetupTitle")}
      </h3>
      <p>{t("workflowDesign.editor.publicationSetupBody")}</p>
      <div className="workflow-editor__field-grid">
        <fieldset id="workflow-starter-config-button" tabIndex={-1}>
          <legend>{t("workflowDesign.editor.starterSectionTitle")}</legend>
          <label>
            <input
              checked={starterMode === "allActiveMembers"}
              name="starter-mode"
              type="radio"
              disabled={isEditingDisabled}
              onChange={() =>
                dispatch({ type: "starter-mode-selected", mode: "allActiveMembers" })
              }
            />
            <span>{t("workflowDesign.editor.starterAllActiveMembers")}</span>
          </label>
          <label>
            <input
              checked={starterMode === "selectedTeams"}
              name="starter-mode"
              type="radio"
              disabled={isEditingDisabled}
              onChange={() =>
                dispatch({ type: "starter-mode-selected", mode: "selectedTeams" })
              }
            />
            <span>{t("workflowDesign.editor.starterSelectedTeams")}</span>
          </label>
          {showScopedStarterSelections ? (
            <div role="group" aria-label={t("workflowDesign.editor.starterSelectedTeams")}>
              {configurationDirectory.teams.map((team) => (
                <label key={team.teamId}>
                  <input
                    checked={
                      editorState.localDraft.publication?.starter.teamIds.includes(team.teamId) ??
                      false
                    }
                    type="checkbox"
                    disabled={isEditingDisabled}
                    onChange={() =>
                      dispatch({ type: "starter-team-toggled", teamId: team.teamId })
                    }
                  />
                  <span>{team.name}</span>
                </label>
              ))}
            </div>
          ) : null}
          <label>
            <input
              checked={starterMode === "selectedMembers"}
              name="starter-mode"
              type="radio"
              disabled={isEditingDisabled}
              onChange={() =>
                dispatch({ type: "starter-mode-selected", mode: "selectedMembers" })
              }
            />
            <span>{t("workflowDesign.editor.starterSelectedMembers")}</span>
          </label>
          {showScopedStarterSelections ? (
            <div role="group" aria-label={t("workflowDesign.editor.starterSelectedMembers")}>
              {configurationDirectory.memberships.map((membership) => (
                <label key={membership.membershipId}>
                  <input
                    checked={
                      editorState.localDraft.publication?.starter.membershipIds.includes(
                        membership.membershipId
                      ) ?? false
                    }
                    type="checkbox"
                    disabled={isEditingDisabled}
                    onChange={() =>
                      dispatch({
                        type: "starter-membership-toggled",
                        membershipId: membership.membershipId
                      })
                    }
                  />
                  <span>{membership.displayName}</span>
                </label>
              ))}
            </div>
          ) : null}
          <p>
            {starterSummaryText
              ? `${t("workflowDesign.editor.starterSummaryPrefix")} ${starterSummaryText}`
              : t("workflowDesign.editor.starterEmpty")}
          </p>
        </fieldset>

        <fieldset id="workflow-assignment-config-button" tabIndex={-1}>
          <legend>{t("workflowDesign.editor.assignmentSectionTitle")}</legend>
          <label>
            <input
              checked={assignmentMode === "workflowInitiator"}
              name="assignment-mode"
              type="radio"
              disabled={isEditingDisabled}
              onChange={() =>
                dispatch({
                  type: "assignment-mode-selected",
                  mode: "workflowInitiator"
                })
              }
            />
            <span>{t("workflowDesign.editor.assignmentWorkflowInitiator")}</span>
          </label>
          <label>
            <input
              checked={assignmentMode === "specificMember"}
              name="assignment-mode"
              type="radio"
              disabled={isEditingDisabled}
              onChange={() =>
                dispatch({
                  type: "assignment-mode-selected",
                  mode: "specificMember"
                })
              }
            />
            <span>{t("workflowDesign.editor.assignmentSpecificMember")}</span>
          </label>
          {assignmentMode === "specificMember" ? (
            <label>
              <span>{t("workflowDesign.editor.assignmentSpecificMember")}</span>
              <select
                disabled={isEditingDisabled}
                value={assignmentMembershipId ?? ""}
                onChange={(event) =>
                  dispatch({
                    type: "assignment-membership-selected",
                    membershipId: event.target.value
                  })
                }
              >
                <option value="">{t("workflowDesign.editor.assignmentEmpty")}</option>
                {configurationDirectory.memberships.map((membership) => (
                  <option key={membership.membershipId} value={membership.membershipId}>
                    {membership.displayName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p>
            {assignmentMode === "workflowInitiator"
              ? `${t("workflowDesign.editor.assignmentSummaryPrefix")} ${t("workflowDesign.editor.assignmentWorkflowInitiator")}`
              : assignmentMember
                ? `${t("workflowDesign.editor.assignmentSummaryPrefix")} ${assignmentMember.displayName}`
                : t("workflowDesign.editor.assignmentEmpty")}
          </p>
        </fieldset>
      </div>
    </article>

    <article className="workflow-guidance publish-checklist" aria-labelledby="workflow-checklist-title">
      <h3 id="workflow-checklist-title" tabIndex={-1}>{t("workflowDesign.editor.checklistTitle")}</h3>
      <p>{t("workflowDesign.editor.checklistBody")}</p>
      {editorState.publicationStatus === "error" ? (
        <div className="workflow-editor__errors" role="alert">
          <strong>{t("workflowDesign.editor.errorTitle")}</strong>
          <p>{t("workflowDesign.editor.checklistError")}</p>
        </div>
      ) : null}
      {editorState.publicationIssues.length > 0 ? (
        <ul>
          {editorState.publicationIssues.map((issue) => (
            <li key={`${issue.code}:${issue.target}`}>
              <StatusBadge tone={issue.severity === "warning" ? "attention" : "blocked"}>
                {issue.severity === "warning"
                  ? t("status.needsAttention")
                  : t("status.blocked")}
              </StatusBadge>
              <span>{localizedIssueMessage(issue, t)}</span>
              <button
                className="button"
                data-variant="secondary"
                type="button"
                onClick={() => focusIssue(issue, dispatch)}
              >
                {localizedIssueActionLabel(issue, t)}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("workflowDesign.editor.checklistEmpty")}</p>
      )}
    </article>

    <article className="workflow-guidance" aria-labelledby="workflow-field-title">
      <h3 id="workflow-field-title" tabIndex={-1}>{t("workflowDesign.editor.fieldTitle")}</h3>
      <p>{t("workflowDesign.editor.fieldBody")}</p>
      <div className="workflow-editor__field-grid">
        <label>
          <span>{t("workflowDesign.editor.fieldLabel")}</span>
          <input
            id="workflow-field-label-input"
            type="text"
            value={fieldDraft.label}
            aria-invalid={labelErrors.length > 0}
            disabled={isEditingDisabled}
            onChange={(event) => updateFieldDraft("label", event.target.value)}
          />
          {labelErrors.length > 0 ? <small>{labelErrors[0]}</small> : null}
        </label>
        <label>
          <span>{t("workflowDesign.editor.fieldHelpText")}</span>
          <input
            type="text"
            value={fieldDraft.helpText}
            disabled={isEditingDisabled}
            onChange={(event) => updateFieldDraft("helpText", event.target.value)}
          />
        </label>
        <label>
          <span>{t("workflowDesign.editor.fieldPlaceholder")}</span>
          <input
            type="text"
            value={fieldDraft.placeholder}
            disabled={isEditingDisabled}
            onChange={(event) => updateFieldDraft("placeholder", event.target.value)}
          />
        </label>
        <label>
          <span>{t("workflowDesign.editor.fieldDefaultValue")}</span>
          <input
            type="text"
            value={fieldDraft.defaultValue}
            disabled={isEditingDisabled}
            onChange={(event) => updateFieldDraft("defaultValue", event.target.value)}
          />
        </label>
        <label>
          <span>{t("workflowDesign.editor.fieldMinimumLength")}</span>
          <input
            type="number"
            min={0}
            max={255}
            value={fieldDraft.minimumLength}
            aria-invalid={minimumLengthErrors.length > 0}
            disabled={isEditingDisabled}
            onChange={(event) =>
              updateFieldDraft("minimumLength", Number(event.target.value))
            }
          />
          {minimumLengthErrors.length > 0 ? <small>{minimumLengthErrors[0]}</small> : null}
        </label>
        <label>
          <span>{t("workflowDesign.editor.fieldMaximumLength")}</span>
          <input
            type="number"
            min={0}
            max={255}
            value={fieldDraft.maximumLength}
            aria-invalid={maximumLengthErrors.length > 0}
            disabled={isEditingDisabled}
            onChange={(event) =>
              updateFieldDraft("maximumLength", Number(event.target.value))
            }
          />
          {maximumLengthErrors.length > 0 ? <small>{maximumLengthErrors[0]}</small> : null}
        </label>
      </div>
      <div className="button-row">
        <button
          id="workflow-field-binding-toggle"
          className="button"
          data-variant="secondary"
          type="button"
          disabled={!firstTask || !fieldDraft.label.trim() || isEditingDisabled}
          onClick={() =>
            dispatch({
              type: "short-text-configured",
              field: fieldDraft
            })
          }
        >
          {firstField
            ? t("workflowDesign.editor.updateShortText")
            : t("workflowDesign.editor.addShortText")}
        </button>
        <button
          className="button"
          data-variant="secondary"
          type="button"
          aria-invalid={bindingErrors.length > 0}
          disabled={!firstTask || !firstField || isEditingDisabled}
          onClick={() =>
            dispatch({
              type: "first-task-binding-toggled",
              enabled: !firstBinding
            })
          }
        >
          {firstBinding
            ? t("workflowDesign.editor.removeFromFirstTask")
            : t("workflowDesign.editor.addToFirstTask")}
        </button>
      </div>
      {bindingErrors.length > 0 ? <p>{bindingErrors[0]}</p> : null}
      <p>
        {firstField
          ? `${t("workflowDesign.editor.fieldSummaryPrefix")} ${firstField.label}`
          : t("workflowDesign.editor.fieldEmpty")}
      </p>
    </article>

    <article className="workflow-canvas" aria-labelledby="workflow-canvas-title">
      <h3 id="workflow-canvas-title" tabIndex={-1}>{t("workflowDesign.editor.previewTitle")}</h3>
      <p>{t("workflowDesign.editor.previewBody")}</p>
      <div className="workflow-path" role="list" aria-label={t("workflowDesign.editor.previewTitle")}>
        {workflowPathPreview(editorState.localDraft).map((item) =>
          isConnection(item) ? (
            <div key={item.id} className="workflow-path__arrow" role="listitem">
              {t("workflowDesign.editor.connectLabel")}
            </div>
          ) : (
            <article
              id={`workflow-element-${item.id}`}
              key={item.id}
              className="workflow-path__step"
              role="listitem"
              tabIndex={-1}
            >
              <strong>{item.label}</strong>
              <span>{stepDescription(t, item.type)}</span>
            </article>
          )
        )}
      </div>
    </article>

    <article className="status-panel" aria-labelledby="workflow-saved-title">
      <h3 id="workflow-saved-title" tabIndex={-1}>{t("workflowDesign.editor.savedTitle")}</h3>
      <p>{t("workflowDesign.editor.savedBody")}</p>
      <p>{savedPathSummary(draftState.value, t("workflowDesign.editor.connectLabel")) || t("workflowDesign.editor.savedEmpty")}</p>
    </article>
  </section>;
};

const focusIssue = (
  issue: WorkflowPublicationIssue,
  dispatch: Dispatch<{ type: "checklist-target-selected"; target: string }>
) => {
  dispatch({ type: "checklist-target-selected", target: issue.target });
  const section = focusChecklistTarget(issue.target);
  const targetId = issue.elementId
    ? `workflow-element-${issue.elementId}`
    : issue.bindingId
      ? "workflow-field-binding-toggle"
      : issue.fieldId
        ? "workflow-field-label-input"
        : {
            starter: "workflow-starter-config-button",
            assignment: "workflow-assignment-config-button",
            canvas: "workflow-canvas-title",
            field: "workflow-field-title"
          }[section];
  if (targetId) {
    document.getElementById(targetId)?.focus();
  }
};

const localizedIssueMessage = (
  issue: WorkflowPublicationIssue,
  t: (key: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string
) => {
  switch (issue.code) {
    case "starter_missing":
      return t("workflowDesign.editor.issue.starterMissing");
    case "starter_invalid":
      return issue.message;
    case "assignment_missing":
      return t("workflowDesign.editor.issue.assignmentMissing");
    case "assignment_invalid":
      return issue.message;
    case "start_step_invalid":
      return t("workflowDesign.editor.issue.startStepInvalid");
    case "first_task_missing":
      return t("workflowDesign.editor.issue.firstTaskMissing");
    case "end_step_invalid":
      return t("workflowDesign.editor.issue.endStepInvalid");
    case "start_path_incomplete":
      return t("workflowDesign.editor.issue.startPathIncomplete");
    case "path_disconnected":
      return t("workflowDesign.editor.issue.pathDisconnected");
    case "path_to_end_missing":
      return t("workflowDesign.editor.issue.pathToEndMissing");
    case "first_task_form_missing":
      return t("workflowDesign.editor.issue.firstTaskFormMissing");
    case "first_task_binding_missing_field":
      return t("workflowDesign.editor.issue.firstTaskBindingMissingField");
    case "first_task_form_decorative":
      return t("workflowDesign.editor.issue.firstTaskFormDecorative");
    default:
      return issue.message;
  }
};

const localizedIssueActionLabel = (
  issue: WorkflowPublicationIssue,
  t: (key: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string
) => {
  switch (issue.code) {
    case "starter_missing":
    case "starter_invalid":
      return t("workflowDesign.editor.issueAction.configureStarter");
    case "assignment_missing":
    case "assignment_invalid":
      return t("workflowDesign.editor.issueAction.configureAssignment");
    case "start_step_invalid":
    case "first_task_missing":
    case "end_step_invalid":
    case "start_path_incomplete":
    case "path_disconnected":
    case "path_to_end_missing":
      return t("workflowDesign.editor.issueAction.reviewWorkflowPath");
    case "first_task_form_missing":
    case "first_task_binding_missing_field":
      return t("workflowDesign.editor.issueAction.openFirstTaskForm");
    case "first_task_form_decorative":
      return t("workflowDesign.editor.issueAction.openReusableField");
    default:
      return issue.actionLabel;
  }
};

const isConnection = (
  item: WorkflowDraftElement | WorkflowDraftConnection
): item is WorkflowDraftConnection => "sourceId" in item;

const stepDescription = (
  t: (key: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string,
  type: WorkflowDraftElement["type"]
) => {
  if (type === "start") {
    return t("workflowDesign.editor.startBody");
  }
  if (type === "end") {
    return t("workflowDesign.editor.endBody");
  }
  return t("workflowDesign.editor.taskBody");
};

const nextGuidanceMessage = (
  t: (key: Parameters<ReturnType<typeof useLanguage>["t"]>[0]) => string,
  start: WorkflowDraftElement | undefined,
  task: WorkflowDraftElement | undefined,
  end: WorkflowDraftElement | undefined,
  startConnectedToTask: boolean,
  taskConnectedToEnd: boolean
) => {
  if (!start) {
    return t("workflowDesign.editor.guidanceStart");
  }
  if (!task) {
    return t("workflowDesign.editor.guidanceTask");
  }
  if (!end) {
    return t("workflowDesign.editor.guidanceEnd");
  }
  if (!startConnectedToTask) {
    return t("workflowDesign.editor.guidanceConnectStartTask");
  }
  if (!taskConnectedToEnd) {
    return t("workflowDesign.editor.guidanceConnectTaskEnd");
  }
  return t("workflowDesign.editor.guidanceSave");
};

const savedPathSummary = (
  draft: WorkflowDraftDocument,
  connectLabel: string
) =>
  workflowPathPreview(draft)
    .map((item) => (isConnection(item) ? connectLabel : item.label))
    .join(" -> ");

const errorMessagesFor = (
  invalidFieldNames: string[],
  errorMessages: string[],
  suffixes: string[]
) =>
  errorMessages.filter((_message, index) =>
    suffixes.some((suffix) => invalidFieldNames[index]?.endsWith(suffix))
  );
