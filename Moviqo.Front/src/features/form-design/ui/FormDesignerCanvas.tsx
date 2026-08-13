import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WorkflowDraftDocument, WorkflowTaskFormItem } from "../../../entities/workflow";
import { useLanguage, type MessageKey } from "../../../shared/localization";
import { Button, Card, FormGrid, FormGridItem } from "../../../shared/ui";
import {
  FormDesignerItemTypeIcon,
  type FormDesignerItemType
} from "./FormDesignerItemTypeIcon";

export const formDesignerCanvasDropId = "form-designer-canvas-drop";

type FormDesignerCanvasProps = {
  draft: WorkflowDraftDocument;
  items: WorkflowTaskFormItem[];
  selectedItemId: string | null;
  invalidItemIds: string[];
  disabled: boolean;
  dropTargetItemId: string | null;
  onMove: (itemId: string, toIndex: number) => void;
  onSelect: (itemId: string) => void;
};

const typeMessageKeyByKind: Record<FormDesignerItemType, MessageKey> = {
  shortText: "formDesign.shortText",
  section: "formDesign.section",
  heading: "formDesign.heading",
  instruction: "formDesign.instruction",
  divider: "formDesign.divider"
};

const itemType = (item: WorkflowTaskFormItem): FormDesignerItemType => (
  item.kind === "field" ? "shortText" : item.kind
);

const itemAuthoredText = (
  draft: WorkflowDraftDocument,
  item: WorkflowTaskFormItem
) => {
  if (item.kind === "field") {
    return item.label
      ?? draft.processFields.find((field) => field.id === item.fieldId)?.label
      ?? "";
  }
  return item.kind === "divider" ? "" : item.content;
};

type FormDesignerItemIdentityProps = {
  draft: WorkflowDraftDocument;
  item: WorkflowTaskFormItem;
};

const FormDesignerItemIdentity = ({ draft, item }: FormDesignerItemIdentityProps) => {
  const { t } = useLanguage();
  const kind = itemType(item);
  const authoredText = itemAuthoredText(draft, item);
  const typeLabel = t(typeMessageKeyByKind[kind]);

  return (
    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-moviqo-2">
      <span className="inline-flex shrink-0 items-center gap-moviqo-2 rounded-moviqo-field bg-moviqo-surface-soft px-moviqo-2 py-moviqo-1 text-moviqo-label font-semibold text-moviqo-primary">
        <FormDesignerItemTypeIcon kind={kind} />
        <span>{typeLabel}</span>
      </span>
      {authoredText ? (
        <span className="min-w-0 basis-full wrap-anywhere text-moviqo-ink-primary">
          {authoredText}
        </span>
      ) : null}
    </span>
  );
};

const ReorderIcon = () => (
  <svg aria-hidden="true" className="size-5" focusable="false" viewBox="0 0 24 24">
    <path
      d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="3"
    />
  </svg>
);

type SortableFormItemCardProps = {
  disabled: boolean;
  dropTarget: boolean;
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
  dropTarget,
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
  const kind = itemType(item);
  const typeLabel = t(typeMessageKeyByKind[kind]);
  const authoredText = itemAuthoredText(draft, item);
  const selectionLabel = authoredText ? `${typeLabel}: ${authoredText}` : typeLabel;
  const tooltipId = `form-designer-drag-tooltip-${item.id}`;

  return (
    <FormGridItem span={item.width}>
      <div
        className="grid min-h-11 gap-moviqo-2 rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-soft p-moviqo-3 data-[drop-target=true]:border-moviqo-primary data-[drop-target=true]:bg-moviqo-surface-raised"
        data-dragging={sortable.isDragging || undefined}
        data-drop-target={dropTarget || undefined}
        data-form-designer-item-id={item.id}
        data-form-designer-item-type={kind}
        data-selected={selected}
        data-invalid={invalid || undefined}
        ref={sortable.setNodeRef}
        style={{
          opacity: sortable.isDragging ? 0.35 : 1,
          transform: CSS.Translate.toString(sortable.transform),
          transition: sortable.transition
        }}
      >
        <div className="flex min-w-0 items-start gap-moviqo-2">
          <button
            className="inline-flex min-h-11 min-w-0 flex-1 items-center rounded-moviqo-control border-0 bg-transparent px-moviqo-2 text-left font-semibold focus-visible:outline-3 focus-visible:outline-moviqo-focus"
            type="button"
            aria-label={selectionLabel}
            aria-pressed={selected}
            id={`form-designer-item-${item.id}`}
            onClick={() => onSelect(item.id)}
          >
            <FormDesignerItemIdentity draft={draft} item={item} />
          </button>
          <span className="group relative shrink-0">
            <button
              {...sortable.attributes}
              {...sortable.listeners}
              aria-label={t("formDesign.dragHandle")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-raised text-moviqo-primary hover:border-moviqo-primary hover:bg-moviqo-surface-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moviqo-focus disabled:cursor-not-allowed disabled:bg-moviqo-surface-soft disabled:text-moviqo-ink-disabled"
              disabled={disabled}
              type="button"
            >
              <ReorderIcon />
            </button>
            <span
              className="pointer-events-none invisible absolute bottom-full right-0 z-20 mb-moviqo-2 w-max rounded-moviqo-field bg-moviqo-ink-primary px-moviqo-2 py-moviqo-1 text-moviqo-label font-semibold text-moviqo-surface-raised opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 motion-reduce:transition-none"
              id={tooltipId}
              role="tooltip"
            >
              {t("formDesign.dragHandle")}
            </span>
          </span>
        </div>
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

type FormDesignerDragOverlayProps = {
  draft: WorkflowDraftDocument;
  height: number;
  item: WorkflowTaskFormItem;
  width: number;
};

export const FormDesignerDragOverlay = ({
  draft,
  height,
  item,
  width
}: FormDesignerDragOverlayProps) => {
  const { t } = useLanguage();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none grid gap-moviqo-2 rounded-moviqo-control border border-moviqo-primary bg-moviqo-surface-raised p-moviqo-3 opacity-95 shadow-lg"
      data-form-designer-drag-overlay="true"
      style={{ height, width }}
    >
      <div className="flex min-w-0 items-start gap-moviqo-2">
        <span className="inline-flex min-h-11 min-w-0 flex-1 items-center px-moviqo-2 text-left font-semibold">
          <FormDesignerItemIdentity draft={draft} item={item} />
        </span>
        <span className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-raised text-moviqo-primary">
          <ReorderIcon />
        </span>
      </div>
      <div className="flex flex-wrap gap-moviqo-2">
        <span className="inline-flex min-h-11 items-center rounded-moviqo-control border border-moviqo-border px-moviqo-4 py-moviqo-2 text-moviqo-label font-semibold text-moviqo-primary">
          {t("formDesign.moveUp")}
        </span>
        <span className="inline-flex min-h-11 items-center rounded-moviqo-control border border-moviqo-border px-moviqo-4 py-moviqo-2 text-moviqo-label font-semibold text-moviqo-primary">
          {t("formDesign.moveDown")}
        </span>
      </div>
    </div>
  );
};

export const FormDesignerCanvas = ({
  draft,
  items,
  selectedItemId,
  invalidItemIds,
  disabled,
  dropTargetItemId,
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
                  dropTarget={item.id === dropTargetItemId}
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
