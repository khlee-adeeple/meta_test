# meta-ads-test

Meta Marketing API를 로컬에서 호출해 광고계정 데이터를 조회하는 테스트(PoC) 프로젝트입니다.
DB 저장이나 운영 서비스가 목적이 아니라, **API 연동 및 조회 가능 여부 확인**이 목적입니다.

Access Token을 브라우저에 노출하지 않기 위해, Meta Graph API 호출은 항상
Next.js Route Handler(서버)에서만 수행합니다.

```text
Browser → Next.js Page/Client Component → Route Handler (/api/meta/*) → Meta Graph API
```

## 현재 구현 범위 (STEP 1~3)

- `GET /api/meta/account` : 광고계정 기본정보(`id`, `account_id`, `name`,
  `account_status`, `currency`, `timezone_name`, `timezone_offset_hours_utc`) 조회
- 메인 화면(`/`)에서 버튼 클릭 → 카드 형태로 출력 + 원본 JSON 접어보기

캠페인 / 광고세트 / 광고 / Insights API는 아직 구현하지 않았습니다. 이번 기능이
정상 동작하는 것을 확인한 뒤 순서대로 확장할 예정입니다.

## 준비

1. Meta 개발자 앱, 비즈니스 포트폴리오, 광고계정, `ads_read` 권한을 가진
   Access Token이 준비되어 있어야 합니다.
2. `.env.local.example`을 복사해 `.env.local`을 만들고 실제 값을 채웁니다.

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   META_ACCESS_TOKEN=발급받은_토큰
   META_AD_ACCOUNT_ID=act_123456789012345
   META_GRAPH_API_VERSION=v21.0
   ```

   `META_GRAPH_API_VERSION`은 Meta 개발자 대시보드에서 현재 사용 중인 Graph API
   버전을 그대로 적습니다. `.env.local`은 git에 커밋되지 않습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`(포트가 사용 중이면 콘솔에 표시되는 다른 포트)
접속 후 "광고계정 조회" 버튼을 클릭합니다.

### 성공 기준

- 계정명, account ID, 통화(예: KRW), timezone이 카드에 출력됨
- 브라우저 응답/Network 탭 어디에도 `access_token` 값이 노출되지 않음
- 서버 콘솔에 `[META API] GET ...` 로그가 남음

### 환경변수가 비어 있을 때

`.env.local` 값이 비어 있으면 조회 버튼을 눌렀을 때 다음과 같이 설정 오류가
그대로 화면에 표시됩니다 (Access Token 값 자체는 노출되지 않습니다).

```json
{ "success": false, "error": { "message": "META_AD_ACCOUNT_ID is not configured." } }
```

## 프로젝트 구조

```text
src/
├─ app/
│  ├─ api/meta/account/route.ts   # GET /api/meta/account
│  ├─ page.tsx                    # 메인 테스트 화면 (Client Component)
│  └─ layout.tsx
├─ components/meta/MetaAccountCard.tsx
├─ lib/meta/
│  ├─ config.ts                   # 환경변수 로딩 + 검증
│  └─ fetchMeta.ts                # Graph API 공통 fetch (에러 처리 포함)
└─ types/meta.ts
```
