import type {
  FormItemWidth,
  StructuralFormItemKind,
  WorkflowDraftDocument,
  WorkflowProcessField,
  WorkflowTaskFormItem
} from "../../../entities/workflow";
import type { DraftRevision } from "../../../shared/drafts";
import {
  createDefaultShortTextDefinition,
  createDefaultStructuralItem
} from "../../task-form";
import type { TaskFormRuntimeItem } from "../../task-form";
import {
  createSaveIdempotencyKey,
  type WorkflowCreationAccepted
} from "../../workflow-design";

export type FormDesignerSaveCommand = {
  requestKey: string;
  expectedRevision: DraftRevision;
  draft: WorkflowDraftDocument;
  payloadSignature: string;
};

export type FormDesignerState = {
  localDraft: WorkflowDraftDocument;
  taskElementId: string;
  selectedItemId: string | null;
  hasLocalChanges: boolean;
  lastAcknowledgedRevision: DraftRevision;
  saveStatus: "idle" | "unsaved" | "saving" | "saved" | "error" | "conflict";
  pendingSaveCommand: FormDesignerSaveCommand | null;
  errorCode: string | null;
  errorMessages: string[];
  invalidFieldNames: string[];
};

export type FormDesignerAction =
  | { type: "short-text-added"; label: string; toIndex?: number }
  | {
      type: "structural-item-added";
      kind: StructuralFormItemKind;
      content: string;
      toIndex?: number;
    }
  | { type: "item-selected"; itemId: string | null }
  | { type: "item-moved"; itemId: string; toIndex: number }
  | { type: "item-width-changed"; itemId: string; width: FormItemWidth }
  | { type: "item-content-changed"; itemId: string; content: string }
  | { type: "item-label-changed"; itemId: string; label: string }
  | {
      type: "item-field-configuration-changed";
      itemId: string;
      changes: Partial<Pick<
        WorkflowProcessField,
        | "helpText"
        | "placeholder"
        | "defaultValue"
        | "minimumLength"
        | "maximumLength"
      >>;
    }
  | { type: "item-removed"; itemId: string }
  | { type: "save-requested"; command: FormDesignerSaveCommand }
  | {
      type: "save-failed";
      errorCode: string;
      errorMessages: string[];
      invalidFieldNames: string[];
      conflict: boolean;
      reuseRequestKey?: boolean;
    }
  | { type: "save-succeeded"; accepted: WorkflowCreationAccepted }
  | {
      type: "conflict-rebased";
      accepted: WorkflowCreationAccepted;
      draft: WorkflowDraftDocument;
    };

export const formItemsForTask = (
  draft: WorkflowDraftDocument,
  taskElementId: string
) => draft.formBindings
  .filter((item) => item.taskElementId === taskElementId)
  .sort((left, right) => left.position - right.position || left.id.localeCompare(right.id));

export const formDesignerDropIndex = (
  itemIds: string[],
  activeId: string,
  overId: string | null
) => {
  if (!overId || !itemIds.includes(activeId)) return null;
  const targetIndex = itemIds.indexOf(overId);
  return targetIndex >= 0 ? targetIndex : null;
};

const insertTaskItemAt = (
  draft: WorkflowDraftDocument,
  taskElementId: string,
  item: WorkflowTaskFormItem,
  toIndex?: number
) => {
  const ordered = formItemsForTask(draft, taskElementId).filter(
    (candidate) => candidate.id !== item.id
  );
  const targetIndex = Math.max(0, Math.min(toIndex ?? ordered.length, ordered.length));
  ordered.splice(targetIndex, 0, item);
  return normalizeTaskItemPositions(draft, taskElementId, ordered);
};

export const rebaseFormDesignerDraft = (
  state: FormDesignerState,
  latestDraft: WorkflowDraftDocument
): WorkflowDraftDocument => {
  const localItems = formItemsForTask(state.localDraft, state.taskElementId);
  const localFieldIds = new Set(localItems.flatMap((item) => (
    item.kind === "field" ? [item.fieldId] : []
  )));
  const localFields = new Map(
    state.localDraft.processFields
      .filter((field) => localFieldIds.has(field.id))
      .map((field) => [field.id, field])
  );
  const latestFieldIds = new Set(latestDraft.processFields.map((field) => field.id));
  return {
    ...structuredClone(latestDraft),
    processFields: [
      ...latestDraft.processFields.map((field) => localFields.get(field.id) ?? field),
      ...Array.from(localFields.values()).filter((field) => !latestFieldIds.has(field.id))
    ],
    formBindings: [
      ...latestDraft.formBindings.filter((item) => item.taskElementId !== state.taskElementId),
      ...structuredClone(localItems)
    ]
  };
};

