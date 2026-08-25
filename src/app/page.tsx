"use client";

import { useState } from "react";
import { MetaAccountCard } from "@/components/meta/MetaAccountCard";
import type { MetaAdAccount, MetaApiError } from "@/types/meta";

type LoadStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [account, setAccount] = useState<MetaAdAccount | null>(null);
  const [error, setError] = useState<MetaApiError | null>(null);
  const [rawJson, setRawJson] = useState<unknown>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  async function handleFetchAccount() {
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/meta/account");
      const body = await res.json();
      setRawJson(body);

      if (body.success) {
        setAccount(body.data as MetaAdAccount);
        setStatus("success");
      } else {
        setAccount(null);
        setError(body.error as MetaApiError);
        setStatus("error");
      }
    } catch {
      setAccount(null);
      setRawJson(null);
      setError({ message: "네트워크 오류로 요청에 실패했습니다." });
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">
            Meta Marketing API Test
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            로컬 개발환경에서 Meta 광고계정 데이터를 조회하는 테스트
            화면입니다.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFetchAccount}
              disabled={status === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              광고계정 조회
            </button>
          </div>

          {status === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}

          {status === "error" && error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">Meta API 호출에 실패했습니다.</p>
              <p className="mt-1">Message: {error.message}</p>
              {error.code !== undefined && <p>Meta Error Code: {error.code}</p>}
              {error.error_subcode !== undefined && (
                <p>Meta Error Subcode: {error.error_subcode}</p>
              )}
            </div>
          )}

          {status === "success" && account && (
            <MetaAccountCard account={account} />
          )}

          {rawJson !== null && (
            <div>
              <button
                type="button"
                onClick={() => setShowRawJson((v) => !v)}
                className="text-sm text-blue-600 underline"
              >
                원본 JSON 보기
              </button>
              {showRawJson && (
                <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
                  {JSON.stringify(rawJson, null, 2)}
                </pre>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
