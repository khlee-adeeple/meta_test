import { NextRequest, NextResponse } from "next/server";
import { resolveRequestedAccountId } from "@/lib/meta/config";
import { fetchMeta } from "@/lib/meta/fetchMeta";
import type { MetaAdset, MetaListResponse } from "@/types/meta";

const ADSET_FIELDS = [
  "id",
  "name",
  "campaign_id",
  "status",
  "effective_status",
  "daily_budget",
  "lifetime_budget",
  "optimization_goal",
  "billing_event",
  "start_time",
  "end_time",
  "created_time",
  "updated_time",
].join(",");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = resolveRequestedAccountId(searchParams.get("accountId"));
    const after = searchParams.get("after") ?? undefined;

    // 필드 중 일부가 계정/버전에서 지원되지 않으면 fetchMeta가 Meta 에러 응답을
    // 그대로 서버 콘솔에 남긴다 (message/type/code/error_subcode/fbtrace_id).
    const result = await fetchMeta<MetaListResponse<MetaAdset>>(
      `/${accountId}/adsets`,
      {
        fields: ADSET_FIELDS,
        limit: 100,
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
