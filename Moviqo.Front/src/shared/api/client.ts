import createClient from "openapi-fetch";
import type { components, paths } from "./generated/schema";

const API_PATH_PREFIX = "/api/v1";

export type ApiProblemDetails = components["schemas"]["ProblemDetails"];

export type ApiClientOptions = {
  /**
   * Origin or deployment base path. The generated schema already contains
   * `/api/v1`, so callers may pass either the origin or `/api/v1`.
   */
  baseUrl: string;
  fetch?: (input: Request) => Promise<Response>;
};

export const createApiClient = (options: ApiClientOptions) => {
  return createClient<paths>({
    baseUrl: normalizeApiBaseUrl(options.baseUrl),
    fetch: options.fetch
  });
};

const normalizeApiBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith(API_PATH_PREFIX)
    ? trimmed.slice(0, -API_PATH_PREFIX.length)
    : trimmed;
};
