import { useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type ScreenReaderInstructions
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { StructuralFormItemKind } from "../../../entities/workflow";
import { TaskFormRenderer } from "../../task-form";
import type { WorkflowCreationAccepted } from "../../workflow-design";
import { useLanguage } from "../../../shared/localization";
import { Alert, Button, Card, ErrorSummary, LoadingState } from "../../../shared/ui";
import {
  formDesignerDropIndex,
  formDesignerErrorSummary,
  formDesignerPropertyControlId,
  formDesignerRuntimeItems,
  formDesignerValidationIssues,
  formItemsForTask
} from "../model/formDesigner";
import { useFormDesigner } from "../model/useFormDesigner";
import {
  FormDesignerCanvas,
  formDesignerCanvasDropId
} from "./FormDesignerCanvas";
import {
  FormDesignerPalette,
  type FormDesignerPaletteItemKind
} from "./FormDesignerPalette";
import { FormDesignerProperties } from "./FormDesignerProperties";
import { FormDesignerSaveStatus } from "./FormDesignerSaveStatus";

type FormDesignerWorkspaceProps = {
  accepted: WorkflowCreationAccepted;
  taskElementId: string;
  onAccepted: (accepted: WorkflowCreationAccepted) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSaveAvailabilityChange?: (available: boolean) => void;
  onReturn: () => void;
  onSaveResult?: (saved: boolean) => void;
  saveRequestToken?: number;
};

const paletteKindFromDragId = (id: string): FormDesignerPaletteItemKind | null => {
  const prefix = "form-designer-palette:";
  if (!id.startsWith(prefix)) return null;
  const kind = id.slice(prefix.length);
  return ["shortText", "section", "heading", "instruction", "divider"].includes(kind)
    ? kind as FormDesignerPaletteItemKind
    : null;
};

export const FormDesignerWorkspace = ({
  accepted,
  taskElementId,
  onAccepted,
  onDirtyChange,
  onSaveAvailabilityChange,
  onReturn,
  onSaveResult,
  saveRequestToken = 0
}: FormDesignerWorkspaceProps) => {
  const { language, t } = useLanguage();
  const {
    state,
    dispatch,
    leaseState,
    saveDraft,
    reloadLatestAndReapply,
    releaseLease,
    takeOverLease
  } = useFormDesigner(
    accepted,
    taskElementId,
    onAccepted,
    saveRequestToken,
    onSaveResult
  );
  const summaryRef = useRef<HTMLDivElement>(null);
  const [confirmTakeover, setConfirmTakeover] = useState(false);
  const items = formItemsForTask(state.localDraft, taskElementId);
  const selectedItem = items.find((item) => item.id === state.selectedItemId) ?? null;
  const validationIssues = formDesignerValidationIssues(state);
  const saveErrors = formDesignerErrorSummary(state);
  const validationErrors = validationIssues.map((issue) => ({
    ...issue,
    message: issue.code === "label_required"
      ? t("formDesign.validation.labelRequired")
      : issue.code === "content_required"
        ? t("formDesign.validation.contentRequired")
        : t("formDesign.validation.minimumGreaterThanMaximum")
  }));
  const inlineErrors = [
    ...validationErrors,
    ...saveErrors.errors
  ].filter((error) => error.itemId === selectedItem?.id);
  const disabled = state.saveStatus === "saving" || leaseState.status !== "editable";
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const screenReaderInstructions: ScreenReaderInstructions = {
    draggable: t("formDesign.dragInstructions")
  };
  const announcements: Announcements = {
    onDragStart: () => t("formDesign.dragStart"),
    onDragMove: () => t("formDesign.dragMove"),
    onDragOver: () => t("formDesign.dragMove"),
    onDragEnd: () => t("formDesign.dragDrop"),
    onDragCancel: () => t("formDesign.dragCancel")
  };
  const leaseExpiry = useMemo(() => {
    if (!leaseState.lease?.leaseExpiresAt) return null;
    const date = new Date(leaseState.lease.leaseExpiresAt);
    if (Number.isNaN(date.valueOf())) return null;
    return new Intl.DateTimeFormat(language, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }, [language, leaseState.lease?.leaseExpiresAt]);

  const focusItemProperty = (itemId: string, property: string) => {
    dispatch({ type: "item-selected", itemId });
    window.requestAnimationFrame(() => {
      const propertyTarget = document.getElementById(
        formDesignerPropertyControlId(itemId, property)
      );
      const fallbackTarget = document.getElementById(`form-designer-item-${itemId}`);
      const target = propertyTarget instanceof HTMLElement ? propertyTarget : fallbackTarget;
      if (!(target instanceof HTMLElement)) return;
      target.scrollIntoView({ block: "center", behavior: "auto" });
      target.focus();
    });
  };

  const addPaletteItem = (kind: FormDesignerPaletteItemKind, toIndex?: number) => {
    if (kind === "shortText") {
      dispatch({ type: "short-text-added", label: t("formDesign.shortText"), toIndex });
      return;
    }
    dispatch({
      type: "structural-item-added",
      kind,
      content: kind === "divider" ? "" : t(`formDesign.default.${kind}`),
      toIndex
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    const paletteKind = paletteKindFromDragId(activeId);
    if (paletteKind) {
      if (!overId) return;
      const targetIndex = overId === formDesignerCanvasDropId
        ? items.length
        : items.findIndex((item) => item.id === overId);
      if (targetIndex >= 0) addPaletteItem(paletteKind, targetIndex);
      return;
    }
    const targetIndex = formDesignerDropIndex(
      items.map((item) => item.id),
      activeId,
      overId
    );
    if (targetIndex !== null) dispatch({ type: "item-moved", itemId: activeId, toIndex: targetIndex });
  };

  useEffect(() => {
    onDirtyChange?.(state.hasLocalChanges);
  }, [onDirtyChange, state.hasLocalChanges]);

  useEffect(() => {
    onSaveAvailabilityChange?.(
      leaseState.status === "editable" && state.saveStatus !== "saving"
    );
  }, [leaseState.status, onSaveAvailabilityChange, state.saveStatus]);

  useEffect(() => {
    if (state.errorMessages.length === 0) return;
    summaryRef.current?.focus();
    const firstError = saveErrors.errors[0];
    if (firstError) focusItemProperty(firstError.itemId, firstError.property);
  }, [state.errorMessages]);

  return (
    <div className="grid gap-moviqo-4">
      {leaseState.status === "acquiring" ? (
        <LoadingState>{t("formDesign.lease.acquiring")}</LoadingState>
      ) : leaseState.status !== "editable" ? (
        <Alert
          announcement="assertive"
          title={t(leaseState.messageKey ?? "formDesign.lease.readOnly")}
          tone={leaseState.status === "error" ? "error" : "warning"}
        >
          {leaseState.lease?.holder ? (
            <p className="m-0">
              {`${t("formDesign.lease.holder")} ${leaseState.lease.holder.displayName}`}
            </p>
          ) : null}
          {leaseExpiry ? (
            <p className="m-0">{`${t("formDesign.lease.expires")} ${leaseExpiry}`}</p>
          ) : null}
          {leaseState.status === "readOnly" && confirmTakeover ? (
            <div className="grid gap-moviqo-2">
              <p className="m-0">{t("formDesign.lease.takeoverWarning")}</p>
              <div className="flex flex-wrap gap-moviqo-2">
                <Button variant="destructive" onClick={() => {
                  setConfirmTakeover(false);
                  void takeOverLease();
                }}>
                  {t("formDesign.lease.takeoverConfirm")}
                </Button>
                <Button variant="secondary" onClick={() => setConfirmTakeover(false)}>
                  {t("formDesign.lease.takeoverCancel")}
                </Button>
              </div>
            </div>
          ) : leaseState.status === "readOnly" ? (
            <Button variant="secondary" onClick={() => setConfirmTakeover(true)}>
              {t("formDesign.lease.takeover")}
            </Button>
          ) : null}
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-moviqo-3">
        {leaseState.status === "acquiring" ? null : <FormDesignerSaveStatus state={state} />}
        <div className="flex flex-wrap gap-moviqo-2">
          <Button
            disabled={!state.hasLocalChanges || disabled}
            onClick={() => void saveDraft()}
          >
            {t("formDesign.save")}
          </Button>
          {state.saveStatus === "error" ? (
            <Button disabled={disabled} variant="secondary" onClick={() => void saveDraft()}>
              {t("formDesign.retry")}
            </Button>
          ) : null}
          {state.saveStatus === "conflict" ? (
            <Button disabled={disabled} variant="secondary" onClick={() => void reloadLatestAndReapply()}>
              {t("formDesign.reloadAndReapply")}
            </Button>
          ) : null}
          <Button
            disabled={disabled}
            variant="secondary"
            onClick={() => {
              if (!state.hasLocalChanges) {
                void releaseLease().then(onReturn);
              } else {
                void saveDraft().then(async (saved) => {
                  if (!saved) return;
                  await releaseLease();
                  onReturn();
                });
              }
            }}
          >
            {t("formDesign.saveAndReturn")}
          </Button>
        </div>
      </div>
      {validationErrors.length > 0 ? (
        <ErrorSummary
          errors={validationErrors.map((error) => ({
            id: `validation-${error.itemId}-${error.property}`,
            fieldId: formDesignerPropertyControlId(error.itemId, error.property),
            message: error.message
          }))}
          formMessage={t("formDesign.validationBody")}
          title={t("formDesign.validationTitle")}
          onErrorActivate={(error) => {
            const validation = validationErrors.find((candidate) => (
              formDesignerPropertyControlId(candidate.itemId, candidate.property) === error.fieldId
            ));
            if (validation) focusItemProperty(validation.itemId, validation.property);
          }}
        />
      ) : null}
      {state.errorMessages.length > 0 ? (
        <ErrorSummary
          errors={saveErrors.errors.map((error) => ({
            id: error.id,
            fieldId: formDesignerPropertyControlId(error.itemId, error.property),
            message: error.message
          }))}
          formMessage={saveErrors.formMessage}
          ref={summaryRef}
          title={t("formDesign.saveError")}
          onErrorActivate={(error) => {
            const saveError = saveErrors.errors.find((candidate) => (
              formDesignerPropertyControlId(candidate.itemId, candidate.property) === error.fieldId
            ));
            if (saveError) focusItemProperty(saveError.itemId, saveError.property);
          }}
        />
      ) : null}
      <DndContext
        accessibility={{ announcements, screenReaderInstructions }}
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-moviqo-4 desktop:grid-cols-[16rem_minmax(0,1fr)_20rem]">
          <FormDesignerPalette
            disabled={disabled}
            onAddShortText={() => addPaletteItem("shortText")}
            onAddStructural={(kind: StructuralFormItemKind) => addPaletteItem(kind)}
          />
          <div className="grid content-start gap-moviqo-4">
            <FormDesignerCanvas
              disabled={disabled}
              draft={state.localDraft}
              invalidItemIds={[
                ...validationErrors.map((error) => error.itemId),
                ...saveErrors.errors.map((error) => error.itemId)
              ]}
              items={items}
              selectedItemId={state.selectedItemId}
              onMove={(itemId, toIndex) => dispatch({ type: "item-moved", itemId, toIndex })}
              onSelect={(itemId) => dispatch({ type: "item-selected", itemId })}
            />
            <Card labelledBy="form-designer-preview-title">
              <h2 className="m-0 text-moviqo-heading" id="form-designer-preview-title">
                {t("formDesign.preview")}
              </h2>
              <TaskFormRenderer
                disabled
                errorMessages={[]}
                invalidFieldNames={[]}
                items={formDesignerRuntimeItems(state)}
                onValueChange={() => undefined}
              />
            </Card>
          </div>
          <FormDesignerProperties
            disabled={disabled}
            draft={state.localDraft}
            inlineErrors={inlineErrors}
            item={selectedItem}
            onContentChange={(itemId, content) => dispatch({ type: "item-content-changed", itemId, content })}
            onFieldConfigurationChange={(itemId, changes) => dispatch({
              type: "item-field-configuration-changed",
              itemId,
              changes
            })}
            onLabelChange={(itemId, label) => dispatch({ type: "item-label-changed", itemId, label })}
            onRemove={(itemId) => dispatch({ type: "item-removed", itemId })}
            onWidthChange={(itemId, width) => dispatch({ type: "item-width-changed", itemId, width })}
          />
        </div>
      </DndContext>
    </div>
  );
};
