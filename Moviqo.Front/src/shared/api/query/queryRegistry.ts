export type QueryKey = readonly [scope: "api", resource: string, identifier?: string];

export type QueryInvalidation = {
  key: QueryKey;
  reason: string;
};

export function createQueryKey(resource: string, identifier?: string): QueryKey {
  return identifier ? ["api", resource, identifier] : ["api", resource];
}

export function createQueryRegistry() {
  const invalidations: QueryInvalidation[] = [];

  return {
    invalidate(key: QueryKey, reason: string) {
      invalidations.push({ key, reason });
    },
    getInvalidations() {
      return [...invalidations];
    }
  };
}