const normalizeTaskItemPositions = (
  draft: WorkflowDraftDocument,
  taskElementId: string,
  orderedItems: WorkflowTaskFormItem[]
): WorkflowDraftDocument => {
  const positions = new Map(orderedItems.map((item, index) => [item.id, index]));
  return {
    ...draft,
    formBindings: draft.formBindings.map((item) => (
      item.taskElementId === taskElementId && positions.has(item.id)
        ? { ...item, position: positions.get(item.id)! }
        : item
    ))
  };
};

const nextOrdinal = (state: FormDesignerState) => {
  const items = formItemsForTask(state.localDraft, state.taskElementId);
  let ordinal = items.length + 1;
  const usedIds = new Set([
    ...state.localDraft.processFields.map((field) => field.id),
    ...state.localDraft.formBindings.map((item) => item.id)
  ]);
  while (
    usedIds.has(`field-${ordinal}`)
    || usedIds.has(`binding-${ordinal}`)
    || ["section", "heading", "instruction", "divider"].some(
      (kind) => usedIds.has(`${kind}-${ordinal}`)
    )
  ) {
    ordinal += 1;
  }
  return ordinal;
};

const markDirty = (
  state: FormDesignerState,
  localDraft: WorkflowDraftDocument,
  selectedItemId = state.selectedItemId,
  correctedTargets: string[] = []
): FormDesignerState => {
  const retainedErrorIndexes = state.invalidFieldNames.flatMap((name, index) => (
    correctedTargets.some((target) => name === target || name.startsWith(`${target}.`))
      ? []
      : [index]
  ));
  return {
    ...state,
    localDraft,
    selectedItemId,
    hasLocalChanges: true,
    saveStatus: "unsaved",
    errorCode: retainedErrorIndexes.length > 0 ? state.errorCode : null,
    errorMessages: retainedErrorIndexes.map((index) => state.errorMessages[index] ?? ""),
    invalidFieldNames: retainedErrorIndexes.map((index) => state.invalidFieldNames[index]!)
  };
};

export const createFormDesignerState = (
  accepted: WorkflowCreationAccepted,
  taskElementId: string
): FormDesignerState => ({
  localDraft: structuredClone(accepted.draft),
  taskElementId,
  selectedItemId: formItemsForTask(accepted.draft, taskElementId)[0]?.id ?? null,
  hasLocalChanges: false,
  lastAcknowledgedRevision: accepted.revision as DraftRevision,
  saveStatus: "idle",
  pendingSaveCommand: null,
  errorCode: null,
  errorMessages: [],
  invalidFieldNames: []
});

