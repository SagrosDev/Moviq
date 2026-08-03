import type { ApiProblemDetails } from "../client";

export type ApiResult<TData> =
  | {
      ok: true;
      data: TData;
    }
  | ({
      ok: false;
    } & ApiProblemDetails);
