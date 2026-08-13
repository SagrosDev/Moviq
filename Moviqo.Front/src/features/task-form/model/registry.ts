import type {
  FormItemWidth,
  StructuralFormItemKind,
  WorkflowProcessField,
  WorkflowTaskFieldBinding,
  WorkflowTaskStructuralItem
} from "../../../entities/workflow";
import { hasMeaningfulText } from "../../../shared/text";

export type RuntimeShortTextItem = {
  itemId: string;
  controlId: string;
  fieldId: string;
  kind: "shortText";
  label: string;
  labelVisuallyHidden?: boolean;
  helpText: string;
  placeholder: string;
  required?: boolean;
  minimumLength?: number;
  maximumLength?: number;
  width: FormItemWidth;
  position: number;
  value: string;
};

export type RuntimeStructuralItem = {
  itemId: string;
  kind: StructuralFormItemKind;
  content?: string;
  width: FormItemWidth;
  position: number;
};

export type RuntimeUnknownItem = {
  itemId: string;
  kind: string;
  width: FormItemWidth;
  position: number;
};

export type TaskFormRuntimeItem =
  | RuntimeShortTextItem
  | RuntimeStructuralItem
  | RuntimeUnknownItem;

export type TaskFormSupportedRenderDescriptor =
  | {
      kind: "shortText";
      item: RuntimeShortTextItem;
      itemId: string;
      position: number;
      width: FormItemWidth;
    }
  | {
      kind: "section" | "heading" | "instruction";
      item: RuntimeStructuralItem & { content: string };
      itemId: string;
      position: number;
      width: FormItemWidth;
    }
  | {
      kind: "divider";
      item: RuntimeStructuralItem;
      itemId: string;
      position: number;
      width: FormItemWidth;
    };

export type TaskFormRenderDescriptor = TaskFormSupportedRenderDescriptor | {
  kind: "unsupported";
  itemId: string;
  position: number;
  width: FormItemWidth;
};

type TaskFormDefaultDefinition =
  | {
      category: "field";
      processField: WorkflowProcessField;
      item: WorkflowTaskFieldBinding;
    }
  | {
      category: "layout";
      item: WorkflowTaskStructuralItem;
    };

type SupportedRegistryEntry = {
  status: "supported";
  kind: "shortText" | StructuralFormItemKind;
  category: "field" | "layout";
  hasRuntimeValue: boolean;
  createDefault: (
    taskElementId: string,
    ordinal: number,
    content: string
  ) => TaskFormDefaultDefinition;
  render: (item: unknown) => TaskFormSupportedRenderDescriptor | null;
  updateValue: (
    item: TaskFormRuntimeItem,
    controlId: string,
    value: string
  ) => TaskFormRuntimeItem;
  validatePresentation: (item: unknown) => string[];
};

type UnsupportedRegistryEntry = {
  status: "unsupported";
  kind: string;
};

const hasOwn = (value: object, key: PropertyKey) => (
  Object.prototype.hasOwnProperty.call(value, key)
);

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> => (
  typeof value === "object" && value !== null
);

const ownString = (value: Record<PropertyKey, unknown>, key: PropertyKey) => (
  hasOwn(value, key) && typeof value[key] === "string" ? value[key] : null
);

const ownOptionalBoolean = (value: Record<PropertyKey, unknown>, key: PropertyKey) => (
  !hasOwn(value, key) || typeof value[key] === "boolean"
);

const ownOptionalLength = (value: Record<PropertyKey, unknown>, key: PropertyKey) => (
  !hasOwn(value, key)
  || (Number.isInteger(value[key]) && Number(value[key]) >= 0)
);

const formItemWidths: readonly FormItemWidth[] = ["full", "half", "third", "quarter"];

const isFormItemWidth = (value: unknown): value is FormItemWidth => (
  typeof value === "string" && formItemWidths.some((width) => width === value)
);

const isRuntimeBase = (
  item: Record<PropertyKey, unknown>,
  kind: string
) => (
  ownString(item, "itemId") !== null
  && ownString(item, "kind") === kind
  && isFormItemWidth(item.width)
  && Number.isInteger(item.position)
  && Number(item.position) >= 0
);

const unchangedRuntimeValue = (item: TaskFormRuntimeItem) => item;

