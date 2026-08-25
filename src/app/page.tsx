"use client";

import { useState } from "react";
import { MetaAccountCard } from "@/components/meta/MetaAccountCard";
import { InsightTable } from "@/components/meta/InsightTable";
import type {
  MetaAdAccount,
  MetaApiError,
  MetaInsightsResponse,
} from "@/types/meta";

type LoadStatus = "idle" | "loading" | "success" | "error";

const DATE_PRESETS = [
  { value: "today", label: "오늘" },
  { value: "yesterday", label: "어제" },
  { value: "last_7d", label: "최근 7일" },
  { value: "last_30d", label: "최근 30일" },
] as const;

function ErrorBox({ error }: { error: MetaApiError }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <p className="font-medium">Meta API 호출에 실패했습니다.</p>
      <p className="mt-1">Message: {error.message}</p>
      {error.code !== undefined && <p>Meta Error Code: {error.code}</p>}
      {error.error_subcode !== undefined && (
        <p>Meta Error Subcode: {error.error_subcode}</p>
      )}
    </div>
  );
}

function RawJsonToggle({ data }: { data: unknown }) {
  const [show, setShow] = useState(false);

  if (data === null) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="text-sm text-blue-600 underline"
      >
        원본 JSON 보기
      </button>
      {show && (
        <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Home() {
  // 광고계정 조회 상태
  const [accountStatus, setAccountStatus] = useState<LoadStatus>("idle");
  const [account, setAccount] = useState<MetaAdAccount | null>(null);
  const [accountError, setAccountError] = useState<MetaApiError | null>(null);
  const [accountRawJson, setAccountRawJson] = useState<unknown>(null);

  // Insights 조회 상태
  const [insightsStatus, setInsightsStatus] = useState<LoadStatus>("idle");
  const [insightRows, setInsightRows] = useState<MetaInsightsResponse["data"]>(
    []
  );
  const [insightsError, setInsightsError] = useState<MetaApiError | null>(
    null
  );
  const [insightsRawJson, setInsightsRawJson] = useState<unknown>(null);
  const [datePreset, setDatePreset] =
    useState<(typeof DATE_PRESETS)[number]["value"]>("last_7d");

  async function handleFetchAccount() {
    setAccountStatus("loading");
    setAccountError(null);

    try {
      const res = await fetch("/api/meta/account");
      const body = await res.json();
      setAccountRawJson(body);

      if (body.success) {
        setAccount(body.data as MetaAdAccount);
        setAccountStatus("success");
      } else {
        setAccount(null);
        setAccountError(body.error as MetaApiError);
        setAccountStatus("error");
      }
    } catch {
      setAccount(null);
      setAccountRawJson(null);
      setAccountError({ message: "네트워크 오류로 요청에 실패했습니다." });
      setAccountStatus("error");
    }
  }

  async function handleFetchInsights() {
    setInsightsStatus("loading");
    setInsightsError(null);

    try {
      const res = await fetch(
        `/api/meta/insights?datePreset=${encodeURIComponent(datePreset)}`
      );
      const body = await res.json();
      setInsightsRawJson(body);

      if (body.success) {
        const data = (body.data as MetaInsightsResponse).data ?? [];
        setInsightRows(data);
        setInsightsStatus("success");
      } else {
        setInsightRows([]);
        setInsightsError(body.error as MetaApiError);
        setInsightsStatus("error");
      }
    } catch {
      setInsightRows([]);
      setInsightsRawJson(null);
      setInsightsError({ message: "네트워크 오류로 요청에 실패했습니다." });
      setInsightsStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">
            Meta Marketing API Test
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            로컬 개발환경에서 Meta 광고계정 데이터를 조회하는 테스트
            화면입니다. (조회 전용 — 광고 상태를 변경하는 기능은 없습니다)
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">광고계정 정보</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFetchAccount}
              disabled={accountStatus === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              광고계정 조회
            </button>
          </div>

          {accountStatus === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}

          {accountStatus === "error" && accountError && (
            <ErrorBox error={accountError} />
          )}

          {accountStatus === "success" && account && (
            <MetaAccountCard account={account} />
          )}

          <RawJsonToggle data={accountRawJson} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            광고 성과 (Insights)
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDatePreset(preset.value)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    datePreset === preset.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleFetchInsights}
              disabled={insightsStatus === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Insights 조회
            </button>
          </div>

          {insightsStatus === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}

          {insightsStatus === "error" && insightsError && (
            <ErrorBox error={insightsError} />
          )}

          {insightsStatus === "success" && (
            <InsightTable rows={insightRows} />
          )}

          <RawJsonToggle data={insightsRawJson} />
        </section>
      </div>
    </div>
  );
}
