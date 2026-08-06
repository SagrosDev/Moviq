import { useEffect, useReducer, useState } from "react";
import { protectedEntryPath, useSession } from "../../../features/authentication";
import {
  completeTaskFormDocument,
  createTaskFormCompletionIdempotencyKey,
  createTaskFormSaveIdempotencyKey,
  createTaskFormEditorState,
  readTaskFormDocument,
  reduceTaskFormEditorState,
  saveTaskFormDocument,
  TaskFormPanel,
  type TaskFormDocument
} from "../../../features/task-form";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

type TaskFormPageProps = {
  taskId: string;
};

export const resolveTaskFormPageView = (
  loadStatus: "loading" | "error" | "ready",
  document: TaskFormDocument | null
) => {
  if (loadStatus === "error") {
    return "error";
  }
  if (loadStatus === "loading" || !document) {
    return "loading";
  }
  return "ready";
};

export const TaskFormPage = ({ taskId }: TaskFormPageProps) => {
  const { t } = useLanguage();
  const { signOutCurrentSession, state } = useSession();
  const [document, setDocument] = useState<TaskFormDocument | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "error" | "ready">("loading");
  const [editorState, dispatch] = useReducer(
    reduceTaskFormEditorState,
    document ?? {
      taskId,
      processId: "",
      workflowId: "",
      workflowVersionId: null,
      workflowName: "",
      taskTitle: "",
      taskElementId: "",
      status: "",
      taskRevision: "0",
      definitionRevision: "0",
      actions: { saveDraft: false, complete: false },
      form: { controls: [] }
    },
    createTaskFormEditorState
  );

  useEffect(() => {
    if (state.status === "anonymous") {
      window.location.assign("/sign-in");
    }
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "authenticated") {
      return;
    }

    const load = async () => {
      setLoadStatus("loading");
      const result = await readTaskFormDocument(taskId);
      if (!result.ok) {
        setLoadStatus("error");
        return;
      }
      setDocument(result.data);
      dispatch({ type: "server-synced", document: result.data });
      setLoadStatus("ready");
    };

    void load();
  }, [state.status, taskId]);

  useEffect(() => {
    if (editorState.completionStatus !== "success" || !editorState.completionResult) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.assign(editorState.completionResult?.destinationRoute ?? protectedEntryPath);
    }, 1500);

    return () => window.clearTimeout(redirectTimer);
  }, [editorState.completionResult, editorState.completionStatus]);

  if (state.status !== "authenticated") {
    return <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/">Moviqo</a>
        <LanguageSelector />
      </header>
      <main className="app-main">
        <p className="status-panel" role="status">{t("myWork.sessionLoading")}</p>
      </main>
    </div>;
  }

  const save = async () => {
    const requestKey = editorState.saveRequestKey ?? createTaskFormSaveIdempotencyKey(editorState.taskId);
    const requestStartedAt = Date.now();
    dispatch({ type: "save-requested", requestKey });
    const result = await saveTaskFormDocument(editorState, requestKey);
    if (!result.ok) {
      dispatch({
        type: "save-failed",
        errorCode: result.error.code,
        errorMessages:
          result.error.invalidParams?.map((entry) => entry.reason) ?? [t("taskForm.saveError")],
        invalidFieldNames:
          result.error.invalidParams?.map((entry) => entry.name) ?? []
      });
      return;
    }
    const minimumSavingDurationMs = 250;
    const remainingDelay = minimumSavingDurationMs - (Date.now() - requestStartedAt);
    if (remainingDelay > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
    }
    setDocument(result.data);
    dispatch({ type: "save-succeeded", document: result.data });
  };

  const complete = async () => {
    const requestKey =
      editorState.completionRequestKey
      ?? createTaskFormCompletionIdempotencyKey(editorState.taskId);
    dispatch({ type: "complete-requested", requestKey });
    const result = await completeTaskFormDocument(editorState, requestKey);
    if (!result.ok) {
      dispatch({
        type: "complete-failed",
        errorCode: result.error.code,
        errorMessages:
          result.error.invalidParams?.map((entry) => entry.reason) ?? [t("taskForm.completeError")],
        invalidFieldNames:
          result.error.invalidParams?.map((entry) => entry.name) ?? []
      });
      return;
    }
    dispatch({ type: "complete-succeeded", document: result.data });
  };

  const retry = async () => {
    const result = await readTaskFormDocument(taskId);
    if (!result.ok) {
      setLoadStatus("error");
      return;
    }
    setDocument(result.data);
    dispatch({ type: "server-synced", document: result.data });
    setLoadStatus("ready");
  };

  const pageView = resolveTaskFormPageView(loadStatus, document);

  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href={protectedEntryPath}>{t("app.nav.work")}</a>
      <div className="language-selector">
        <LanguageSelector />
        <button className="button" data-variant="secondary" type="button" onClick={() => void signOutCurrentSession()}>
          {t("auth.signOut")}
        </button>
      </div>
    </header>
    <main className="app-main">
      <div className="button-row">
        <a className="button" data-variant="secondary" href={protectedEntryPath}>{t("taskForm.back")}</a>
      </div>
      {pageView === "loading" ? (
        <p className="status-panel" role="status">{t("taskForm.loading")}</p>
      ) : pageView === "error" ? (
        <div className="status-panel" role="alert">
          <p>{t("taskForm.loadError")}</p>
          <button className="button" type="button" onClick={() => void retry()}>{t("taskForm.retry")}</button>
        </div>
      ) : (
        <TaskFormPanel
          state={editorState}
          onComplete={() => void complete()}
          onRetrySave={() =>
            void (
              editorState.completionStatus === "error"
                ? complete()
                : save()
            )
          }
          onReloadLatest={() => void retry()}
          onSave={() => void save()}
          onValueChange={(controlId, value) =>
            dispatch({ type: "value-updated", controlId, value })
          }
        />
      )}
    </main>
  </div>;
};
