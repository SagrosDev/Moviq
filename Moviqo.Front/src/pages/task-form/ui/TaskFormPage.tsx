import { useEffect, useReducer, useRef, useState } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey
} from "@tanstack/react-query";
import { useBlocker, useNavigate } from "react-router";
import { useSession } from "../../../features/authentication";
import {
  completeTaskFormDocument,
  createTaskFormCompletionIdempotencyKey,
  createTaskFormEditorState,
  createTaskFormSaveIdempotencyKey,
  readTaskFormDocument,
  reduceTaskFormEditorState,
  saveTaskFormDocument,
  TaskFormPanel,
  type TaskCompletionDocument,
  type TaskFormDocument
} from "../../../features/task-form";
import { moviqoQueryKeys } from "../../../shared/api";
import { useLanguage } from "../../../shared/localization";
import {
  Alert,
  Breadcrumbs,
  Button,
  isUnmodifiedPrimaryClick,
  LoadingState
} from "../../../shared/ui";

type TaskFormPageProps = {
  taskId: string;
};

type TaskCompletionStorage = Pick<Storage, "getItem" | "setItem">;

const taskCompletionStorageKey = (
  organizationId: string,
  membershipId: string,
  taskId: string
) => `moviqo.task-completion.${organizationId}.${membershipId}.${taskId}`;

const isTaskCompletionDocument = (
  value: unknown,
  expectedTaskId: string
): value is TaskCompletionDocument => {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<TaskCompletionDocument>;
  const requiredStrings: Array<keyof TaskCompletionDocument> = [
    "taskId",
    "processId",
    "workflowId",
    "workflowName",
    "taskTitle",
    "taskStatus",
    "processStatus",
    "taskRevision",
    "definitionRevision",
    "routeTargetId",
    "completedAt",
    "destinationRoute",
    "handoffMessage"
  ];
  const hasRequiredStrings = requiredStrings.every(
    (key) => typeof document[key] === "string"
  );
  const destinationRoute = document.destinationRoute;
  const hasSafeDestination = destinationRoute === "/my-work"
    || destinationRoute === `/my-work/processes/${document.processId}`;
  return hasRequiredStrings
    && document.taskId === expectedTaskId
    && (document.workflowVersionId === null || typeof document.workflowVersionId === "string")
    && hasSafeDestination;
};

export const readPersistedTaskCompletion = (
  storage: TaskCompletionStorage | undefined,
  organizationId: string,
  membershipId: string,
  taskId: string
) => {
  if (!storage || !organizationId || !membershipId || !taskId) return null;
  try {
    const value = storage.getItem(taskCompletionStorageKey(
      organizationId,
      membershipId,
      taskId
    ));
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    return isTaskCompletionDocument(parsed, taskId) ? parsed : null;
  } catch {
    return null;
  }
};

export const persistTaskCompletion = (
  storage: TaskCompletionStorage | undefined,
  organizationId: string,
  membershipId: string,
  document: TaskCompletionDocument
) => {
  if (!storage || !organizationId || !membershipId) return;
  try {
    storage.setItem(
      taskCompletionStorageKey(organizationId, membershipId, document.taskId),
      JSON.stringify(document)
    );
  } catch {
    // The accepted completion remains visible in memory when browser storage is unavailable.
  }
};

const emptyTaskDocument = (taskId: string): TaskFormDocument => ({
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
});

export const resolveTaskFormPageView = (
  loadStatus: "loading" | "error" | "ready",
  document: TaskFormDocument | null
) => {
  if (document) return "ready";
  if (loadStatus === "error") return "error";
  return "loading";
};

export const shouldAcceptTaskFormSnapshot = (
  editorState: ReturnType<typeof createTaskFormEditorState>,
  document: TaskFormDocument,
  initialized: boolean,
  completionAccepted = false
) => !completionAccepted && (!initialized || (
  !editorState.hasLocalChanges
  && (
    editorState.taskId !== document.taskId
    || editorState.taskRevision !== document.taskRevision
  )
));

