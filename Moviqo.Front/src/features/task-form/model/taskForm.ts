import {
  createApiClient,
  normalizeApiProblem,
  readApiProblem,
  type NormalizedApiProblem
} from "../../../shared/api";

export type TaskFormControl = {
  controlId: string;
  fieldId: string;
  kind: "shortText";
  label: string;
  helpText: string;
  placeholder: string;
  width: "full";
  position: number;
  value: string;
};

export type TaskFormDocument = {
  taskId: string;
  processId: string;
  workflowId: string;
  workflowVersionId: string | null;
  workflowName: string;
  taskTitle: string;
  taskElementId: string;
  status: string;
  taskRevision: string;
  definitionRevision: string;
  actions: { saveDraft: boolean; complete: boolean };
  form: { controls: TaskFormControl[] };
};

export type TaskCompletionDocument = {
  taskId: string;
  processId: string;
  workflowId: string;
  workflowVersionId: string | null;
  workflowName: string;
  taskTitle: string;
  taskStatus: string;
  processStatus: string;
  taskRevision: string;
  definitionRevision: string;
  routeTargetId: string;
  completedAt: string;
  destinationRoute: string;
  handoffMessage: string;
};

export type TaskFormEditorControl = TaskFormControl;

export type TaskFormEditorState = {
  taskId: string;
  processId: string;
  workflowName: string;
  taskTitle: string;
  status: string;
  taskRevision: string;
  definitionRevision: string;
  controls: TaskFormEditorControl[];
  hasLocalChanges: boolean;
  saveStatus: "idle" | "saving" | "error" | "success";
  saveRequestKey: string | null;
  completionStatus: "idle" | "completing" | "error" | "success";
  completionRequestKey: string | null;
  completionResult: TaskCompletionDocument | null;
  errorCode: string | null;
  errorMessages: string[];
  invalidFieldNames: string[];
  actions: { saveDraft: boolean; complete: boolean };
};

export type TaskFormResult =
  | { ok: true; data: TaskFormDocument }
  | { ok: false; error: NormalizedApiProblem };

export type TaskCompletionResult =
  | { ok: true; data: TaskCompletionDocument }
  | { ok: false; error: NormalizedApiProblem };

const taskFormClient = createApiClient({ baseUrl: "/api/v1" });

export const createTaskFormEditorState = (
  document: TaskFormDocument
): TaskFormEditorState => ({
  taskId: document.taskId,
  processId: document.processId,
  workflowName: document.workflowName,
  taskTitle: document.taskTitle,
  status: document.status,
  taskRevision: document.taskRevision,
  definitionRevision: document.definitionRevision,
  controls: structuredClone(document.form.controls),
  hasLocalChanges: false,
  saveStatus: "idle",
  saveRequestKey: null,
  completionStatus: "idle",
  completionRequestKey: null,
  completionResult: null,
  errorCode: null,
  errorMessages: [],
  invalidFieldNames: [],
  actions: document.actions
});

