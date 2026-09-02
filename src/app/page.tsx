"use client";

import { useState } from "react";
import { MetaAccountCard } from "@/components/meta/MetaAccountCard";
import { CampaignTable } from "@/components/meta/CampaignTable";
import { AdsetTable } from "@/components/meta/AdsetTable";
import { AdTable } from "@/components/meta/AdTable";
import { InsightTable } from "@/components/meta/InsightTable";
import { useMetaList } from "@/hooks/useMetaList";
import type {
  MetaAd,
  MetaAdAccount,
  MetaAdset,
  MetaApiError,
  MetaCampaign,
  MetaInsight,
} from "@/types/meta";

type LoadStatus = "idle" | "loading" | "success" | "error";

const DATE_PRESETS = [
  { value: "today", label: "오늘" },
  { value: "yesterday", label: "어제" },
  { value: "last_7d", label: "최근 7일" },
  { value: "last_30d", label: "최근 30일" },
] as const;

const BREAKDOWN_OPTIONS = [
  { value: "none", label: "없음 (기본 지표)" },
  { value: "age_gender", label: "연령 + 성별" },
  { value: "publisher_platform", label: "게재 위치(Platform)" },
  { value: "placement", label: "노출 위치(Placement)" },
] as const;

// META_AD_ACCOUNT_IDS에 설정된 계정들과 짝이 맞아야 한다 (서버가 whitelist로
// 검증하므로, 여기서 다른 값을 골라도 서버가 첫 번째 계정으로 대체한다).
// label은 이전에 /me/adaccounts로 확인한 Meta 원본 계정명을 그대로 옮긴 것이다.
const ACCOUNT_OPTIONS = [
  { id: "act_1993422144326874", label: "ADEEPLE 광고 계정" },
  { id: "act_1422863985334992", label: "ADEEPLE 인하우스 A (오디션 키즈)" },
  { id: "act_989368012810277", label: "ADEEPLE 인하우스 B (부동산 전용)" },
  { id: "act_739469150969222", label: "ADEEPLE 인하우스 D (오디션 키즈)" },
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

function PaginationControls({
  page,
  hasNextPage,
  onNextPage,
}: {
  page: number;
  hasNextPage: boolean;
  onNextPage: () => void;
}) {
  // 이 컴포넌트는 항상 status === "success"일 때만 렌더링되므로
  // (다음 페이지 로딩 중엔 status가 "loading"으로 바뀌며 함께 사라진다)
  // 별도의 loading 플래그를 받지 않는다.
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">페이지 {page}</span>
      <button
        type="button"
        onClick={onNextPage}
        disabled={!hasNextPage}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        다음 페이지
      </button>
      {!hasNextPage && page > 1 && (
        <span className="text-xs text-gray-400">마지막 페이지입니다</span>
      )}
    </div>
  );
}

