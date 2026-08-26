import { NextRequest, NextResponse } from "next/server";
import { getMetaAdAccountId } from "@/lib/meta/config";
import { fetchMeta } from "@/lib/meta/fetchMeta";
import type { MetaAd, MetaListResponse } from "@/types/meta";

// Creative 상세정보는 이 단계에서 요청하지 않는다 (문서 11번 섹션).
const AD_FIELDS = [
  "id",
  "name",
  "campaign_id",
  "adset_id",
  "status",
  "effective_status",
  "created_time",
  "updated_time",
].join(",");

export async function GET(request: NextRequest) {
  try {
    const accountId = getMetaAdAccountId();
    const after = new URL(request.url).searchParams.get("after") ?? undefined;

    const result = await fetchMeta<MetaListResponse<MetaAd>>(
      `/${accountId}/ads`,
      {
        fields: AD_FIELDS,
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
