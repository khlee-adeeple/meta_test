import { NextRequest, NextResponse } from "next/server";
import { getMetaAdAccountId } from "@/lib/meta/config";
import { fetchMeta } from "@/lib/meta/fetchMeta";
import type { MetaInsightsResponse } from "@/types/meta";

// 이 Route는 조회(GET) 전용이다. Meta에 어떤 쓰기/실행성 요청도 보내지 않는다.
// (사용하는 토큰도 ads_read 권한만 가지고 있어, 쓰기 요청을 보내더라도 Meta가 거부한다.)

const INSIGHT_FIELDS = [
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
const BREAKDOWN_INSIGHT_FIELDS = [
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

const BREAKDOWN_MAP = {
  age_gender: "age,gender",
  publisher_platform: "publisher_platform",
  placement: "publisher_platform,platform_position",
} as const;

type BreakdownOption = "none" | keyof typeof BREAKDOWN_MAP;
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
function resolveBreakdown(rawValue: string | null): BreakdownOption {
  if (rawValue && isAllowedBreakdown(rawValue)) {
    return rawValue;
  }
  return DEFAULT_BREAKDOWN;
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

type DatePreset = (typeof ALLOWED_DATE_PRESETS)[number];
const DEFAULT_DATE_PRESET: DatePreset = "last_7d";

function isAllowedDatePreset(value: string): value is DatePreset {
  return (ALLOWED_DATE_PRESETS as readonly string[]).includes(value);
}

// 클라이언트가 보낸 임의 문자열을 그대로 Meta API에 전달하지 않고 whitelist로만 통과시킨다.
function resolveDatePreset(rawValue: string | null): DatePreset {
  if (rawValue && isAllowedDatePreset(rawValue)) {
    return rawValue;
  }
  return DEFAULT_DATE_PRESET;
}

export async function GET(request: NextRequest) {
  try {
    const accountId = getMetaAdAccountId();
    const { searchParams } = new URL(request.url);
    const datePreset = resolveDatePreset(searchParams.get("datePreset"));
    const breakdown = resolveBreakdown(searchParams.get("breakdown"));
    const after = searchParams.get("after") ?? undefined;

    const result = await fetchMeta<MetaInsightsResponse>(
      `/${accountId}/insights`,
      {
        level: "ad",
        date_preset: datePreset,
        time_increment: 1,
        fields:
          breakdown === "none" ? INSIGHT_FIELDS : BREAKDOWN_INSIGHT_FIELDS,
        breakdowns: breakdown === "none" ? undefined : BREAKDOWN_MAP[breakdown],
        after,
      }
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
