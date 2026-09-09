import { NextRequest, NextResponse } from "next/server";
import { resolveRequestedAccountId } from "@/lib/meta/config";
import { fetchMeta } from "@/lib/meta/fetchMeta";
import {
  insightFieldsFor,
  metaBreakdownsFor,
  resolveBreakdown,
  resolveDatePreset,
} from "@/lib/meta/insightsQuery";
import type { MetaInsightsResponse } from "@/types/meta";

// 이 Route는 조회(GET) 전용이다. Meta에 어떤 쓰기/실행성 요청도 보내지 않는다.
// (사용하는 토큰도 ads_read 권한만 가지고 있어, 쓰기 요청을 보내더라도 Meta가 거부한다.)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = resolveRequestedAccountId(searchParams.get("accountId"));
    const datePreset = resolveDatePreset(searchParams.get("datePreset"));
    const breakdown = resolveBreakdown(searchParams.get("breakdown"));
    const after = searchParams.get("after") ?? undefined;

    const result = await fetchMeta<MetaInsightsResponse>(
      `/${accountId}/insights`,
      {
        level: "ad",
        date_preset: datePreset,
        time_increment: 1,
        fields: insightFieldsFor(breakdown),
        breakdowns: metaBreakdownsFor(breakdown),
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
