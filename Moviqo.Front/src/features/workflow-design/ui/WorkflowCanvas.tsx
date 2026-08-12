import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent
} from "react";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  getSmoothStepPath,
  type EdgeProps,
  type EdgeTypes,
  type NodeProps,
  type NodeTypes,
  type ReactFlowInstance,
  type XYPosition
} from "@xyflow/react";
import { useLanguage } from "../../../shared/localization";
import { Card } from "../../../shared/ui";
import {
  canConnectWorkflowByKeyboard,
  deriveWorkflowFlowElements,
  workflowTopologyOrder,
  type WorkflowFlowEdge,
  type WorkflowFlowNode
} from "../model/flow";
import type { WorkflowDraftDocument, WorkflowElementType } from "../model/types";

type WorkflowCanvasProps = {
  draft: WorkflowDraftDocument;
  disabled: boolean;
  selectedElementId: string | null;
  selectedConnectionId: string | null;
  pointerElementType: WorkflowElementType | null;
  onPointerElementHandled: () => void;
  onAddAtPosition: (elementType: WorkflowElementType, position: XYPosition) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onPosition: (elementId: string, position: XYPosition) => void;
  onSelect: (elementId: string | null) => void;
  onSelectConnection: (connectionId: string | null) => void;
};

const nodeClasses: Record<WorkflowElementType, string> = {
  start: "size-moviqo-node-terminal rounded-full border-moviqo-success bg-moviqo-surface-raised p-moviqo-1 text-moviqo-node",
  task: "min-h-moviqo-node-task-height min-w-moviqo-node-task-width rounded-moviqo-control border-moviqo-accent bg-moviqo-surface-raised px-moviqo-2 py-moviqo-1 text-moviqo-node",
  end: "size-moviqo-node-terminal rounded-full border-moviqo-ink-primary bg-moviqo-surface-soft p-moviqo-1 text-moviqo-node"
};

const WorkflowNode = ({ data, selected }: NodeProps<WorkflowFlowNode>) => {
  const { t } = useLanguage();
  const { element } = data;
  const typeLabels: Record<WorkflowElementType, string> = {
    start: t("workflowDesign.editor.startLabel"),
    task: t("workflowDesign.editor.taskLabel"),
    end: t("workflowDesign.editor.endLabel")
  };
  const visibleLabel = element.type === "task" ? element.label : typeLabels[element.type];
  const activateHandle = (
    event: KeyboardEvent,
    activate: (() => void) | undefined
  ) => {
    if (!["Enter", " "].includes(event.key) || !activate) return;
    event.preventDefault();
    event.stopPropagation();
    activate();
  };
  return (
    <div
      className={`grid place-content-center border-2 text-center text-moviqo-ink-primary shadow-sm focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-moviqo-focus ${nodeClasses[element.type]} ${selected ? "outline-3 outline-offset-3 outline-moviqo-focus" : ""}`}
      id={`workflow-element-${element.id}`}
    >
      {element.type !== "start" ? (
        <Handle
          aria-label={t("workflowDesign.editor.incomingHandle")}
          aria-disabled={data.disabled}
          className="moviqo-workflow-handle"
          position={Position.Left}
          role="button"
          tabIndex={data.disabled ? -1 : 0}
          type="target"
          onKeyDown={(event) => activateHandle(
            event,
            data.keyboardSourceId
              ? () => data.onKeyboardTarget?.(element.id)
              : undefined
          )}
        />
      ) : null}
      <strong className="line-clamp-3 max-w-moviqo-node-task-width break-words leading-tight">{visibleLabel}</strong>
      <span className="sr-only">{typeLabels[element.type]}</span>
      {element.type !== "end" ? (
        <Handle
          aria-label={t("workflowDesign.editor.outgoingHandle")}
          aria-disabled={data.disabled}
          className="moviqo-workflow-handle"
          position={Position.Right}
          role="button"
          tabIndex={data.disabled ? -1 : 0}
          type="source"
          onKeyDown={(event) => activateHandle(
            event,
            () => data.onKeyboardSource?.(element.id)
          )}
        />
      ) : null}
    </div>
  );
};

const WorkflowSequenceEdge = (props: EdgeProps<WorkflowFlowEdge>) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);
  const label = props.data?.connection.label;
  const mostlyVertical = Math.abs(props.targetY - props.sourceY)
    > Math.abs(props.targetX - props.sourceX);
  const nearCanvasTop = labelY < 64;
  const labelTransform = mostlyVertical
    ? "translate(var(--spacing-moviqo-2), -50%)"
    : nearCanvasTop
      ? "translate(-50%, var(--spacing-moviqo-2))"
      : "translate(-50%, calc(-100% - var(--spacing-moviqo-2)))";
  return <>
    <BaseEdge
      className={props.selected ? "!stroke-moviqo-focus" : "!stroke-moviqo-ink-secondary"}
      id={props.id}
      interactionWidth={props.interactionWidth}
      markerEnd={props.markerEnd}
      markerStart={props.markerStart}
      path={edgePath}
      style={props.style}
    />
    {label ? (
      <EdgeLabelRenderer>
        <span
          className="pointer-events-none absolute line-clamp-2 max-w-moviqo-node-task-width rounded-moviqo-pill border border-moviqo-border bg-moviqo-surface-raised px-moviqo-2 py-moviqo-1 text-moviqo-label font-semibold text-moviqo-ink-primary shadow-sm"
          data-workflow-edge-label={props.id}
          style={{ transform: `${labelTransform} translate(${labelX}px, ${labelY}px)` }}
        >
          {label}
        </span>
      </EdgeLabelRenderer>
    ) : null}
  </>;
};