const shortTextPresentationIssues = (item: unknown) => {
  if (!isRecord(item) || !isRuntimeBase(item, "shortText")) return ["unsupported_item"];
  const label = ownString(item, "label");
  return label !== null && hasMeaningfulText(label) ? [] : ["label_required"];
};

const contentPresentationIssues = (item: unknown) => {
  if (!isRecord(item)) return ["unsupported_item"];
  return ownString(item, "content")?.trim() ? [] : ["content_required"];
};

const shortTextRenderDescriptor = (
  item: unknown
): TaskFormSupportedRenderDescriptor | null => {
  if (!isRecord(item) || !isRuntimeBase(item, "shortText")) return null;
  if (
    ownString(item, "controlId") === null
    || ownString(item, "fieldId") === null
    || ownString(item, "label") === null
    || ownString(item, "helpText") === null
    || ownString(item, "placeholder") === null
    || ownString(item, "value") === null
    || !ownOptionalBoolean(item, "required")
    || !ownOptionalBoolean(item, "labelVisuallyHidden")
    || !ownOptionalLength(item, "minimumLength")
    || !ownOptionalLength(item, "maximumLength")
  ) return null;
  const minimumLength = hasOwn(item, "minimumLength")
    ? Number(item.minimumLength)
    : undefined;
  const maximumLength = hasOwn(item, "maximumLength")
    ? Number(item.maximumLength)
    : undefined;
  if (
    minimumLength !== undefined
    && maximumLength !== undefined
    && minimumLength > maximumLength
  ) return null;
  const typedItem = item as RuntimeShortTextItem;
  return {
    kind: "shortText",
    item: typedItem,
    itemId: typedItem.itemId,
    position: typedItem.position,
    width: typedItem.width
  };
};

const contentRenderDescriptor = (
  item: unknown,
  kind: "section" | "heading" | "instruction"
): TaskFormSupportedRenderDescriptor | null => {
  if (!isRecord(item) || !isRuntimeBase(item, kind)) return null;
  if (ownString(item, "content") === null) return null;
  const typedItem = item as RuntimeStructuralItem & { content: string };
  return {
    kind,
    item: typedItem,
    itemId: typedItem.itemId,
    position: typedItem.position,
    width: typedItem.width
  };
};

const dividerRenderDescriptor = (
  item: unknown
): TaskFormSupportedRenderDescriptor | null => (
  isRecord(item) && isRuntimeBase(item, "divider")
    ? {
        kind: "divider",
        item: item as RuntimeStructuralItem,
        itemId: String(item.itemId),
        position: Number(item.position),
        width: item.width as FormItemWidth
      }
    : null
);

const createShortTextDefault = (
  taskElementId: string,
  ordinal: number,
  label: string
): TaskFormDefaultDefinition => ({
  category: "field",
  processField: {
    id: `field-${ordinal}`,
    kind: "shortText",
    label,
    helpText: "",
    placeholder: "",
    defaultValue: null,
    minimumLength: 0,
    maximumLength: 255
  },
  item: {
    id: `binding-${ordinal}`,
    kind: "field",
    taskElementId,
    fieldId: `field-${ordinal}`,
    position: ordinal - 1,
    width: "full",
    label: null
  }
});

const createStructuralDefault = (
  kind: StructuralFormItemKind,
  taskElementId: string,
  ordinal: number,
  content: string
): TaskFormDefaultDefinition => {
  const base = {
    id: `${kind}-${ordinal}`,
    taskElementId,
    position: ordinal - 1,
    width: "full" as const
  };
  return {
    category: "layout",
    item: kind === "divider"
      ? { ...base, kind: "divider" }
      : { ...base, kind, content }
  };
};

