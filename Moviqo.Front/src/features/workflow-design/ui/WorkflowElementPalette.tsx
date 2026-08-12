import { useRef, type PointerEvent } from "react";
import { useLanguage } from "../../../shared/localization";
import { Alert, Button, Card } from "../../../shared/ui";
import type { WorkflowElementType } from "../model/types";

type WorkflowElementPaletteProps = {
  disabled: boolean;
  hasStart: boolean;
  rejected: boolean;
  onAdd: (elementType: WorkflowElementType) => void;
  onPointerStart: (elementType: WorkflowElementType, event: PointerEvent) => void;
};

const paletteItems: Array<{
  type: WorkflowElementType;
  labelKey:
    | "workflowDesign.editor.addTask"
    | "workflowDesign.editor.addEnd";
}> = [
  { type: "task", labelKey: "workflowDesign.editor.addTask" },
  { type: "end", labelKey: "workflowDesign.editor.addEnd" }
];

export const WorkflowElementPalette = ({
  disabled,
  hasStart,
  rejected,
  onAdd,
  onPointerStart
}: WorkflowElementPaletteProps) => {
  const { t } = useLanguage();
  const suppressNextClick = useRef(false);

  return (
    <Card labelledBy="workflow-palette-title">
      <div className="grid gap-moviqo-1">
        <h2 className="m-0 text-moviqo-heading font-semibold" id="workflow-palette-title">
          {t("workflowDesign.editor.paletteTitle")}
        </h2>
        <p className="m-0 text-sm text-moviqo-ink-secondary">
          {t("workflowDesign.editor.paletteBody")}
        </p>
      </div>
      <div className="grid gap-moviqo-2">
        {!hasStart ? (
          <Button
            data-workflow-palette-type="start-recovery"
            disabled={disabled}
            variant="secondary"
            width="full"
            onClick={() => onAdd("start")}
          >
            {t("workflowDesign.editor.addStartRecovery")}
          </Button>
        ) : null}
        {paletteItems.map((item) => (
          <Button
            data-workflow-palette-type={item.type}
            disabled={disabled}
            draggable={!disabled}
            key={item.type}
            variant="secondary"
            width="full"
            onClick={(event) => {
              if (suppressNextClick.current) {
                suppressNextClick.current = false;
                return;
              }
              if (event.detail < 2) {
                onAdd(item.type);
              }
            }}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData("application/x-moviqo-workflow-element", item.type);
            }}
            onPointerDown={(event) => {
              if (event.pointerType === "touch" || event.pointerType === "pen") {
                suppressNextClick.current = true;
              }
              onPointerStart(item.type, event);
            }}
          >
            {t(item.labelKey)}
          </Button>
        ))}
      </div>
      {rejected ? (
        <Alert announcement="polite" tone="warning">
          {t("workflowDesign.editor.addRejected")}
        </Alert>
      ) : null}
    </Card>
  );
};
