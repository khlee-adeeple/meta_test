/**
 * Meta Graph API 공통 설정.
 *
 * .env.local 에서만 값을 읽는다. API 버전은 절대 코드에 하드코딩하지 않는다.
 * 하나라도 빠지면 서버가 요청을 처리하기 전에 명확한 에러를 던진다.
 */

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getMetaAccessToken(): string {
  return readRequiredEnv("META_ACCESS_TOKEN");
}

// 콤마로 구분된 여러 광고계정 ID를 지원한다. 예:
// META_AD_ACCOUNT_IDS=act_111,act_222,act_333
export function getMetaAdAccountIds(): string[] {
  const raw = readRequiredEnv("META_AD_ACCOUNT_IDS");
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (ids.length === 0) {
    throw new Error("META_AD_ACCOUNT_IDS is not configured.");
  }

  return ids;
}

// 클라이언트가 임의의 계정 ID를 요청하지 못하도록, 설정된 목록 안에서만
// 허용한다 (whitelist). 목록에 없거나 값이 없으면 첫 번째(기본) 계정을 쓴다.
export function resolveRequestedAccountId(rawValue: string | null): string {
  const ids = getMetaAdAccountIds();
  if (rawValue && ids.includes(rawValue)) {
    return rawValue;
  }
  return ids[0];
}

export function getMetaGraphApiVersion(): string {
  return readRequiredEnv("META_GRAPH_API_VERSION");
}

export function getMetaGraphApiBaseUrl(): string {
  const version = getMetaGraphApiVersion();
  return `https://graph.facebook.com/${version}`;
}
