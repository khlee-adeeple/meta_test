"use client";

import { useState } from "react";
import type { MetaApiError, MetaPaging } from "@/types/meta";

type LoadStatus = "idle" | "loading" | "success" | "error";

interface MetaListLike<T> {
  data: T[];
  paging?: MetaPaging;
}

/**
 * campaigns/adsets/ads/insights처럼 { data: T[], paging } 형태로 응답하는
 * Meta 목록류 API를 커서 기반으로 페이지네이션하며 조회하기 위한 공용 훅.
 *
 * 다음 페이지는 Meta가 준 paging.cursors.after 값을 우리 서버(`after` query
 * param)에 그대로 다시 넘기는 방식으로 동작한다. access_token은 서버에서만
 * 붙으므로 이 훅은 토큰을 알지 못한다.
 */
export function useMetaList<T>() {
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [rows, setRows] = useState<T[]>([]);
  const [error, setError] = useState<MetaApiError | null>(null);
  const [rawJson, setRawJson] = useState<unknown>(null);
  const [afterCursor, setAfterCursor] = useState<string | undefined>(
    undefined
  );
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);

  async function fetchPage(
    baseUrl: string,
    cursor: string | undefined,
    pageNumber: number
  ) {
    setStatus("loading");
    setError(null);

    const url = cursor
      ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}after=${encodeURIComponent(
          cursor
        )}`
      : baseUrl;

    try {
      const res = await fetch(url);
      const body = await res.json();
      setRawJson(body);

      if (body.success) {
        const payload = body.data as MetaListLike<T>;
        const nextCursor = payload.paging?.cursors?.after;
        setRows(payload.data ?? []);
        setAfterCursor(nextCursor);
        setHasNextPage(Boolean(nextCursor));
        setPage(pageNumber);
        setStatus("success");
      } else {
        setRows([]);
        setHasNextPage(false);
        setError(body.error as MetaApiError);
        setStatus("error");
      }
    } catch {
      setRows([]);
      setRawJson(null);
      setHasNextPage(false);
      setError({ message: "네트워크 오류로 요청에 실패했습니다." });
      setStatus("error");
    }
  }

  return {
    status,
    rows,
    error,
    rawJson,
    hasNextPage,
    page,
    fetchFirstPage: (baseUrl: string) => fetchPage(baseUrl, undefined, 1),
    fetchNextPage: (baseUrl: string) => fetchPage(baseUrl, afterCursor, page + 1),
    reset: () => {
      setStatus("idle");
      setRows([]);
      setError(null);
      setRawJson(null);
      setAfterCursor(undefined);
      setHasNextPage(false);
      setPage(1);
    },
  };
}
