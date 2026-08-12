import createClient from "openapi-fetch";
import type { components, paths } from "./generated/schema";
import {
  csrfHeaders,
  ensureCsrfToken,
  rememberCsrfToken,
  requiresCsrfProtection
} from "./csrf";

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

export const isSessionExpiryProblem = (status: number, code: string) =>
  status === 401
  || (status === 403 && (code === "authentication_failed" || code === "not_authenticated"));

const responseProblemCode = async (response: Response) => {
  if (response.status !== 403) {
    return "";
  }

  try {
    return (await readApiProblem(response.clone())).code;
  } catch {
    return "";
  }
};

export const createApiClient = (options: ApiClientOptions) => {
  const normalizedBaseUrl = normalizeApiBaseUrl(options.baseUrl);
  const csrfBootstrapEndpoint = `${normalizedBaseUrl}${API_PATH_PREFIX}/auth/csrf/`;

  const fetchImplementation: typeof fetch = (input, init) => {
    if (options.fetch) {
      return options.fetch(
        input instanceof Request && !init ? input : new Request(input, init)
      );
    }
    return fetch(input, init);
  };

  return createClient<paths>({
    baseUrl: normalizedBaseUrl,
    fetch: async (input) => {
      if (requiresCsrfProtection(input.method)) {
        await ensureCsrfToken(fetchImplementation, csrfBootstrapEndpoint);
      }

      const headers = new Headers(input.headers);
      for (const [name, value] of Object.entries(csrfHeaders())) {
        headers.set(name, value);
      }
      const requestWithHeaders = new Request(input, {
        credentials: "same-origin",
        headers
      });
      const retrySource = requestWithHeaders.clone();
      let response = await fetchImplementation(requestWithHeaders);
      if (response.status === 403 && requiresCsrfProtection(input.method)) {
        rememberCsrfToken("");
        await ensureCsrfToken(fetchImplementation, csrfBootstrapEndpoint);
        const retryHeaders = new Headers(retrySource.headers);
        for (const [name, value] of Object.entries(csrfHeaders())) {
          retryHeaders.set(name, value);
        }
        response = await fetchImplementation(
          new Request(retrySource, { credentials: "same-origin", headers: retryHeaders })
        );
      }
      const problemCode = await responseProblemCode(response);
      if (
        typeof window !== "undefined"
        && isSessionExpiryProblem(response.status, problemCode)
      ) {
        window.dispatchEvent(new CustomEvent("moviqo:session-expired"));
      }
      return response;
    }
  });
};

const normalizeApiBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith(API_PATH_PREFIX)
    ? trimmed.slice(0, -API_PATH_PREFIX.length)
    : trimmed;
};
