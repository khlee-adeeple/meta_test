import { NextRequest, NextResponse } from "next/server";
import { getMetaAdAccountIds } from "@/lib/meta/config";
import { fetchMeta } from "@/lib/meta/fetchMeta";
import {
  insightFieldsFor,
  metaBreakdownsFor,
  resolveBreakdown,
  resolveDatePreset,
} from "@/lib/meta/insightsQuery";
import type { MetaInsight, MetaInsightsResponse } from "@/types/meta";

// 이 Route는 조회(GET) 전용이다. .env.local에 설정된 모든 광고계정에 대해
// /api/meta/insights와 완전히 같은 fields/breakdown/date_preset 규칙으로
// 병렬 조회한 뒤, 결과를 하나의 배열로 합쳐서 돌려준다.
//
// 계정별 조회(=/api/meta/insights)는 그대로 두고 이 Route는 그 위에
// "합치는" 역할만 한다 — 계정별 요청 로직 자체는 바꾸지 않는다.
//
// 페이지네이션은 지원하지 않는다 (계정마다 커서가 달라 하나로 합치기
// 어려움). 계정당 첫 페이지만 합쳐서 보여준다.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datePreset = resolveDatePreset(searchParams.get("datePreset"));
    const breakdown = resolveBreakdown(searchParams.get("breakdown"));
    const accountIds = getMetaAdAccountIds();

    const perAccountResults = await Promise.all(
      accountIds.map(async (accountId) => ({
        accountId,
        result: await fetchMeta<MetaInsightsResponse>(
          `/${accountId}/insights`,
          {
            level: "ad",
            date_preset: datePreset,
            time_increment: 1,
            fields: insightFieldsFor(breakdown),
            breakdowns: metaBreakdownsFor(breakdown),
          }
        ),
      }))
    );

    // 계정 하나가 실패해도(예: 일시적 오류, 권한 회수) 전체 요청을 실패시키지
    // 않는다. 성공한 계정의 데이터는 그대로 보여주고, 실패한 계정은 목록으로
    // 알려준다.
    const rows: MetaInsight[] = [];
    const accountErrors: { accountId: string; message: string }[] = [];

    for (const { accountId, result } of perAccountResults) {
      if (result.success) {
        rows.push(...result.data.data);
      } else {
        accountErrors.push({ accountId, message: result.error.message });
      }
    }

    return NextResponse.json(
      { success: true, data: { data: rows, accountErrors } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
