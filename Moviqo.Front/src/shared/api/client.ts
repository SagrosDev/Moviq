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
    fetch: async (input) => {
      const headers = new Headers(input.headers);
      const csrfToken = readCookie("csrftoken");
      if (csrfToken && !["GET", "HEAD", "OPTIONS"].includes(input.method.toUpperCase())) {
        headers.set("X-CSRFToken", decodeURIComponent(csrfToken));
      }
      const response = await (options.fetch ?? fetch)(new Request(input, { credentials: "same-origin", headers }));
      if ((response.status === 401 || response.status === 403) && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("moviqo:session-expired"));
      }
      return response;
    }
  });
};

const readCookie = (name: string): string =>
  typeof document === "undefined"
    ? ""
    : document.cookie
        .split(";")
        .map((part) => part.trim().split("="))
        .find(([key]) => key === name)?.[1] ?? "";

const normalizeApiBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith(API_PATH_PREFIX)
    ? trimmed.slice(0, -API_PATH_PREFIX.length)
    : trimmed;
};
