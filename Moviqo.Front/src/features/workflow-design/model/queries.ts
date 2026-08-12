import { useQuery } from "@tanstack/react-query";
import {
  createApiClient,
  moviqoQueryKeys,
  readApiProblem,
  type NormalizedApiProblem
} from "../../../shared/api";
import type { components } from "../../../shared/api/generated/schema";
import type {
  WorkflowAssignmentMode,
  WorkflowConnectionType,
  WorkflowCreationAccepted,
  WorkflowDraftDocument,
  WorkflowElementType,
  WorkflowProcessFieldKind,
  WorkflowStarterMode
} from "./types";

export type WorkflowCatalogItem = components["schemas"]["WorkflowCatalogItem"];
type WorkflowCatalogResponse = components["schemas"]["WorkflowCatalogResponse"];
type GeneratedWorkflowAccepted = components["schemas"]["WorkflowCreateResponse"];

type WorkflowQueryResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: NormalizedApiProblem };

const workflowQueryClient = (fetchImplementation?: (input: Request) => Promise<Response>) =>
  createApiClient({
    baseUrl: fetchImplementation ? "https://moviqo.test/api/v1" : "/api/v1",
    ...(fetchImplementation ? { fetch: fetchImplementation } : {})
  });

const contractValue = <TValue extends string>(
  value: string | undefined,
  supported: readonly TValue[]
): TValue => {
  if (value && supported.some((candidate) => candidate === value)) {
    return value as TValue;
  }
  throw new Error("workflow_contract_invalid");
};

const requiredContractString = (value: string | undefined) => {
  if (!value) throw new Error("workflow_contract_invalid");
  return value;
};

const normalizeGeneratedDraft = (
  draft: components["schemas"]["WorkflowDraftDocument"]
): WorkflowDraftDocument => ({
  schemaVersion: draft.schemaVersion,
  draftId: draft.draftId,
  workflowId: draft.workflowId,
  name: draft.name,
  status: draft.status,
  elements: (draft.elements ?? []).map((element) => ({
    id: element.id,
    type: contractValue<WorkflowElementType>(element.type, ["start", "task", "end"]),
    label: element.label,
    ...(element.type === "task" ? {
      assignment: {
        mode: contractValue<WorkflowAssignmentMode>(
          element.assignment?.mode ?? "unconfigured",
          ["unconfigured", "workflowInitiator", "specificMember"]
        ),
        membershipId: element.assignment?.membershipId ?? null
      }
    } : {})
  })),
  connections: (draft.connections ?? []).map((connection) => ({
    id: connection.id,
    type: contractValue<WorkflowConnectionType>(connection.type, ["sequence"]),
    sourceId: connection.sourceId,
    targetId: connection.targetId,
    label: connection.label?.trim() || null
  })),
  processFields: (draft.processFields ?? []).map((field) => ({
    id: requiredContractString(field.id),
    kind: contractValue<WorkflowProcessFieldKind>(field.kind, ["shortText"]),
    label: field.label,
    helpText: field.helpText ?? "",
    placeholder: field.placeholder ?? "",
    defaultValue: field.defaultValue ?? null,
    minimumLength: field.minimumLength ?? 0,
    maximumLength: field.maximumLength ?? 255
  })),
  formBindings: (draft.formBindings ?? []).map((binding) => ({
    id: requiredContractString(binding.id),
    taskElementId: binding.taskElementId,
    fieldId: binding.fieldId,
    position: binding.position ?? 0,
    width: contractValue(binding.width, ["full"]),
    label: binding.label ?? null
  })),
  layout: {
    positions: Object.fromEntries(
      Object.entries(draft.layout?.positions ?? {}).map(([elementId, position]) => [
        elementId,
        { x: position.x, y: position.y }
      ])
    )
  },
  ...(draft.publication ? {
    publication: {
      starter: {
        mode: contractValue<WorkflowStarterMode>(
          draft.publication.starter?.mode ?? "unconfigured",
          [
          "unconfigured",
          "allActiveMembers",
          "selectedTeams",
          "selectedMembers"
          ]
        ),
        teamIds: draft.publication.starter?.teamIds ?? [],
        membershipIds: draft.publication.starter?.membershipIds ?? []
      }
    }
  } : {})
});

const normalizeGeneratedAccepted = (
  accepted: GeneratedWorkflowAccepted
): WorkflowCreationAccepted => ({
  workflowId: accepted.workflowId,
  organizationId: accepted.organizationId,
  createdByMembershipId: accepted.createdByMembershipId,
  configurationDirectory: accepted.configurationDirectory,
  name: accepted.name,
  revision: accepted.revision,
  draft: normalizeGeneratedDraft(accepted.draft)
});

export const readWorkflowCatalog = async (
  fetchImplementation?: (input: Request) => Promise<Response>
): Promise<WorkflowQueryResult<WorkflowCatalogResponse>> => {
  const response = await workflowQueryClient(fetchImplementation).GET(
    "/api/v1/workflow-design/workflows/",
    {}
  );

  if (!response.response.ok || !response.data) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return { ok: true, data: response.data };
};

export const readWorkflowDraftSnapshot = async (
  workflowId: string,
  fetchImplementation?: (input: Request) => Promise<Response>
): Promise<WorkflowQueryResult<WorkflowCreationAccepted>> => {
  const response = await workflowQueryClient(fetchImplementation).GET(
    "/api/v1/workflow-design/workflows/{workflow_id}/draft/",
    { params: { path: { workflow_id: workflowId } } }
  );

  if (!response.response.ok || !response.data) {
    return { ok: false, error: await readApiProblem(response.response) };
  }

  return { ok: true, data: normalizeGeneratedAccepted(response.data) };
};

export const useWorkflowCatalogQuery = (organizationId: string) => useQuery({
  queryKey: moviqoQueryKeys.workflowCatalog(organizationId),
  queryFn: async () => {
    const result = await readWorkflowCatalog();
    if (!result.ok) {
      throw result.error;
    }
    return result.data;
  }
});

export const useWorkflowDraftQuery = (
  organizationId: string,
  workflowId: string,
  enabled = true
) => useQuery({
  enabled: enabled && Boolean(workflowId),
  queryKey: moviqoQueryKeys.workflowDraft(organizationId, workflowId),
  queryFn: async () => {
    const result = await readWorkflowDraftSnapshot(workflowId);
    if (!result.ok) {
      throw result.error;
    }
    return result.data;
  }
});