const nodeTypes: NodeTypes = {
  start: WorkflowNode,
  task: WorkflowNode,
  end: WorkflowNode
};

const edgeTypes: EdgeTypes = {
  sequence: WorkflowSequenceEdge
};

const isWorkflowElementType = (value: string): value is WorkflowElementType =>
  value === "start" || value === "task" || value === "end";

export const WorkflowCanvas = ({
  draft,
  disabled,
  selectedElementId,
  selectedConnectionId,
  pointerElementType,
  onPointerElementHandled,
  onAddAtPosition,
  onConnect,
  onPosition,
  onSelect,
  onSelectConnection
}: WorkflowCanvasProps) => {
  const { t } = useLanguage();
  const [keyboardSourceId, setKeyboardSourceId] = useState<string | null>(null);
  const instanceRef = useRef<ReactFlowInstance<WorkflowFlowNode, WorkflowFlowEdge> | null>(null);
  const flow = useMemo(
    () => deriveWorkflowFlowElements(draft),
    [draft]
  );
  const nodes = useMemo(
    () => flow.nodes.map((node) => {
      const typeLabel = t(`workflowDesign.editor.${node.data.element.type}Label`);
      const visibleLabel = node.data.element.type === "task"
        ? node.data.element.label
        : typeLabel;
      return {
        ...node,
        data: {
          ...node.data,
          disabled,
          keyboardSourceId,
          onKeyboardSource: disabled
            ? undefined
            : (elementId: string) => setKeyboardSourceId(elementId),
          onKeyboardTarget: disabled
            ? undefined
            : (elementId: string) => {
                if (canConnectWorkflowByKeyboard(disabled, keyboardSourceId)) {
                  onConnect(keyboardSourceId, elementId);
                }
                setKeyboardSourceId(null);
              }
        },
        ariaLabel: `${typeLabel}: ${visibleLabel}`,
        selected: node.id === selectedElementId
      };
    }),
    [disabled, flow.nodes, keyboardSourceId, onConnect, selectedElementId, t]
  );

  useEffect(() => {
    if (disabled) setKeyboardSourceId(null);
  }, [disabled]);

  const edges = useMemo(
    () => flow.edges.map((edge) => {
      const source = draft.elements.find((element) => element.id === edge.source);
      const target = draft.elements.find((element) => element.id === edge.target);
      const displayLabel = (element: typeof source) => element?.type === "task"
        ? element.label
        : element
          ? t(`workflowDesign.editor.${element.type}Label`)
          : "";
      const connectionLabel = edge.data?.connection.label
        ?? t("workflowDesign.editor.graphSummaryConnection");
      return {
        ...edge,
        ariaLabel: `${displayLabel(source)}; ${connectionLabel}; ${t("workflowDesign.editor.connectionTo")} ${displayLabel(target)}`,
        selected: edge.id === selectedConnectionId
      };
    }),
    [draft.elements, flow.edges, selectedConnectionId, t]
  );
  const topologyOrder = useMemo(() => workflowTopologyOrder(draft), [draft]);
  const ariaLabelConfig = useMemo(() => ({
    "node.a11yDescription.default": t("workflowDesign.editor.flowNodeDescription"),
    "node.a11yDescription.keyboardDisabled": t("workflowDesign.editor.flowNodeKeyboardDisabled"),
    "node.a11yDescription.ariaLiveMessage": () =>
      t("workflowDesign.editor.flowNodeMoved"),
    "edge.a11yDescription.default": t("workflowDesign.editor.flowEdgeDescription"),
    "controls.ariaLabel": t("workflowDesign.editor.flowControls"),
    "controls.zoomIn.ariaLabel": t("workflowDesign.editor.flowZoomIn"),
    "controls.zoomOut.ariaLabel": t("workflowDesign.editor.flowZoomOut"),
    "controls.fitView.ariaLabel": t("workflowDesign.editor.flowFitView"),
    "controls.interactive.ariaLabel": t("workflowDesign.editor.flowInteractive"),
    "handle.ariaLabel": t("workflowDesign.editor.flowHandle")
  }), [t]);

  useEffect(() => {
    if (!selectedElementId || !instanceRef.current) return;
    void instanceRef.current.fitView({
      nodes: [{ id: selectedElementId }],
      padding: 0.6,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180
    });
    window.requestAnimationFrame(() => {
      const selectedNode = document.querySelector(
        `.react-flow__node[data-id="${CSS.escape(selectedElementId)}"]`
      );
      if (selectedNode instanceof HTMLElement) selectedNode.focus();
    });
  }, [selectedElementId]);

  const addFromTransfer = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const elementType = event.dataTransfer.getData("application/x-moviqo-workflow-element");
    if (!isWorkflowElementType(elementType) || !instanceRef.current) return;
    onAddAtPosition(
      elementType,
      instanceRef.current.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    );
  };

  const addFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerElementType || !instanceRef.current) return;
    if (disabled) {
      onPointerElementHandled();
      return;
    }
    if (
      event.target instanceof Element
      && !event.target.closest(".react-flow__pane")
    ) return;
    onAddAtPosition(
      pointerElementType,
      instanceRef.current.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    );
    onPointerElementHandled();
  };

  return (
    <div className="workflow-canvas-shell grid min-h-moviqo-workspace">
    <Card labelledBy="workflow-canvas-title">
      <div className="grid gap-moviqo-1">
        <h2 className="m-0 text-moviqo-heading font-semibold" id="workflow-canvas-title" tabIndex={-1}>
          {t("workflowDesign.editor.canvasTitle")}
        </h2>
        <p className="m-0 text-sm text-moviqo-ink-secondary">
          {t("workflowDesign.editor.canvasBody")}
        </p>
      </div>
      <div
        aria-describedby="workflow-graph-summary"
        className="min-h-moviqo-workspace overflow-hidden rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-soft"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDrop={addFromTransfer}
        onKeyDownCapture={(event) => {
          if (disabled) return;
          const flowElement = event.target instanceof Element
            ? event.target.closest(".react-flow__node, .react-flow__edge")
            : null;
          const elementId = flowElement?.getAttribute("data-id");
          if (!elementId) return;
          const movement = {
            ArrowUp: { x: 0, y: -1 },
            ArrowRight: { x: 1, y: 0 },
            ArrowDown: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 }
          }[event.key];
          if (movement && flowElement?.classList.contains("react-flow__node")) {
            const node = nodes.find((candidate) => candidate.id === elementId);
            if (!node) return;
            const step = event.shiftKey ? 20 : 5;
            event.preventDefault();
            event.stopPropagation();
            onPosition(elementId, {
              x: node.position.x + movement.x * step,
              y: node.position.y + movement.y * step
            });
            return;
          }
          if (!["Enter", " "].includes(event.key)) return;
          if (flowElement?.classList.contains("react-flow__edge")) {
            onSelectConnection(elementId);
          } else {
            onSelect(elementId);
          }
        }}
        onPointerUp={addFromPointer}
      >
        <ol className="sr-only" id="workflow-graph-summary">
          {topologyOrder.map((elementId) => {
            const element = draft.elements.find((candidate) => candidate.id === elementId);
            if (!element) return null;
            const next = draft.connections.find((connection) => connection.sourceId === elementId);
            const target = next
              ? draft.elements.find((candidate) => candidate.id === next.targetId)
              : null;
            const targetLabel = target?.type === "task"
              ? target.label
              : target
                ? t(`workflowDesign.editor.${target.type}Label`)
                : next?.targetId ?? "";
            return <li key={element.id}>
              {element.type === "task" ? element.label : t(`workflowDesign.editor.${element.type}Label`)}
              {next ? `; ${next.label ?? t("workflowDesign.editor.graphSummaryConnection")}; ${t("workflowDesign.editor.connectionTo")} ${targetLabel}` : ""}
            </li>;
          })}
        </ol>
        <ReactFlow<WorkflowFlowNode, WorkflowFlowEdge>
          ariaLabelConfig={ariaLabelConfig}
          colorMode="light"
          deleteKeyCode={null}
          edges={edges}
          edgeTypes={edgeTypes}
          elevateEdgesOnSelect={false}
          elementsSelectable={!disabled}
          fitView
          nodes={nodes}
          nodesConnectable={!disabled}
          nodesDraggable={!disabled}
          nodeTypes={nodeTypes}
          onConnect={(connection) => {
            if (!disabled) onConnect(connection.source, connection.target);
          }}
          onEdgeClick={(_event, edge) => onSelectConnection(edge.id)}
          onInit={(instance) => {
            instanceRef.current = instance;
          }}
          onNodeClick={(_event, node) => onSelect(node.id)}
          onNodeDragStop={(_event, node) => {
            if (!disabled) onPosition(node.id, node.position);
          }}
          onPaneClick={() => {
            onSelect(null);
            onSelectConnection(null);
          }}
        >
          <Background />
          <Controls
            aria-label={t("workflowDesign.editor.flowControls")}
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </Card>
    </div>
  );
};