export const taskFormDocumentFromSuccessfulRefetch = (result: {
  data?: TaskFormDocument;
  isSuccess: boolean;
}) => result.isSuccess ? result.data ?? null : null;

export const refreshTaskCompletionReadModels = async (
  queryClient: QueryClient,
  organizationId: string,
  taskFormQueryKey: QueryKey
) => {
  queryClient.removeQueries({ exact: true, queryKey: taskFormQueryKey });
  await queryClient.invalidateQueries({
    queryKey: moviqoQueryKeys.organization(organizationId)
  });
};

export const TaskFormPage = ({ taskId }: TaskFormPageProps) => {
  const { t } = useLanguage();
  const { state } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizationId = state.status === "authenticated"
    ? state.context.membership.organizationId
    : "";
  const membershipId = state.status === "authenticated"
    ? state.context.membership.id
    : "";
  const completionStorageScope = organizationId && membershipId && taskId
    ? `${organizationId}:${membershipId}:${taskId}`
    : null;
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [completionStorageCheckedFor, setCompletionStorageCheckedFor] = useState<string | null>(null);
  const completionAccepted = completedTaskId === taskId;
  const queryKey = moviqoQueryKeys.taskForm(organizationId, taskId);
  const query = useQuery({
    enabled: Boolean(completionStorageScope)
      && completionStorageCheckedFor === completionStorageScope
      && !completionAccepted,
    queryKey,
    queryFn: async () => {
      const result = await readTaskFormDocument(taskId);
      if (!result.ok) throw result.error;
      return result.data;
    },
    refetchOnWindowFocus: false
  });
  const initializedTaskId = useRef<string | null>(null);
  const [editorState, dispatch] = useReducer(
    reduceTaskFormEditorState,
    emptyTaskDocument(taskId),
    createTaskFormEditorState
  );
  const blocker = useBlocker(
    editorState.hasLocalChanges && editorState.completionStatus !== "success"
  );

  useEffect(() => {
    if (!completionStorageScope) return;
    const restoredCompletion = readPersistedTaskCompletion(
      typeof window === "undefined" ? undefined : window.sessionStorage,
      organizationId,
      membershipId,
      taskId
    );
    if (restoredCompletion) {
      dispatch({ type: "complete-succeeded", document: restoredCompletion });
      initializedTaskId.current = taskId;
      setCompletedTaskId(taskId);
    } else {
      setCompletedTaskId((currentTaskId) => currentTaskId === taskId ? null : currentTaskId);
    }
    setCompletionStorageCheckedFor(completionStorageScope);
  }, [completionStorageScope, membershipId, organizationId, taskId]);

  useEffect(() => {
    if (
      query.data
      && shouldAcceptTaskFormSnapshot(
        editorState,
        query.data,
        initializedTaskId.current === taskId,
        completionAccepted
      )
    ) {
      dispatch({ type: "server-synced", document: query.data });
      initializedTaskId.current = taskId;
    }
  }, [
    completionAccepted,
    editorState.hasLocalChanges,
    editorState.taskId,
    editorState.taskRevision,
    query.data,
    taskId
  ]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editorState.hasLocalChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [editorState.hasLocalChanges]);

  useEffect(() => {
    if (!completionAccepted) return;
    void refreshTaskCompletionReadModels(
      queryClient,
      organizationId,
      moviqoQueryKeys.taskForm(organizationId, taskId)
    );
  }, [completionAccepted, organizationId, queryClient, taskId]);

  const save = async () => {
    const requestKey = editorState.saveRequestKey
      ?? createTaskFormSaveIdempotencyKey(editorState.taskId);
    dispatch({ type: "save-requested", requestKey });
    const result = await saveTaskFormDocument(editorState, requestKey);
    if (!result.ok) {
      dispatch({
        type: "save-failed",
        errorCode: result.error.code,
        errorMessages: result.error.invalidParams?.map((entry) => entry.reason) ?? [t("taskForm.saveError")],
        invalidFieldNames: result.error.invalidParams?.map((entry) => entry.name) ?? []
      });
      return false;
    }
    queryClient.setQueryData(queryKey, result.data);
    dispatch({ type: "save-succeeded", document: result.data });
    return true;
  };

  const complete = async () => {
    const requestKey = editorState.completionRequestKey
      ?? createTaskFormCompletionIdempotencyKey(editorState.taskId);
    dispatch({ type: "complete-requested", requestKey });
    const result = await completeTaskFormDocument(editorState, requestKey);
    if (!result.ok) {
      dispatch({
        type: "complete-failed",
        errorCode: result.error.code,
        errorMessages: result.error.invalidParams?.map((entry) => entry.reason) ?? [t("taskForm.completeError")],
        invalidFieldNames: result.error.invalidParams?.map((entry) => entry.name) ?? []
      });
      return;
    }
    persistTaskCompletion(
      typeof window === "undefined" ? undefined : window.sessionStorage,
      organizationId,
      membershipId,
      result.data
    );
    dispatch({ type: "complete-succeeded", document: result.data });
    setCompletedTaskId(editorState.taskId);
  };

  const reloadLatest = async () => {
    const result = await query.refetch();
    const document = taskFormDocumentFromSuccessfulRefetch(result);
    if (document) {
      dispatch({ type: "server-synced", document });
    }
  };

  const hasAcceptedDocument = initializedTaskId.current === taskId;

  if (state.status !== "authenticated") {
    return <LoadingState>{t("taskForm.loading")}</LoadingState>;
  }

  if (!hasAcceptedDocument && query.isError) {
    return (
      <Alert announcement="assertive" title={t("taskForm.loadError")} tone="error">
        <Button variant="secondary" onClick={() => void reloadLatest()}>{t("taskForm.retry")}</Button>
      </Alert>
    );
  }

  if (!hasAcceptedDocument) {
    return <LoadingState>{t("taskForm.loading")}</LoadingState>;
  }

  return (
    <div className="grid gap-moviqo-6">
      {query.isError ? (
        <Alert announcement="polite" title={t("taskForm.loadError")} tone="error">
          <Button variant="secondary" onClick={() => void reloadLatest()}>{t("taskForm.retry")}</Button>
        </Alert>
      ) : null}
      {blocker.state === "blocked" ? (
        <Alert announcement="assertive" title={t("taskForm.leave.title")} tone="warning">
          <p>{t("taskForm.leave.body")}</p>
          <div className="flex flex-wrap gap-moviqo-2">
            <Button
              disabled={editorState.saveStatus === "saving"}
              onClick={() => void (async () => {
                if (await save()) blocker.proceed();
              })()}
            >
              {t("taskForm.leave.save")}
            </Button>
            <Button variant="destructive" onClick={() => blocker.proceed()}>
              {t("taskForm.leave.discard")}
            </Button>
            <Button variant="secondary" onClick={() => blocker.reset()}>
              {t("taskForm.leave.stay")}
            </Button>
          </div>
        </Alert>
      ) : null}
      <TaskFormPanel
        breadcrumb={(
          <Breadcrumbs
            items={[
              { href: "/my-work/tasks", label: t("myWork.myTasks.title") },
              { current: true, label: query.data?.taskTitle ?? editorState.taskTitle }
            ]}
            label={t("app.nav.primary")}
            onNavigate={(href, event) => {
              if (!isUnmodifiedPrimaryClick(event)) return;
              event.preventDefault();
              navigate(href);
            }}
          />
        )}
        state={editorState}
        onComplete={() => void complete()}
        onReloadLatest={() => void reloadLatest()}
        onRetrySave={() => void (editorState.completionStatus === "error" ? complete() : save())}
        onSave={() => void save()}
        onValueChange={(controlId, value) => dispatch({ type: "value-updated", controlId, value })}
      />
    </div>
  );
};
