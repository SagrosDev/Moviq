import { useEffect, useReducer } from "react";
import { useLanguage } from "../../../shared/localization";
import { type DraftState } from "../../../shared/drafts";
import {
  applyWorkflowDraftSave,
  createWorkflowDraftEditorState,
  reduceWorkflowDraftEditorState,
  saveWorkflowDraft,
  workflowPathPreview
} from "../model/editor";
import type {
  WorkflowDraftConnection,
  WorkflowDraftDocument,
  WorkflowDraftElement
} from "../model/types";

type WorkflowDraftEditorProps = {
  draftState: DraftState<WorkflowDraftDocument>;
  onAccepted: (draftState: DraftState<WorkflowDraftDocument>) => void;
};

export const WorkflowDraftEditor = ({
  draftState,
  onAccepted
}: WorkflowDraftEditorProps) => {
  const { t } = useLanguage();
  const [editorState, dispatch] = useReducer(
    reduceWorkflowDraftEditorState,
    draftState,
    createWorkflowDraftEditorState
  );

  useEffect(() => {
    dispatch({ type: "server-synced", draftState });
  }, [draftState]);

  const start = editorState.localDraft.elements.find((element) => element.type === "start");
  const firstTask = editorState.localDraft.elements.find((element) => element.type === "task");
  const end = editorState.localDraft.elements.find((element) => element.type === "end");
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

  const save = async () => {
    dispatch({ type: "save-requested" });
    const expectedRevision = draftState.revision;
    const result = await saveWorkflowDraft(draftState, editorState.localDraft);

    if (!result.ok) {
      dispatch({
        type: "save-failed",
        errorCode: result.error.code,
        errorMessages:
          result.error.invalidParams?.map((entry) => entry.reason) ??
          [t("workflowDesign.editor.saveError")]
      });
      return;
    }

    const nextDraftState = applyWorkflowDraftSave(
      draftState,
      result.data,
      expectedRevision
    );
    onAccepted(nextDraftState);
    dispatch({ type: "save-succeeded", draftState: nextDraftState });
  };

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
          disabled={Boolean(start)}
          onClick={() => dispatch({ type: "start-added", labels: elementLabels })}
        >
          {t("workflowDesign.editor.addStart")}
        </button>
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={Boolean(firstTask)}
          onClick={() => dispatch({ type: "task-added", labels: elementLabels })}
        >
          {t("workflowDesign.editor.addTask")}
        </button>
        <button
          className="button"
          data-variant="secondary"
          type="button"
          disabled={Boolean(end)}
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
          disabled={!start || !firstTask || startConnectedToTask}
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
          disabled={!firstTask || !end || taskConnectedToEnd}
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
          disabled={editorState.saveStatus === "saving"}
          onClick={() => void save()}
        >
          {editorState.saveStatus === "saving"
            ? t("workflowDesign.editor.saving")
            : t("workflowDesign.draft.save")}
        </button>
      </div>
      {editorState.saveStatus === "success" ? (
        <p className="success-message">{t("workflowDesign.editor.saveSuccess")}</p>
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
        </div>
      ) : null}
    </article>

    <article className="workflow-canvas" aria-labelledby="workflow-canvas-title">
      <h3 id="workflow-canvas-title">{t("workflowDesign.editor.previewTitle")}</h3>
      <p>{t("workflowDesign.editor.previewBody")}</p>
      <div className="workflow-path" role="list" aria-label={t("workflowDesign.editor.previewTitle")}>
        {workflowPathPreview(editorState.localDraft).map((item) =>
          isConnection(item) ? (
            <div key={item.id} className="workflow-path__arrow" role="listitem">
              {t("workflowDesign.editor.connectLabel")}
            </div>
          ) : (
            <article key={item.id} className="workflow-path__step" role="listitem">
              <strong>{item.label}</strong>
              <span>{stepDescription(t, item.type)}</span>
            </article>
          )
        )}
      </div>
    </article>

    <article className="status-panel" aria-labelledby="workflow-saved-title">
      <h3 id="workflow-saved-title">{t("workflowDesign.editor.savedTitle")}</h3>
      <p>{t("workflowDesign.editor.savedBody")}</p>
      <p>{savedPathSummary(draftState.value, t("workflowDesign.editor.connectLabel")) || t("workflowDesign.editor.savedEmpty")}</p>
    </article>
  </section>;
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
