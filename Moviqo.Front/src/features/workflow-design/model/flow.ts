import type { Connection, Edge, Node, XYPosition } from "@xyflow/react";
import type {
  WorkflowDraftDocument,
  WorkflowDraftConnection,
  WorkflowDraftElement,
  WorkflowElementType
} from "./types";
import type { WorkflowElementLabels } from "./editor";

export type WorkflowFlowNodeData = Record<string, unknown> & {
  element: WorkflowDraftElement;
};

export type WorkflowFlowNode = Node<WorkflowFlowNodeData, WorkflowElementType>;
export type WorkflowFlowEdgeData = Record<string, unknown> & {
  connection: WorkflowDraftConnection;
};

export type WorkflowFlowEdge = Edge<WorkflowFlowEdgeData, "sequence">;

export type WorkflowAddResult =
  | {
      accepted: true;
      draft: WorkflowDraftDocument;
      elementId: string;
    }
  | {
      accepted: false;
      draft: WorkflowDraftDocument;
      reason: "cardinality";
    };

export type WorkflowConnectResult =
  | {
      accepted: true;
      draft: WorkflowDraftDocument;
      connectionId: string;
    }
  | {
      accepted: false;
      draft: WorkflowDraftDocument;
       reason:
         | "missing-endpoint"
         | "invalid-direction"
         | "duplicate"
         | "cycle"
         | "maximum-cardinality";
    };

const FALLBACK_COLUMNS = 500;
const fallbackPosition = (index: number): XYPosition => ({
  x: 80 + (index % FALLBACK_COLUMNS) * 200,
  y: 120 + Math.floor(index / FALLBACK_COLUMNS) * 160
});

const overlapsPosition = (candidate: XYPosition, occupied: XYPosition[]) =>
  occupied.some((position) => (
    Math.abs(position.x - candidate.x) < 160
    && Math.abs(position.y - candidate.y) < 80
  ));

export const workflowTopologyOrder = (draft: WorkflowDraftDocument): string[] => {
  const visited = new Set<string>();
  const orderedIds: string[] = [];
  const start = draft.elements.find((element) => element.type === "start");
  let currentId = start?.id ?? null;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    orderedIds.push(currentId);
    currentId = draft.connections.find(
      (connection) => connection.sourceId === currentId
    )?.targetId ?? null;
  }
  for (const element of draft.elements) {
    if (!visited.has(element.id)) {
      visited.add(element.id);
      orderedIds.push(element.id);
    }
  }
  return orderedIds;
};

export const deriveWorkflowFlowElements = (
  draft: WorkflowDraftDocument
): { nodes: WorkflowFlowNode[]; edges: WorkflowFlowEdge[] } => {
  const topologyIndex = new Map(
    workflowTopologyOrder(draft).map((elementId, index) => [elementId, index])
  );
  const occupiedPositions = Object.values(draft.layout.positions);
  const positionFor = (elementId: string): XYPosition => {
    const saved = draft.layout.positions[elementId];
    if (saved) return saved;
    let fallbackIndex = topologyIndex.get(elementId) ?? topologyIndex.size;
    let fallback = fallbackPosition(fallbackIndex);
    while (overlapsPosition(fallback, occupiedPositions)) {
      fallbackIndex += 1;
      fallback = fallbackPosition(fallbackIndex);
    }
    occupiedPositions.push(fallback);
    return fallback;
  };
  return {
    nodes: draft.elements.map((element) => ({
      id: element.id,
      type: element.type,
      position: positionFor(element.id),
      data: { element }
    })),
    edges: draft.connections.map((connection) => ({
      id: connection.id,
      type: "sequence",
      source: connection.sourceId,
      target: connection.targetId,
      data: { connection },
      interactionWidth: 44
    }))
  };
};

export const addWorkflowElementCommand = (
  draft: WorkflowDraftDocument,
  elementType: WorkflowElementType,
  labels: WorkflowElementLabels
): WorkflowAddResult => {
  if (
    elementType !== "task"
    && draft.elements.some((element) => element.type === elementType)
  ) {
    return { accepted: false, draft, reason: "cardinality" };
  }
  const elementId = nextUniqueId(elementType, draft.elements.map((element) => element.id));
  const taskCount = draft.elements.filter((element) => element.type === "task").length;
  const element: WorkflowDraftElement = {
    id: elementId,
    type: elementType,
    label: elementType === "task" && taskCount > 0
      ? `${labels.task} ${taskCount + 1}`
      : labels[elementType]
  };
  return {
    accepted: true,
    draft: { ...draft, elements: [...draft.elements, element] },
    elementId
  };
};

export const adaptFlowConnection = (
  draft: WorkflowDraftDocument,
  connection: Connection
): WorkflowConnectResult => {
  const source = draft.elements.find((element) => element.id === connection.source);
  const target = draft.elements.find((element) => element.id === connection.target);
  if (!source || !target || source.id === target.id) {
    return { accepted: false, draft, reason: "missing-endpoint" };
  }
  if (
    source.type === "end"
    || target.type === "start"
    || (source.type === "start" && target.type !== "task")
    || (source.type === "task" && !["task", "end"].includes(target.type))
  ) {
    return { accepted: false, draft, reason: "invalid-direction" };
  }
  if (draft.connections.some(
    (candidate) => candidate.sourceId === source.id && candidate.targetId === target.id
  )) {
    return { accepted: false, draft, reason: "duplicate" };
  }
  if (draft.connections.some((candidate) => candidate.sourceId === source.id)) {
    return { accepted: false, draft, reason: "maximum-cardinality" };
  }
  if (draft.connections.some((candidate) => candidate.targetId === target.id)) {
    return { accepted: false, draft, reason: "maximum-cardinality" };
  }
  if (isReachable(draft, target.id, source.id)) {
    return { accepted: false, draft, reason: "cycle" };
  }

  const connectionId = nextUniqueId(
    "connection",
    draft.connections.map((candidate) => candidate.id)
  );
  return {
    accepted: true,
    draft: {
      ...draft,
      connections: [
        ...draft.connections,
        {
          id: connectionId,
          type: "sequence",
          sourceId: source.id,
          targetId: target.id,
          label: null
        }
      ]
    },
    connectionId
  };
};

const nextUniqueId = (prefix: string, existingIds: string[]) => {
  const occupied = new Set(existingIds);
  let ordinal = 1;
  while (occupied.has(`${prefix}-${ordinal}`)) {
    ordinal += 1;
  }
  return `${prefix}-${ordinal}`;
};

const isReachable = (
  draft: WorkflowDraftDocument,
  startId: string,
  targetId: string
) => {
  const visited = new Set<string>();
  const pending = [startId];
  while (pending.length > 0) {
    const currentId = pending.shift();
    if (!currentId || visited.has(currentId)) continue;
    if (currentId === targetId) return true;
    visited.add(currentId);
    for (const connection of draft.connections) {
      if (connection.sourceId === currentId && !visited.has(connection.targetId)) {
        pending.push(connection.targetId);
      }
    }
  }
  return false;
};
