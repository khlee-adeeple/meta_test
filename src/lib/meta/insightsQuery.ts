/**
 * /api/meta/insights 와 /api/meta/insights/all이 공유하는 fields/breakdown/
 * date preset 설정과 whitelist 검증 로직. 두 Route가 정확히 같은 쿼리
 * 규칙(어떤 필드를 쓰는지, 어떤 breakdown/preset을 허용하는지)을 써야
 * "계정별 조회"와 "전체 계정 통합 조회"의 결과 JSON 형태가 항상 동일하게
 * 유지된다.
 */

export const INSIGHT_FIELDS = [
  "account_id",
  "account_name",
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "date_start",
  "date_stop",
  "spend",
  "impressions",
  "reach",
  "clicks",
  "inline_link_clicks",
  "ctr",
  "cpc",
  "cpm",
  "frequency",
  "actions",
  "action_values",
  "cost_per_action_type",
  "purchase_roas",
].join(",");

// breakdown 조회는 문서 14번 섹션 기준으로 최소 필드만 사용한다.
// (모든 breakdown이 모든 지표 조합을 지원하는 건 아니므로, 기본 지표 조회와
// breakdown 조회는 완전히 별도의 요청/필드셋으로 분리한다.)
// account_id/account_name은 전체 계정 통합 조회에서 각 행이 어느 계정
// 소속인지 구분해야 하므로 breakdown 필드셋에도 포함한다.
export const BREAKDOWN_INSIGHT_FIELDS = [
  "account_id",
  "account_name",
  "campaign_id",
  "adset_id",
  "ad_id",
  "date_start",
  "date_stop",
  "spend",
  "impressions",
  "clicks",
  "actions",
].join(",");

export const BREAKDOWN_MAP = {
  age_gender: "age,gender",
  publisher_platform: "publisher_platform",
  placement: "publisher_platform,platform_position",
} as const;

export type BreakdownOption = "none" | keyof typeof BREAKDOWN_MAP;
const ALLOWED_BREAKDOWNS: readonly BreakdownOption[] = [
  "none",
  "age_gender",
  "publisher_platform",
  "placement",
];
const DEFAULT_BREAKDOWN: BreakdownOption = "none";

function isAllowedBreakdown(value: string): value is BreakdownOption {
  return (ALLOWED_BREAKDOWNS as readonly string[]).includes(value);
}

// 클라이언트가 보낸 임의 문자열을 그대로 Meta API에 전달하지 않고 whitelist로만 통과시킨다.
export function resolveBreakdown(rawValue: string | null): BreakdownOption {
  if (rawValue && isAllowedBreakdown(rawValue)) {
    return rawValue;
  }
  return DEFAULT_BREAKDOWN;
}

export function insightFieldsFor(breakdown: BreakdownOption): string {
  return breakdown === "none" ? INSIGHT_FIELDS : BREAKDOWN_INSIGHT_FIELDS;
}

export function metaBreakdownsFor(breakdown: BreakdownOption): string | undefined {
  return breakdown === "none" ? undefined : BREAKDOWN_MAP[breakdown];
}

const ALLOWED_DATE_PRESETS = [
  "today",
  "yesterday",
  "last_7d",
  "last_14d",
  "last_30d",
  "this_month",
  "last_month",
] as const;

export type DatePreset = (typeof ALLOWED_DATE_PRESETS)[number];
const DEFAULT_DATE_PRESET: DatePreset = "last_7d";

function isAllowedDatePreset(value: string): value is DatePreset {
  return (ALLOWED_DATE_PRESETS as readonly string[]).includes(value);
}

// 클라이언트가 보낸 임의 문자열을 그대로 Meta API에 전달하지 않고 whitelist로만 통과시킨다.
export function resolveDatePreset(rawValue: string | null): DatePreset {
  if (rawValue && isAllowedDatePreset(rawValue)) {
    return rawValue;
  }
  return DEFAULT_DATE_PRESET;
}