export default function Home() {
  const [selectedAccountId, setSelectedAccountId] = useState<
    (typeof ACCOUNT_OPTIONS)[number]["id"]
  >(ACCOUNT_OPTIONS[0].id);

  // 광고계정 조회 상태 (단일 객체라 useMetaList 대상 아님)
  const [accountStatus, setAccountStatus] = useState<LoadStatus>("idle");
  const [account, setAccount] = useState<MetaAdAccount | null>(null);
  const [accountError, setAccountError] = useState<MetaApiError | null>(null);
  const [accountRawJson, setAccountRawJson] = useState<unknown>(null);

  const campaigns = useMetaList<MetaCampaign>();
  const adsets = useMetaList<MetaAdset>();
  const ads = useMetaList<MetaAd>();
  const insights = useMetaList<MetaInsight>();

  const [datePreset, setDatePreset] =
    useState<(typeof DATE_PRESETS)[number]["value"]>("last_7d");
  const [breakdown, setBreakdown] =
    useState<(typeof BREAKDOWN_OPTIONS)[number]["value"]>("none");

  // 계정을 바꾸면 이전 계정 데이터가 섞여 보이지 않도록 모든 섹션을 초기화한다.
  function handleSelectAccount(accountId: (typeof ACCOUNT_OPTIONS)[number]["id"]) {
    setSelectedAccountId(accountId);
    setAccountStatus("idle");
    setAccount(null);
    setAccountError(null);
    setAccountRawJson(null);
    campaigns.reset();
    adsets.reset();
    ads.reset();
    insights.reset();
  }

  async function handleFetchAccount() {
    setAccountStatus("loading");
    setAccountError(null);

    try {
      const res = await fetch(
        `/api/meta/account?accountId=${encodeURIComponent(selectedAccountId)}`
      );
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

  function campaignsUrl() {
    return `/api/meta/campaigns?accountId=${encodeURIComponent(selectedAccountId)}`;
  }

  function adsetsUrl() {
    return `/api/meta/adsets?accountId=${encodeURIComponent(selectedAccountId)}`;
  }

  function adsUrl() {
    return `/api/meta/ads?accountId=${encodeURIComponent(selectedAccountId)}`;
  }

  function insightsUrl() {
    return `/api/meta/insights?accountId=${encodeURIComponent(
      selectedAccountId
    )}&datePreset=${encodeURIComponent(
      datePreset
    )}&breakdown=${encodeURIComponent(breakdown)}`;
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
          <h2 className="text-lg font-semibold text-gray-900">광고계정 선택</h2>
          <div className="flex flex-wrap gap-1">
            {ACCOUNT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectAccount(option.id)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  selectedAccountId === option.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            선택한 계정: {selectedAccountId}
          </p>
        </section>

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
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => campaigns.fetchFirstPage(campaignsUrl())}
              disabled={campaigns.status === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              캠페인 조회
            </button>
            {campaigns.status === "success" && (
              <PaginationControls
                page={campaigns.page}
                hasNextPage={campaigns.hasNextPage}
                onNextPage={() =>
                  campaigns.fetchNextPage(campaignsUrl())
                }
              />
            )}
          </div>

          {campaigns.status === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}
          {campaigns.status === "error" && campaigns.error && (
            <ErrorBox error={campaigns.error} />
          )}
          {campaigns.status === "success" && (
            <CampaignTable rows={campaigns.rows} />
          )}
          <RawJsonToggle data={campaigns.rawJson} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">광고세트 목록</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => adsets.fetchFirstPage(adsetsUrl())}
              disabled={adsets.status === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              광고세트 조회
            </button>
            {adsets.status === "success" && (
              <PaginationControls
                page={adsets.page}
                hasNextPage={adsets.hasNextPage}
                onNextPage={() => adsets.fetchNextPage(adsetsUrl())}
              />
            )}
          </div>

          {adsets.status === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}
          {adsets.status === "error" && adsets.error && (
            <ErrorBox error={adsets.error} />
          )}
          {adsets.status === "success" && <AdsetTable rows={adsets.rows} />}
          <RawJsonToggle data={adsets.rawJson} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">광고 목록</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => ads.fetchFirstPage(adsUrl())}
              disabled={ads.status === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              광고 조회
            </button>
            {ads.status === "success" && (
              <PaginationControls
                page={ads.page}
                hasNextPage={ads.hasNextPage}
                onNextPage={() => ads.fetchNextPage(adsUrl())}
              />
            )}
          </div>

          {ads.status === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}
          {ads.status === "error" && ads.error && (
            <ErrorBox error={ads.error} />
          )}
          {ads.status === "success" && <AdTable rows={ads.rows} />}
          <RawJsonToggle data={ads.rawJson} />
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
                  onClick={() => {
                    setDatePreset(preset.value);
                    insights.reset();
                  }}
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
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">Breakdown:</span>
            <div className="flex gap-1">
              {BREAKDOWN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setBreakdown(option.value);
                    insights.reset();
                  }}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    breakdown === option.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => insights.fetchFirstPage(insightsUrl())}
              disabled={insights.status === "loading"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Insights 조회
            </button>
            {insights.status === "success" && (
              <PaginationControls
                page={insights.page}
                hasNextPage={insights.hasNextPage}
                onNextPage={() => insights.fetchNextPage(insightsUrl())}
              />
            )}
          </div>

          {insights.status === "loading" && (
            <p className="text-sm text-gray-500">
              Meta 데이터를 불러오는 중입니다...
            </p>
          )}
          {insights.status === "error" && insights.error && (
            <ErrorBox error={insights.error} />
          )}
          {insights.status === "success" && (
            <InsightTable rows={insights.rows} />
          )}
          <RawJsonToggle data={insights.rawJson} />
        </section>
      </div>
    </div>
  );
}