export const reduceFormDesignerState = (
  state: FormDesignerState,
  action: FormDesignerAction
): FormDesignerState => {
  if (action.type === "short-text-added") {
    const ordinal = nextOrdinal(state);
    const created = createDefaultShortTextDefinition(
      state.taskElementId,
      ordinal,
      action.label
    );
    const position = formItemsForTask(state.localDraft, state.taskElementId).length;
    const item = { ...created.item, position };
    const draft = {
      ...state.localDraft,
      processFields: [...state.localDraft.processFields, created.processField],
      formBindings: [...state.localDraft.formBindings, item]
    };
    return markDirty(
      state,
      insertTaskItemAt(draft, state.taskElementId, item, action.toIndex),
      item.id
    );
  }

  if (action.type === "structural-item-added") {
    const ordinal = nextOrdinal(state);
    const position = formItemsForTask(state.localDraft, state.taskElementId).length;
    const item = {
      ...createDefaultStructuralItem(
        action.kind,
        state.taskElementId,
        ordinal,
        action.content
      ),
      position
    };
    const draft = {
      ...state.localDraft,
      formBindings: [...state.localDraft.formBindings, item]
    };
    return markDirty(
      state,
      insertTaskItemAt(draft, state.taskElementId, item, action.toIndex),
      item.id
    );
  }

  if (action.type === "item-selected") {
    return { ...state, selectedItemId: action.itemId };
  }

  if (action.type === "item-moved") {
    const ordered = formItemsForTask(state.localDraft, state.taskElementId);
    const currentIndex = ordered.findIndex((item) => item.id === action.itemId);
    if (currentIndex < 0) return state;
    const targetIndex = Math.max(0, Math.min(action.toIndex, ordered.length - 1));
    if (targetIndex === currentIndex) return state;
    const [item] = ordered.splice(currentIndex, 1);
    ordered.splice(targetIndex, 0, item!);
    return markDirty(
      state,
      normalizeTaskItemPositions(state.localDraft, state.taskElementId, ordered),
      action.itemId,
      ordered.map((candidate) => `formBindings.${candidate.id}.position`)
    );
  }

  if (action.type === "item-width-changed") {
    const item = state.localDraft.formBindings.find((candidate) => candidate.id === action.itemId);
    if (!item || item.width === action.width) return state;
    return markDirty(state, {
      ...state.localDraft,
      formBindings: state.localDraft.formBindings.map((candidate) => (
        candidate.id === action.itemId ? { ...candidate, width: action.width } : candidate
      ))
    }, action.itemId, [`formBindings.${action.itemId}.width`]);
  }

  if (action.type === "item-content-changed") {
    return markDirty(state, {
      ...state.localDraft,
      formBindings: state.localDraft.formBindings.map((candidate) => (
        candidate.id === action.itemId && candidate.kind !== "field" && candidate.kind !== "divider"
          ? { ...candidate, content: action.content }
          : candidate
      ))
    }, action.itemId, [`formBindings.${action.itemId}.content`]);
  }

  if (action.type === "item-label-changed") {
    const item = state.localDraft.formBindings.find((candidate) => candidate.id === action.itemId);
    if (!item || item.kind !== "field") return state;
    return markDirty(state, {
      ...state.localDraft,
      formBindings: state.localDraft.formBindings.map((candidate) => (
        candidate.id === item.id && candidate.kind === "field"
          ? { ...candidate, label: action.label.trim() ? action.label : null }
          : candidate
      ))
    }, action.itemId, [`formBindings.${action.itemId}.label`]);
  }

  if (action.type === "item-field-configuration-changed") {
    const item = state.localDraft.formBindings.find((candidate) => candidate.id === action.itemId);
    if (!item || item.kind !== "field") return state;
    const sharedWithAnotherTask = state.localDraft.formBindings.some((candidate) => (
      candidate.kind === "field"
      && candidate.fieldId === item.fieldId
      && candidate.taskElementId !== state.taskElementId
    ));
    const sourceField = state.localDraft.processFields.find((field) => field.id === item.fieldId);
    if (!sourceField) return state;
    if (sharedWithAnotherTask) {
      let ordinal = nextOrdinal(state);
      while (state.localDraft.processFields.some((field) => field.id === `field-${ordinal}`)) {
        ordinal += 1;
      }
      const clonedField = { ...sourceField, ...action.changes, id: `field-${ordinal}` };
      return markDirty(state, {
        ...state.localDraft,
        processFields: [...state.localDraft.processFields, clonedField],
        formBindings: state.localDraft.formBindings.map((candidate) => (
          candidate.id === item.id && candidate.kind === "field"
            ? { ...candidate, fieldId: clonedField.id }
            : candidate
        ))
      }, action.itemId, [
        `formBindings.${action.itemId}.fieldId`,
        ...Object.keys(action.changes).map(
          (property) => `processFields.${item.fieldId}.${property}`
        )
      ]);
    }
    return markDirty(state, {
      ...state.localDraft,
      processFields: state.localDraft.processFields.map((field) => (
        field.id === item.fieldId ? { ...field, ...action.changes } : field
      ))
    }, action.itemId, Object.keys(action.changes).map(
      (property) => `processFields.${item.fieldId}.${property}`
    ));
  }

  if (action.type === "item-removed") {
    if (!state.localDraft.formBindings.some((item) => item.id === action.itemId)) return state;
    const nextDraft = {
      ...state.localDraft,
      formBindings: state.localDraft.formBindings.filter((item) => item.id !== action.itemId)
    };
    const ordered = formItemsForTask(nextDraft, state.taskElementId);
    return markDirty(
      state,
      normalizeTaskItemPositions(nextDraft, state.taskElementId, ordered),
      ordered[0]?.id ?? null,
      [`formBindings.${action.itemId}`]
    );
  }

  if (action.type === "save-requested") {
    return {
      ...state,
      saveStatus: "saving",
      pendingSaveCommand: action.command,
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: []
    };
  }

  if (action.type === "save-failed") {
    const invalidFieldNames = action.invalidFieldNames.length > 0
      ? action.invalidFieldNames
      : action.errorMessages.map(() => "nonFieldErrors");
    return {
      ...state,
      saveStatus: action.conflict ? "conflict" : "error",
      hasLocalChanges: true,
      errorCode: action.errorCode,
      errorMessages: action.errorMessages,
      invalidFieldNames,
      pendingSaveCommand: action.reuseRequestKey === false
        ? null
        : state.pendingSaveCommand
    };
  }

  if (action.type === "save-succeeded") {
    return {
      ...createFormDesignerState(action.accepted, state.taskElementId),
      saveStatus: "saved"
    };
  }

  if (action.type === "conflict-rebased") {
    return {
      ...state,
      localDraft: action.draft,
      lastAcknowledgedRevision: action.accepted.revision as DraftRevision,
      hasLocalChanges: true,
      saveStatus: "unsaved",
      pendingSaveCommand: null,
      errorCode: null,
      errorMessages: [],
      invalidFieldNames: [],
      selectedItemId: action.draft.formBindings.some(
        (item) => item.id === state.selectedItemId
      ) ? state.selectedItemId : formItemsForTask(action.draft, state.taskElementId)[0]?.id ?? null
    };
  }

  return state;
};

