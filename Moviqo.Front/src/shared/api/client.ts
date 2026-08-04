import createClient from "openapi-fetch";
import type { components, paths } from "./generated/schema";

const API_PATH_PREFIX = "/api/v1";
const SAFE_CODE = /^[a-z][a-z0-9_]{0,63}$/;
const SAFE_CORRELATION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

const boundedString = (value: unknown, maxLength: number): string | undefined => {
  if (typeof value !== "string" || value.length > maxLength || /[\r\n]/.test(value)) {
    return undefined;
  }
  return value;
};

const safeCorrelationId = (value: unknown): string => {
  const candidate = boundedString(value, 128);
  return candidate && SAFE_CORRELATION_ID.test(candidate) ? candidate : "";
};

export type ApiProblemDetails = components["schemas"]["ProblemDetails"];

export type NormalizedApiProblem = ApiProblemDetails & {
  invalidParams: NonNullable<ApiProblemDetails["invalidParams"]>;
};

const GENERIC_PROBLEM: Omit<NormalizedApiProblem, "status" | "correlationId"> = {
  type: "https://api.moviqo.local/problems/api-error",
  title: "Request failed",
  code: "api_error",
  invalidParams: []
};

export const normalizeApiProblem = (
  value: unknown,
  status = 500,
  correlationId = ""
): NormalizedApiProblem => {
  const candidate = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const invalidParams = Array.isArray(candidate.invalidParams)
    ? candidate.invalidParams.flatMap((param) => {
        if (typeof param !== "object" || param === null) return [];
        const item = param as Record<string, unknown>;
        const name = typeof item.name === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(item.name)
          ? item.name
          : "nonFieldErrors";
        const reason = typeof item.reason === "string" && item.reason.trim() && item.reason.length <= 240
          && !/[\r\n]/.test(item.reason)
          ? item.reason.trim()
          : "Invalid value.";
        const code = boundedString(item.code, 64);
        return [{ name, reason, ...(code && SAFE_CODE.test(code) ? { code } : {}) }];
      })
    : [];

  const type = boundedString(candidate.type, 200);
  const title = boundedString(candidate.title, 120);
  const code = boundedString(candidate.code, 64);
  const detail = boundedString(candidate.detail, 240);
  const bodyCorrelationId = safeCorrelationId(candidate.correlationId);

  return {
    type: type && type.startsWith("https://api.moviqo.local/problems/") ? type : GENERIC_PROBLEM.type,
    title: title || GENERIC_PROBLEM.title,
    status,
    code: code && SAFE_CODE.test(code) ? code : GENERIC_PROBLEM.code,
    correlationId: bodyCorrelationId || safeCorrelationId(correlationId),
    ...(detail ? { detail } : {}),
    invalidParams
  };
};

export const readApiProblem = async (response: Response): Promise<NormalizedApiProblem> => {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  return normalizeApiProblem(payload, response.status, response.headers.get("X-Correlation-ID") ?? "");
};

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