export const reduceTaskFormEditorState = (
  state: TaskFormEditorState,
  action:
    | { type: "value-updated"; controlId: string; value: string }
    | { type: "save-requested"; requestKey: string }
    | {
        type: "save-failed";
        errorCode: string;
        errorMessages: string[];
        invalidFieldNames: string[];
      }
    | { type: "save-succeeded"; document: TaskFormDocument }
    | { type: "complete-requested"; requestKey: string }
    | {
        type: "complete-failed";
        errorCode: string;
        errorMessages: string[];
        invalidFieldNames: string[];
      }
    | { type: "complete-succeeded"; document: TaskCompletionDocument }
    | { type: "server-synced"; document: TaskFormDocument }
): TaskFormEditorState => {
  if (action.type === "value-updated") {
    return {
      ...state,
      controls: state.controls.map((control) =>
        control.controlId === action.controlId
          ? { ...control, value: action.value }
          : control
      ),
      hasLocalChanges: true,
      saveStatus: "idle",
      saveRequestKey: null,
      completionStatus: "idle",
      completionRequestKey: null,
      completionResult: null,
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "save-requested") {
    return {
      ...state,
      saveStatus: "saving",
      saveRequestKey: action.requestKey,
      completionStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "save-failed") {
    return {
      ...state,
      saveStatus: "error",
      saveRequestKey: state.saveRequestKey,
      errorCode: action.errorCode,
      errorMessages: action.errorMessages,
      invalidFieldNames: action.invalidFieldNames,
      completionStatus: "idle",
      hasLocalChanges: true
    };
  }

  if (action.type === "complete-requested") {
    return {
      ...state,
      completionStatus: "completing",
      completionRequestKey: action.requestKey,
      saveStatus: "idle",
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "complete-failed") {
    return {
      ...state,
      completionStatus: "error",
      errorCode: action.errorCode,
      errorMessages: action.errorMessages,
      invalidFieldNames: action.invalidFieldNames,
      hasLocalChanges: true
    };
  }

  if (action.type === "save-succeeded" || action.type === "server-synced") {
    return {
      ...createTaskFormEditorState(action.document),
      saveStatus: action.type === "save-succeeded" ? "success" : "idle"
    };
  }

  if (action.type === "complete-succeeded") {
    return {
      ...state,
      status: action.document.taskStatus,
      taskRevision: action.document.taskRevision,
      hasLocalChanges: false,
      saveStatus: "idle",
      saveRequestKey: null,
      completionStatus: "success",
      completionRequestKey: null,
      completionResult: action.document,
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: [],
      actions: { saveDraft: false, complete: false }
    };
  }

  return state;
};

export const readTaskFormDocument = async (taskId: string): Promise<TaskFormResult> => {
  try {
    const response = await (
      taskFormClient as {
        GET(path: string, init?: object): Promise<{ data?: unknown; response: Response }>;
      }
    ).GET(`/api/v1/my-work/tasks/${taskId}/form/`);

    if (!response.response.ok) {
      return { ok: false, error: await readApiProblem(response.response) };
    }

    return {
      ok: true,
      data: response.data as TaskFormDocument
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const saveTaskFormDocument = async (
  state: TaskFormEditorState,
  requestKey: string
): Promise<TaskFormResult> => {
  try {
    const response = await (
      taskFormClient as {
        PUT(path: string, init?: object): Promise<{ data?: unknown; response: Response }>;
      }
    ).PUT(`/api/v1/my-work/tasks/${state.taskId}/form/`, {
      body: {
        expectedTaskRevision: state.taskRevision,
        controls: state.controls.map((control) => ({
          controlId: control.controlId,
          fieldId: control.fieldId,
          value: control.value
        }))
      },
      headers: {
        "Idempotency-Key": requestKey
      }
    });

    if (!response.response.ok) {
      return { ok: false, error: await readApiProblem(response.response) };
    }

    return {
      ok: true,
      data: response.data as TaskFormDocument
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const completeTaskFormDocument = async (
  state: TaskFormEditorState,
  requestKey: string
): Promise<TaskCompletionResult> => {
  try {
    const response = await (
      taskFormClient as {
        POST(path: string, init?: object): Promise<{ data?: unknown; response: Response }>;
      }
    ).POST(`/api/v1/my-work/tasks/${state.taskId}/complete/`, {
      body: {
        expectedTaskRevision: state.taskRevision,
        controls: state.controls.map((control) => ({
          controlId: control.controlId,
          fieldId: control.fieldId,
          value: control.value
        }))
      },
      headers: {
        "Idempotency-Key": requestKey
      }
    });

    if (!response.response.ok) {
      return { ok: false, error: await readApiProblem(response.response) };
    }

    return {
      ok: true,
      data: response.data as TaskCompletionDocument
    };
  } catch {
    return { ok: false, error: normalizeApiProblem(undefined, 0) };
  }
};

export const createTaskFormSaveIdempotencyKey = (taskId: string) =>
  `task-form-save-${taskId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const createTaskFormCompletionIdempotencyKey = (taskId: string) =>
  `task-form-complete-${taskId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
