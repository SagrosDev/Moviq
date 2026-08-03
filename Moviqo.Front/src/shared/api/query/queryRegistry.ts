export type QueryKey = readonly [scope: "api", resource: string, identifier?: string];

export type QueryInvalidation = {
  key: QueryKey;
  reason: string;
};

export const createQueryKey = (resource: string, identifier?: string): QueryKey => {
  return identifier ? ["api", resource, identifier] : ["api", resource];
};

export const createQueryRegistry = () => {
  const invalidations: QueryInvalidation[] = [];

  return {
    invalidate(key: QueryKey, reason: string) {
      invalidations.push({ key, reason });
    },
    getInvalidations() {
      return [...invalidations];
    }
  };
};
