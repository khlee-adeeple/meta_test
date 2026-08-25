"use client";

import { useState } from "react";
import { MetaAccountCard } from "@/components/meta/MetaAccountCard";
import { CampaignTable } from "@/components/meta/CampaignTable";
import { AdsetTable } from "@/components/meta/AdsetTable";
import { AdTable } from "@/components/meta/AdTable";
import { InsightTable } from "@/components/meta/InsightTable";
import type {
  MetaAd,
  MetaAdAccount,
  MetaAdset,
  MetaApiError,
  MetaCampaign,
  MetaInsightsResponse,
  MetaListResponse,
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

  // 캠페인 조회 상태
  const [campaignStatus, setCampaignStatus] = useState<LoadStatus>("idle");
  const [campaignRows, setCampaignRows] = useState<MetaCampaign[]>([]);
  const [campaignError, setCampaignError] = useState<MetaApiError | null>(
    null
  );
  const [campaignRawJson, setCampaignRawJson] = useState<unknown>(null);

  // 광고세트 조회 상태
  const [adsetStatus, setAdsetStatus] = useState<LoadStatus>("idle");
  const [adsetRows, setAdsetRows] = useState<MetaAdset[]>([]);
  const [adsetError, setAdsetError] = useState<MetaApiError | null>(null);
  const [adsetRawJson, setAdsetRawJson] = useState<unknown>(null);

  // 광고 조회 상태
  const [adStatus, setAdStatus] = useState<LoadStatus>("idle");
  const [adRows, setAdRows] = useState<MetaAd[]>([]);
  const [adError, setAdError] = useState<MetaApiError | null>(null);
  const [adRawJson, setAdRawJson] = useState<unknown>(null);

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

  async function handleFetchCampaigns() {
    setCampaignStatus("loading");
    setCampaignError(null);

    try {
      const res = await fetch("/api/meta/campaigns");
      const body = await res.json();
      setCampaignRawJson(body);

      if (body.success) {
        const data = (body.data as MetaListResponse<MetaCampaign>).data ?? [];
        setCampaignRows(data);
        setCampaignStatus("success");
      } else {
        setCampaignRows([]);
        setCampaignError(body.error as MetaApiError);
        setCampaignStatus("error");
      }
    } catch {
      setCampaignRows([]);
      setCampaignRawJson(null);
      setCampaignError({ message: "네트워크 오류로 요청에 실패했습니다." });
      setCampaignStatus("error");
    }
  }

  async function handleFetchAdsets() {
    setAdsetStatus("loading");
    setAdsetError(null);

    try {
      const res = await fetch("/api/meta/adsets");
      const body = await res.json();
      setAdsetRawJson(body);

      if (body.success) {
        const data = (body.data as MetaListResponse<MetaAdset>).data ?? [];
        setAdsetRows(data);
        setAdsetStatus("success");
      } else {
        setAdsetRows([]);
        setAdsetError(body.error as MetaApiError);
        setAdsetStatus("error");
      }
    } catch {
      setAdsetRows([]);
      setAdsetRawJson(null);
      setAdsetError({ message: "네트워크 오류로 요청에 실패했습니다." });
      setAdsetStatus("error");
    }
  }

  async function handleFetchAds() {
    setAdStatus("loading");
    setAdError(null);

    try {
      const res = await fetch("/api/meta/ads");
      const body = await res.json();
      setAdRawJson(body);

      if (body.success) {
        const data = (body.data as MetaListResponse<MetaAd>).data ?? [];
        setAdRows(data);
        setAdStatus("success");
      } else {
        setAdRows([]);
        setAdError(body.error as MetaApiError);
        setAdStatus("error");
      }
    } catch {
      setAdRows([]);
      setAdRawJson(null);
      setAdError({ message: "네트워크 오류로 요청에 실패했습니다." });
      setAdStatus("error");
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
          <h2 className="text-lg font-semibold text-gray-900">캠페인 목록</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFetchCampaigns}
              disabled={campaignStatus === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              캠페인 조회
            </button>
          </div>

          {campaignStatus === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}
          {campaignStatus === "error" && campaignError && (
            <ErrorBox error={campaignError} />
          )}
          {campaignStatus === "success" && (
            <CampaignTable rows={campaignRows} />
          )}
          <RawJsonToggle data={campaignRawJson} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">광고세트 목록</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFetchAdsets}
              disabled={adsetStatus === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              광고세트 조회
            </button>
          </div>

          {adsetStatus === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}
          {adsetStatus === "error" && adsetError && (
            <ErrorBox error={adsetError} />
          )}
          {adsetStatus === "success" && <AdsetTable rows={adsetRows} />}
          <RawJsonToggle data={adsetRawJson} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">광고 목록</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFetchAds}
              disabled={adStatus === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              광고 조회
            </button>
          </div>

          {adStatus === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}
          {adStatus === "error" && adError && <ErrorBox error={adError} />}
          {adStatus === "success" && <AdTable rows={adRows} />}
          <RawJsonToggle data={adRawJson} />
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
