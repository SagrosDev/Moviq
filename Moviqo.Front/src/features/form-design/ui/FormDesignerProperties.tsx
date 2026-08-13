import type {
  FormItemWidth,
  WorkflowDraftDocument,
  WorkflowProcessField,
  WorkflowTaskFormItem
} from "../../../entities/workflow";
import { useLanguage } from "../../../shared/localization";
import { Button, Card, CheckboxField, SelectField, TextInput } from "../../../shared/ui";
import { formDesignerPropertyControlId } from "../model/formDesigner";

type EditableShortTextConfiguration = Partial<Pick<
  WorkflowProcessField,
  | "helpText"
  | "placeholder"
  | "defaultValue"
  | "minimumLength"
  | "maximumLength"
>>;

type FormDesignerPropertiesProps = {
  draft: WorkflowDraftDocument;
  item: WorkflowTaskFormItem | null;
  disabled: boolean;
  inlineErrors: Array<{ property: string; message: string }>;
  onContentChange: (itemId: string, content: string) => void;
  onFieldConfigurationChange: (
    itemId: string,
    changes: EditableShortTextConfiguration
  ) => void;
  onLabelChange: (itemId: string, label: string) => void;
  onRemove: (itemId: string) => void;
  onWidthChange: (itemId: string, width: FormItemWidth) => void;
};

export const FormDesignerProperties = ({
  draft,
  item,
  disabled,
  inlineErrors,
  onContentChange,
  onFieldConfigurationChange,
  onLabelChange,
  onRemove,
  onWidthChange
}: FormDesignerPropertiesProps) => {
  const { t } = useLanguage();
  const field = item?.kind === "field"
    ? draft.processFields.find((candidate) => candidate.id === item.fieldId)
    : null;
  const errorFor = (property: string) => inlineErrors.find(
    (error) => error.property === property
  )?.message;
  return (
    <aside>
      <Card labelledBy="form-designer-properties-title">
        <h2 className="m-0 text-moviqo-heading" id="form-designer-properties-title">
          {t("formDesign.properties")}
        </h2>
        {!item ? <p className="m-0">{t("formDesign.selectItem")}</p> : (
          <>
            {item.kind === "field" ? (
              <>
                <TextInput
                  disabled={disabled}
                  errorMessage={errorFor("label")}
                  id={formDesignerPropertyControlId(item.id, "label")}
                  label={t("formDesign.label")}
                  value={item.label ?? field?.label ?? ""}
                  onChange={(event) => onLabelChange(item.id, event.target.value)}
                />
                <TextInput
                  disabled={disabled}
                  errorMessage={errorFor("helpText")}
                  id={formDesignerPropertyControlId(item.id, "helpText")}
                  label={t("formDesign.helpText")}
                  value={field?.helpText ?? ""}
                  onChange={(event) => onFieldConfigurationChange(item.id, {
                    helpText: event.target.value
                  })}
                />
                <TextInput
                  disabled={disabled}
                  errorMessage={errorFor("placeholder")}
                  id={formDesignerPropertyControlId(item.id, "placeholder")}
                  label={t("formDesign.placeholder")}
                  value={field?.placeholder ?? ""}
                  onChange={(event) => onFieldConfigurationChange(item.id, {
                    placeholder: event.target.value
                  })}
                />
                <TextInput
                  disabled={disabled}
                  errorMessage={errorFor("defaultValue")}
                  id={formDesignerPropertyControlId(item.id, "defaultValue")}
                  label={t("formDesign.defaultValue")}
                  value={field?.defaultValue ?? ""}
                  onChange={(event) => onFieldConfigurationChange(item.id, {
                    defaultValue: event.target.value || null
                  })}
                />
                <CheckboxField
                  checked={(field?.minimumLength ?? 0) > 0}
                  disabled={disabled}
                  errorMessage={errorFor("required")}
                  id={formDesignerPropertyControlId(item.id, "required")}
                  label={t("formDesign.required")}
                  onChange={(event) => onFieldConfigurationChange(item.id, {
                    minimumLength: event.target.checked
                      ? Math.max(1, field?.minimumLength ?? 0)
                      : 0
                  })}
                />
                <TextInput
                  disabled={disabled}
                  errorMessage={errorFor("minimumLength")}
                  id={formDesignerPropertyControlId(item.id, "minimumLength")}
                  label={t("formDesign.minimumLength")}
                  max={255}
                  min={0}
                  type="number"
                  value={field?.minimumLength ?? 0}
                  onChange={(event) => onFieldConfigurationChange(item.id, {
                    minimumLength: Number(event.target.value)
                  })}
                />
                <TextInput
                  disabled={disabled}
                  errorMessage={errorFor("maximumLength")}
                  id={formDesignerPropertyControlId(item.id, "maximumLength")}
                  label={t("formDesign.maximumLength")}
                  max={255}
                  min={0}
                  type="number"
                  value={field?.maximumLength ?? 255}
                  onChange={(event) => onFieldConfigurationChange(item.id, {
                    maximumLength: Number(event.target.value)
                  })}
                />
              </>
            ) : item.kind !== "divider" ? (
              <TextInput
                disabled={disabled}
                errorMessage={errorFor("content")}
                id={formDesignerPropertyControlId(item.id, "content")}
                label={t("formDesign.content")}
                value={item.content}
                onChange={(event) => onContentChange(item.id, event.target.value)}
              />
            ) : null}
            <SelectField
              disabled={disabled}
              errorMessage={errorFor("width")}
              id={formDesignerPropertyControlId(item.id, "width")}
              label={t("formDesign.width")}
              options={("full half third quarter".split(" ") as FormItemWidth[]).map((width) => ({
                value: width,
                label: t(`formDesign.width.${width}`)
              }))}
              value={item.width}
              onChange={(event) => onWidthChange(item.id, event.target.value as FormItemWidth)}
            />
            <Button disabled={disabled} variant="destructive" onClick={() => onRemove(item.id)}>
              {t("formDesign.remove")}
            </Button>
          </>
        )}
      </Card>
    </aside>
  );
};