export const createFormDesignerSaveCommand = (
  state: FormDesignerState
): FormDesignerSaveCommand => {
  const draft = structuredClone(state.localDraft);
  const payloadSignature = JSON.stringify(draft);
  const pending = state.pendingSaveCommand;
  return {
    requestKey: pending?.payloadSignature === payloadSignature
      ? pending.requestKey
      : createSaveIdempotencyKey(state.localDraft.workflowId),
    expectedRevision: state.lastAcknowledgedRevision,
    draft,
    payloadSignature
  };
};

export const formDesignerValidationIssues = (state: FormDesignerState) => (
  formItemsForTask(state.localDraft, state.taskElementId).flatMap((item) => {
    if (item.kind === "field") {
      const field = state.localDraft.processFields.find((candidate) => candidate.id === item.fieldId);
      const effectiveLabel = item.label ?? field?.label ?? "";
      if (!effectiveLabel.trim()) {
        return [{ itemId: item.id, property: "label", code: "label_required" }];
      }
      if (field && field.minimumLength > field.maximumLength) {
        return [{ itemId: item.id, property: "minimumLength", code: "minimum_greater_than_maximum" }];
      }
      return [];
    }
    return item.kind !== "divider" && !item.content.trim()
      ? [{ itemId: item.id, property: "content", code: "content_required" }]
      : [];
  })
);

export const formDesignerErrorSummary = (
  state: FormDesignerState,
  invalidFieldNames = state.invalidFieldNames,
  errorMessages = state.errorMessages
) => {
  const errors: Array<{
    id: string;
    itemId: string;
    property: string;
    message: string;
  }> = [];
  const formMessages: string[] = [];
  invalidFieldNames.forEach((name, index) => {
    const binding = [...state.localDraft.formBindings].sort(
      (left, right) => right.id.length - left.id.length
    ).find(
      (item) => name === `formBindings.${item.id}` || name.startsWith(`formBindings.${item.id}.`)
    );
    const field = [...state.localDraft.processFields].sort(
      (left, right) => right.id.length - left.id.length
    ).find(
      (candidate) => name === `processFields.${candidate.id}`
        || name.startsWith(`processFields.${candidate.id}.`)
    );
    const itemId = binding?.id ?? (field
      ? state.localDraft.formBindings.find((item) => (
          item.kind === "field" && item.fieldId === field.id
        ))?.id
      : undefined);
    const prefix = binding ? `formBindings.${binding.id}` : field ? `processFields.${field.id}` : "";
    const property = prefix && name.startsWith(`${prefix}.`)
      ? name.slice(prefix.length + 1).split(".")[0] ?? "item"
      : "item";
    const message = errorMessages[index] ?? errorMessages[0] ?? "";
    if (itemId) errors.push({ id: `${name}-${index}`, itemId, property, message });
    else if (message) formMessages.push(message);
  });
  if (invalidFieldNames.length === 0) formMessages.push(...errorMessages);
  return {
    errors,
    formMessage: formMessages.length > 0 ? [...new Set(formMessages)].join(" ") : undefined
  };
};

export const formDesignerPropertyControlId = (itemId: string, property: string) =>
  `form-designer-property-${encodeURIComponent(itemId)}-${property}`;

export const formDesignerRuntimeItems = (
  state: FormDesignerState
): TaskFormRuntimeItem[] => formItemsForTask(
  state.localDraft,
  state.taskElementId
).map((item) => {
  if (item.kind !== "field") {
    return {
      itemId: item.id,
      kind: item.kind,
      ...(item.kind === "divider" ? {} : { content: item.content }),
      position: item.position,
      width: item.width
    };
  }
  const field = state.localDraft.processFields.find(
    (candidate) => candidate.id === item.fieldId
  );
  if (!field) {
    return {
      itemId: item.id,
      kind: "unsupported-field",
      position: item.position,
      width: item.width
    };
  }
  return {
    itemId: item.id,
    controlId: item.id,
    fieldId: field.id,
    kind: "shortText",
    label: item.label ?? field.label,
    helpText: field.helpText,
    placeholder: field.placeholder,
    required: field.minimumLength > 0,
    position: item.position,
    width: item.width,
    value: field.defaultValue ?? ""
  };
});
