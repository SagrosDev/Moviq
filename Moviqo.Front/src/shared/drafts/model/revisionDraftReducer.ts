export type DraftRevision = string & { readonly __brand: "DraftRevision" };

export type DraftState<TValue> = {
  value: TValue;
  revision: DraftRevision;
  conflict: boolean;
};

export type DraftUpdateAction<TValue> = {
  type: "server-accepted-update";
  value: TValue;
  expectedRevision: DraftRevision;
  nextRevision: DraftRevision;
};

export function createDraftState<TValue>(
  value: TValue,
  revision: DraftRevision
): DraftState<TValue> {
  return {
    value,
    revision,
    conflict: false
  };
}

export function draftReducer<TValue>(
  state: DraftState<TValue>,
  action: DraftUpdateAction<TValue>
): DraftState<TValue> {
  if (action.expectedRevision !== state.revision) {
    return {
      ...state,
      conflict: true
    };
  }

  return {
    value: action.value,
    revision: action.nextRevision,
    conflict: false
  };
}
