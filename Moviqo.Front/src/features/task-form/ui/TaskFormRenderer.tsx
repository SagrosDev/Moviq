import type { ReactNode } from "react";
import { useLanguage } from "../../../shared/localization";
import { Alert, FormGrid, FormGridItem, TextInput } from "../../../shared/ui";
import { taskFormControlValuePath } from "../model/taskForm";
import {
  resolveTaskFormRenderDescriptor,
  type RuntimeShortTextItem,
  type TaskFormRenderDescriptor,
  type TaskFormRuntimeItem
} from "../model/registry";

type TaskFormRendererProps = {
  items: TaskFormRuntimeItem[];
  disabled: boolean;
  invalidFieldNames: string[];
  errorMessages: string[];
  onValueChange: (controlId: string, value: string) => void;
};

const fieldMessageFor = (
  invalidFieldNames: string[],
  errorMessages: string[],
  controlId: string
) => {
  const targetPath = taskFormControlValuePath(controlId);
  const index = invalidFieldNames.findIndex((name) => name === targetPath);
  return index >= 0 ? errorMessages[index] : undefined;
};

const ShortTextItem = ({
  item,
  disabled,
  errorMessage,
  onValueChange
}: {
  item: RuntimeShortTextItem;
  disabled: boolean;
  errorMessage?: string;
  onValueChange: (controlId: string, value: string) => void;
}) => (
  <TextInput
    disabled={disabled}
    errorMessage={errorMessage}
    helpText={item.helpText}
    id={`task-form-${item.controlId}`}
    label={item.label}
    maxLength={item.maximumLength}
    minLength={item.minimumLength}
    placeholder={item.placeholder}
    required={item.required}
    type="text"
    value={item.value}
    onChange={(event) => onValueChange(item.controlId, event.target.value)}
  />
);

const renderSupportedDescriptor = (
  descriptor: Exclude<TaskFormRenderDescriptor, { kind: "unsupported" }>,
  disabled: boolean,
  errorMessage: string | undefined,
  onValueChange: (controlId: string, value: string) => void
): ReactNode => {
  if (descriptor.kind === "shortText") {
    return (
      <ShortTextItem
        disabled={disabled}
        errorMessage={errorMessage}
        item={descriptor.item}
        onValueChange={onValueChange}
      />
    );
  }
  if (descriptor.kind === "section") {
    return (
      <section className="border-t border-moviqo-border pt-moviqo-4">
        <h2 className="m-0 text-moviqo-heading font-semibold">{descriptor.item.content}</h2>
      </section>
    );
  }
  if (descriptor.kind === "heading") {
    return <h3 className="m-0 text-lg font-semibold">{descriptor.item.content}</h3>;
  }
  if (descriptor.kind === "instruction") {
    return (
      <p className="m-0 text-moviqo-body text-moviqo-ink-secondary">
        {descriptor.item.content}
      </p>
    );
  }
  return <hr className="m-0 border-0 border-t border-moviqo-border" />;
};

export const TaskFormRenderer = ({
  items,
  disabled,
  invalidFieldNames,
  errorMessages,
  onValueChange
}: TaskFormRendererProps) => {
  const { t } = useLanguage();
  const orderedDescriptors = items
    .map((item, index) => resolveTaskFormRenderDescriptor(item, index))
    .sort((left, right) => (
      left.position - right.position || left.itemId.localeCompare(right.itemId)
    ));

  return (
    <FormGrid>
      {orderedDescriptors.map((descriptor) => (
        <FormGridItem key={descriptor.itemId} span={descriptor.width}>
          {descriptor.kind === "unsupported" ? (
            <Alert announcement="assertive" tone="error">
              {t("taskForm.unsupportedItem")}
            </Alert>
          ) : renderSupportedDescriptor(
            descriptor,
            disabled,
            descriptor.kind === "shortText"
              ? fieldMessageFor(
                  invalidFieldNames,
                  errorMessages,
                  descriptor.item.controlId
                )
              : undefined,
            onValueChange
          )}
        </FormGridItem>
      ))}
    </FormGrid>
  );
};
