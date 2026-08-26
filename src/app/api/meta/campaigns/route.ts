import { NextRequest, NextResponse } from "next/server";
import { getMetaAdAccountId } from "@/lib/meta/config";
import { fetchMeta } from "@/lib/meta/fetchMeta";
import type { MetaCampaign, MetaListResponse } from "@/types/meta";

const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "status",
  "effective_status",
  "objective",
  "created_time",
  "updated_time",
].join(",");

export async function GET(request: NextRequest) {
  try {
    const accountId = getMetaAdAccountId();
    // 이전 페이지 응답의 paging.cursors.after를 그대로 넘겨받아 다음 페이지를
    // 조회한다. 우리가 발급한 cursor가 아니라 Meta가 발급한 cursor이므로
    // whitelist 검증 없이 그대로 전달해도 안전하다 (URLSearchParams가 인코딩).
    const after = new URL(request.url).searchParams.get("after") ?? undefined;

    const result = await fetchMeta<MetaListResponse<MetaCampaign>>(
      `/${accountId}/campaigns`,
      {
        fields: CAMPAIGN_FIELDS,
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
