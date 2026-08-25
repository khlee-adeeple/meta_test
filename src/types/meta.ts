/**
 * Meta Marketing API 관련 타입.
 *
 * Meta Graph API는 숫자 지표를 문자열로 반환하는 경우가 많으므로
 * 처음부터 number로 단정하지 않는다. 응답에 없는 필드도 많으므로
 * optional로 정의한다.
 */

export interface MetaAdAccount {
  id?: string;
  account_id?: string;
  name?: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
  timezone_offset_hours_utc?: number;
}

export interface MetaApiError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export type MetaApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: MetaApiError };
