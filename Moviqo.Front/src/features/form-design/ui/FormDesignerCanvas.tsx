import type { WorkflowDraftDocument, WorkflowTaskFormItem } from "../../../entities/workflow";
import {
  useDroppable
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLanguage } from "../../../shared/localization";
import { Button, Card, FormGrid, FormGridItem } from "../../../shared/ui";

export const formDesignerCanvasDropId = "form-designer-canvas-drop";

type FormDesignerCanvasProps = {
  draft: WorkflowDraftDocument;
  items: WorkflowTaskFormItem[];
  selectedItemId: string | null;
  invalidItemIds: string[];
  disabled: boolean;
  onMove: (itemId: string, toIndex: number) => void;
  onSelect: (itemId: string) => void;
};

const itemLabel = (draft: WorkflowDraftDocument, item: WorkflowTaskFormItem) => {
  if (item.kind === "field") {
    return item.label ?? draft.processFields.find((field) => field.id === item.fieldId)?.label ?? item.id;
  }
  return item.kind === "divider" ? item.id : item.content || item.id;
};

type SortableFormItemCardProps = {
  disabled: boolean;
  draft: WorkflowDraftDocument;
  index: number;
  item: WorkflowTaskFormItem;
  itemCount: number;
  selected: boolean;
  invalid: boolean;
  onMove: (itemId: string, toIndex: number) => void;
  onSelect: (itemId: string) => void;
};

const SortableFormItemCard = ({
  disabled,
  draft,
  index,
  item,
  itemCount,
  selected,
  invalid,
  onMove,
  onSelect
}: SortableFormItemCardProps) => {
  const { t } = useLanguage();
  const sortable = useSortable({ id: item.id, disabled });
  return (
    <FormGridItem span={item.width}>
      <div
        className="grid min-h-11 gap-moviqo-2 rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-soft p-moviqo-3"
        data-selected={selected}
        data-invalid={invalid || undefined}
        ref={sortable.setNodeRef}
        style={{
          opacity: sortable.isDragging ? 0.65 : 1,
          transform: CSS.Transform.toString(sortable.transform),
          transition: sortable.transition
        }}
      >
        <button
          {...sortable.attributes}
          {...sortable.listeners}
          className="min-h-11 rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-raised px-moviqo-3 text-left font-semibold focus-visible:outline-3 focus-visible:outline-moviqo-focus"
          disabled={disabled}
          type="button"
        >
          {t("formDesign.dragHandle")}
        </button>
        <button
          className="min-h-11 rounded-moviqo-control border-0 bg-transparent text-left font-semibold focus-visible:outline-3 focus-visible:outline-moviqo-focus"
          type="button"
          aria-pressed={selected}
          id={`form-designer-item-${item.id}`}
          onClick={() => onSelect(item.id)}
        >
          {itemLabel(draft, item)}
        </button>
        <div className="flex flex-wrap gap-moviqo-2">
          <Button disabled={disabled || index === 0} variant="secondary" onClick={() => onMove(item.id, index - 1)}>
            {t("formDesign.moveUp")}
          </Button>
          <Button disabled={disabled || index === itemCount - 1} variant="secondary" onClick={() => onMove(item.id, index + 1)}>
            {t("formDesign.moveDown")}
          </Button>
        </div>
      </div>
    </FormGridItem>
  );
};

export const FormDesignerCanvas = ({
  draft,
  items,
  selectedItemId,
  invalidItemIds,
  disabled,
  onMove,
  onSelect
}: FormDesignerCanvasProps) => {
  const { t } = useLanguage();
  const droppable = useDroppable({ id: formDesignerCanvasDropId, disabled });
  return (
    <div ref={droppable.setNodeRef} data-drop-active={droppable.isOver || undefined}>
      <Card labelledBy="form-designer-canvas-title">
        <h2 className="m-0 text-moviqo-heading" id="form-designer-canvas-title">
          {t("formDesign.canvas")}
        </h2>
        {items.length === 0 ? <p className="m-0 text-moviqo-ink-secondary">{t("formDesign.empty")}</p> : (
          <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
            <FormGrid>
              {items.map((item, index) => (
                <SortableFormItemCard
                  disabled={disabled}
                  draft={draft}
                  index={index}
                  item={item}
                  itemCount={items.length}
                  invalid={invalidItemIds.includes(item.id)}
                  key={item.id}
                  selected={item.id === selectedItemId}
                  onMove={onMove}
                  onSelect={onSelect}
                />
              ))}
            </FormGrid>
          </SortableContext>
        )}
      </Card>
    </div>
  );
};
