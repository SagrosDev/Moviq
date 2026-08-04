export type QueryKey = readonly [scope: "api", resource: string, identifier?: string];

export type QueryInvalidation = {
  key: QueryKey;
  reason: string;
};

export type QuerySnapshot<TData = unknown, TError = unknown> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData; updatedAt: number }
  | { status: "error"; error: TError; updatedAt: number };

export const createQueryKey = (resource: string, identifier?: string): QueryKey => {
  return identifier ? ["api", resource, identifier] : ["api", resource];
};

export const createQueryRegistry = () => {
  const invalidations: QueryInvalidation[] = [];
  const snapshots = new Map<string, QuerySnapshot>();
  const subscribers = new Map<string, Set<() => void>>();

  const serializeKey = (key: QueryKey) => key.join("::");
  const publish = (key: QueryKey) => {
    const listeners = subscribers.get(serializeKey(key));
    listeners?.forEach((listener) => listener());
  };

  return {
    invalidate(key: QueryKey, reason: string) {
      invalidations.push({ key, reason });
      snapshots.delete(serializeKey(key));
      publish(key);
    },
    getInvalidations() {
      return [...invalidations];
    },
    getSnapshot<TData = unknown, TError = unknown>(key: QueryKey): QuerySnapshot<TData, TError> {
      return (snapshots.get(serializeKey(key)) as QuerySnapshot<TData, TError> | undefined) ?? { status: "idle" };
    },
    setSnapshot<TData = unknown, TError = unknown>(key: QueryKey, snapshot: QuerySnapshot<TData, TError>) {
      snapshots.set(serializeKey(key), snapshot);
      publish(key);
    },
    subscribe(key: QueryKey, listener: () => void) {
      const keyId = serializeKey(key);
      const listeners = subscribers.get(keyId) ?? new Set<() => void>();
      listeners.add(listener);
      subscribers.set(keyId, listeners);
      return () => {
        const currentListeners = subscribers.get(keyId);
        currentListeners?.delete(listener);
        if (currentListeners?.size === 0) subscribers.delete(keyId);
      };
    },
    clear(reason: string) {
      const keys = [...snapshots.keys()];
      keys.forEach((serializedKey) => {
        const [scope, resource, identifier] = serializedKey.split("::");
        const key = [scope as "api", resource, identifier] as QueryKey;
        invalidations.push({ key, reason });
        snapshots.delete(serializedKey);
        publish(key);
      });
    }
  };
};

export const queryRegistry = createQueryRegistry();

export const clearProtectedQueryState = (reason: string) => {
  queryRegistry.clear(reason);
};
