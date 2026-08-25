import { NextResponse } from "next/server";
import { getMetaAdAccountId } from "@/lib/meta/config";
import { fetchMeta } from "@/lib/meta/fetchMeta";
import type { MetaAdAccount } from "@/types/meta";

const ACCOUNT_FIELDS = [
  "id",
  "account_id",
  "name",
  "account_status",
  "currency",
  "timezone_name",
  "timezone_offset_hours_utc",
].join(",");

export async function GET() {
  try {
    const accountId = getMetaAdAccountId();

    const result = await fetchMeta<MetaAdAccount>(`/${accountId}`, {
      fields: ACCOUNT_FIELDS,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // 환경변수 누락 등 설정 오류. Access Token 값 자체는 노출하지 않는다.
    return NextResponse.json(
      { success: false, error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
