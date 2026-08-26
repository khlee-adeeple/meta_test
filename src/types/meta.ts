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

/**
 * actions / action_values / cost_per_action_type / purchase_roas가
 * 공통으로 사용하는 형태. action_type이 동적이라 union으로 제한하지 않는다.
 */
export interface MetaAction {
  action_type: string;
  value?: string;
}

export interface MetaPaging {
  cursors?: {
    before?: string;
    after?: string;
  };
  // Meta 원본 응답에는 access_token이 포함된 전체 URL로 내려오지만,
  // fetchMeta가 서버에서 항상 제거하므로 우리 API 응답에는 절대 채워지지 않는다.
  // (타입은 Meta 원본 스키마 문서화 목적으로만 유지)
  next?: string;
  previous?: string;
}

export interface MetaInsight {
  account_id?: string;
  account_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  date_start?: string;
  date_stop?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  inline_link_clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  purchase_roas?: MetaAction[];
  // breakdown 조회 시에만 채워지는 필드 (age+gender / publisher_platform / placement)
  age?: string;
  gender?: string;
  publisher_platform?: string;
  platform_position?: string;
}

export interface MetaInsightsResponse {
  data: MetaInsight[];
  paging?: MetaPaging;
}

export interface MetaCampaign {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  created_time?: string;
  updated_time?: string;
}

export interface MetaAdset {
  id?: string;
  name?: string;
  campaign_id?: string;
  status?: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal?: string;
  billing_event?: string;
  start_time?: string;
  end_time?: string;
  created_time?: string;
  updated_time?: string;
}

export interface MetaAd {
  id?: string;
  name?: string;
  campaign_id?: string;
  adset_id?: string;
  status?: string;
  effective_status?: string;
  created_time?: string;
  updated_time?: string;
}

// campaigns/adsets/ads 목록 API 공용 응답 형태.
export interface MetaListResponse<T> {
  data: T[];
  paging?: MetaPaging;
}
