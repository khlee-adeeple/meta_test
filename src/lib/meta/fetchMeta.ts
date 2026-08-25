import { getMetaAccessToken, getMetaGraphApiBaseUrl } from "./config";
import type { MetaApiError, MetaApiResult } from "@/types/meta";

type QueryParams = Record<string, string | number | undefined>;

interface MetaErrorResponseBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

function buildUrl(path: string, params: QueryParams): string {
  const base = getMetaGraphApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  // Access Token은 서버에서만 붙인다. 브라우저에는 절대 전달되지 않는 URL이다.
  url.searchParams.set("access_token", getMetaAccessToken());

  return url.toString();
}

function redactUrlForLogging(url: string): string {
  const redacted = new URL(url);
  if (redacted.searchParams.has("access_token")) {
    redacted.searchParams.set("access_token", "***");
  }
  return redacted.toString();
}

/**
 * Meta Graph API 호출 공통 함수.
 *
 * - fetch 자체의 실패(네트워크 오류 등)와 Meta가 반환한 JSON error 응답을
 *   구분해서 처리한다.
 * - 성공/실패 여부와 무관하게 access_token은 로그와 반환값 어디에도 남기지 않는다.
 */
export async function fetchMeta<T>(
  path: string,
  params: QueryParams = {}
): Promise<MetaApiResult<T>> {
  const url = buildUrl(path, params);
  const logPath = redactUrlForLogging(url);

  console.log(`[META API] GET ${logPath}`);

  let response: Response;
  try {
    response = await fetch(url, { method: "GET", cache: "no-store" });
  } catch (networkError) {
    console.error("[META API ERROR]");
    console.error("message:", (networkError as Error).message);
    return {
      success: false,
      error: {
        message: "Meta Graph API 요청 중 네트워크 오류가 발생했습니다.",
      },
    };
  }

  console.log(`[META API] status: ${response.status}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      success: false,
      error: {
        message: "Meta Graph API 응답을 JSON으로 파싱하지 못했습니다.",
      },
    };
  }

  if (!response.ok) {
    const errorBody = (body as MetaErrorResponseBody).error;
    const error: MetaApiError = {
      message: errorBody?.message ?? "알 수 없는 Meta API 오류입니다.",
      type: errorBody?.type,
      code: errorBody?.code,
      error_subcode: errorBody?.error_subcode,
      fbtrace_id: errorBody?.fbtrace_id,
    };

    console.error("[META API ERROR]");
    console.error("code:", error.code);
    console.error("subcode:", error.error_subcode);
    console.error("message:", error.message);
    console.error("fbtrace_id:", error.fbtrace_id);

    return { success: false, error };
  }

  if (Array.isArray((body as { data?: unknown }).data)) {
    const rows = ((body as { data: unknown[] }).data).length;
    console.log(`[META API] rows: ${rows}`);
  }

  return { success: true, data: body as T };
}