const registry = {
  shortText: {
    status: "supported",
    kind: "shortText",
    category: "field",
    hasRuntimeValue: true,
    createDefault: createShortTextDefault,
    render: shortTextRenderDescriptor,
    updateValue: (item, controlId, value) => {
      const descriptor = shortTextRenderDescriptor(item);
      return descriptor?.kind === "shortText" && descriptor.item.controlId === controlId
        ? { ...item, value }
        : item;
    },
    validatePresentation: shortTextPresentationIssues
  },
  section: {
    status: "supported",
    kind: "section",
    category: "layout",
    hasRuntimeValue: false,
    createDefault: (taskElementId, ordinal, content) => (
      createStructuralDefault("section", taskElementId, ordinal, content)
    ),
    render: (item) => contentRenderDescriptor(item, "section"),
    updateValue: unchangedRuntimeValue,
    validatePresentation: contentPresentationIssues
  },
  heading: {
    status: "supported",
    kind: "heading",
    category: "layout",
    hasRuntimeValue: false,
    createDefault: (taskElementId, ordinal, content) => (
      createStructuralDefault("heading", taskElementId, ordinal, content)
    ),
    render: (item) => contentRenderDescriptor(item, "heading"),
    updateValue: unchangedRuntimeValue,
    validatePresentation: contentPresentationIssues
  },
  instruction: {
    status: "supported",
    kind: "instruction",
    category: "layout",
    hasRuntimeValue: false,
    createDefault: (taskElementId, ordinal, content) => (
      createStructuralDefault("instruction", taskElementId, ordinal, content)
    ),
    render: (item) => contentRenderDescriptor(item, "instruction"),
    updateValue: unchangedRuntimeValue,
    validatePresentation: contentPresentationIssues
  },
  divider: {
    status: "supported",
    kind: "divider",
    category: "layout",
    hasRuntimeValue: false,
    createDefault: (taskElementId, ordinal, content) => (
      createStructuralDefault("divider", taskElementId, ordinal, content)
    ),
    render: dividerRenderDescriptor,
    updateValue: unchangedRuntimeValue,
    validatePresentation: (item) => (
      dividerRenderDescriptor(item) ? [] : ["unsupported_item"]
    )
  }
} satisfies Record<string, SupportedRegistryEntry>;

export const resolveFormItemRegistryEntry = (
  kind: string
): SupportedRegistryEntry | UnsupportedRegistryEntry => (
  hasOwn(registry, kind)
    ? registry[kind as keyof typeof registry]
    : { status: "unsupported", kind }
);

const unsupportedRenderDescriptor = (
  item: unknown,
  fallbackIndex: number
): TaskFormRenderDescriptor => {
  const record = isRecord(item) ? item : null;
  return {
    kind: "unsupported",
    itemId: record ? ownString(record, "itemId") ?? `unsupported-${fallbackIndex}` : `unsupported-${fallbackIndex}`,
    position: record && Number.isInteger(record.position) && Number(record.position) >= 0
      ? Number(record.position)
      : fallbackIndex,
    width: record && isFormItemWidth(record.width) ? record.width : "full"
  };
};

export const resolveTaskFormRenderDescriptor = (
  item: unknown,
  fallbackIndex = 0
): TaskFormRenderDescriptor => {
  if (!isRecord(item)) return unsupportedRenderDescriptor(item, fallbackIndex);
  const kind = ownString(item, "kind");
  if (kind === null) return unsupportedRenderDescriptor(item, fallbackIndex);
  const entry = resolveFormItemRegistryEntry(kind);
  if (entry.status === "unsupported") return unsupportedRenderDescriptor(item, fallbackIndex);
  return entry.render(item) ?? unsupportedRenderDescriptor(item, fallbackIndex);
};

export const updateTaskFormRuntimeItemValue = (
  item: TaskFormRuntimeItem,
  controlId: string,
  value: string
) => {
  const entry = resolveFormItemRegistryEntry(item.kind);
  return entry.status === "supported"
    ? entry.updateValue(item, controlId, value)
    : item;
};

export const createDefaultShortTextDefinition = (
  taskElementId: string,
  ordinal: number,
  label = "Short text"
): { processField: WorkflowProcessField; item: WorkflowTaskFieldBinding } => {
  const definition = registry.shortText.createDefault(taskElementId, ordinal, label);
  if (definition.category !== "field") {
    throw new Error("Short Text registry returned an invalid default definition.");
  }
  return {
    processField: definition.processField,
    item: definition.item
  };
};

export const createDefaultStructuralItem = (
  kind: StructuralFormItemKind,
  taskElementId: string,
  ordinal: number,
  content = ""
): WorkflowTaskStructuralItem => {
  const definition = registry[kind].createDefault(taskElementId, ordinal, content);
  if (definition.category !== "layout") {
    throw new Error("Structural registry returned an invalid default definition.");
  }
  return definition.item;
};
