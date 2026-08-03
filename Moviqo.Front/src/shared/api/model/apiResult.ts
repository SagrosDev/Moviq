export type ApiResult<TData> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      status: number;
      title: string;
      detail?: string;
    };
