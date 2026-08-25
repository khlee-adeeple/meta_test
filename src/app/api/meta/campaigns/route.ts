import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const accountId = getMetaAdAccountId();

    const result = await fetchMeta<MetaListResponse<MetaCampaign>>(
      `/${accountId}/campaigns`,
      {
        fields: CAMPAIGN_FIELDS,
        limit: 100,
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
