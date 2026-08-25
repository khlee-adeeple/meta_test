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

export function getMetaAdAccountId(): string {
  return readRequiredEnv("META_AD_ACCOUNT_ID");
}

export function getMetaGraphApiVersion(): string {
  return readRequiredEnv("META_GRAPH_API_VERSION");
}

export function getMetaGraphApiBaseUrl(): string {
  const version = getMetaGraphApiVersion();
  return `https://graph.facebook.com/${version}`;
}
