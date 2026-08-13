import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { StructuralFormItemKind } from "../../../entities/workflow";
import { useLanguage } from "../../../shared/localization";
import { Button, Card } from "../../../shared/ui";
import {
  FormDesignerItemTypeIcon,
  type FormDesignerItemType
} from "./FormDesignerItemTypeIcon";

export type FormDesignerPaletteItemKind = FormDesignerItemType;

export const formDesignerPaletteDragId = (kind: FormDesignerPaletteItemKind) =>
  `form-designer-palette:${kind}`;

type PaletteButtonProps = {
  disabled: boolean;
  kind: FormDesignerPaletteItemKind;
  label: string;
  onAdd: () => void;
};

const PaletteButton = ({ disabled, kind, label, onAdd }: PaletteButtonProps) => {
  const draggable = useDraggable({ id: formDesignerPaletteDragId(kind), disabled });
  return (
    <div
      className="w-full"
      ref={draggable.setNodeRef}
      style={{ transform: CSS.Translate.toString(draggable.transform) }}
    >
      <Button
        {...draggable.attributes}
        {...draggable.listeners}
        disabled={disabled}
        variant="secondary"
        width="full"
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          onAdd();
        }}
        onClick={(event) => {
          if (event.detail <= 1) onAdd();
        }}
      >
        <span className="flex w-full items-center gap-moviqo-3 text-left">
          <span className="grid size-8 shrink-0 place-items-center rounded-moviqo-field bg-moviqo-surface-soft text-moviqo-primary">
            <FormDesignerItemTypeIcon kind={kind} />
          </span>
          <span>{label}</span>
        </span>
      </Button>
    </div>
  );
};

type FormDesignerPaletteProps = {
  disabled: boolean;
  onAddShortText: () => void;
  onAddStructural: (kind: StructuralFormItemKind) => void;
};

export const FormDesignerPalette = ({
  disabled,
  onAddShortText,
  onAddStructural
}: FormDesignerPaletteProps) => {
  const { t } = useLanguage();
  const structuralItems: Array<[StructuralFormItemKind, string]> = [
    ["section", t("formDesign.section")],
    ["heading", t("formDesign.heading")],
    ["instruction", t("formDesign.instruction")],
    ["divider", t("formDesign.divider")]
  ];

  return (
    <aside className="grid content-start gap-moviqo-4" aria-label={t("formDesign.palette")}>
      <Card labelledBy="form-designer-fields-title">
        <h2 className="m-0 text-moviqo-heading" id="form-designer-fields-title">
          {t("formDesign.fields")}
        </h2>
        <PaletteButton
          disabled={disabled}
          kind="shortText"
          label={t("formDesign.shortText")}
          onAdd={onAddShortText}
        />
      </Card>
      <Card labelledBy="form-designer-layout-title">
        <h2 className="m-0 text-moviqo-heading" id="form-designer-layout-title">
          {t("formDesign.layout")}
        </h2>
        {structuralItems.map(([kind, label]) => (
          <PaletteButton
            disabled={disabled}
            key={kind}
            kind={kind}
            label={label}
            onAdd={() => onAddStructural(kind)}
          />
        ))}
      </Card>
    </aside>
  );
};
