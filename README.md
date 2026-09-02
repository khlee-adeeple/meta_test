# meta-ads-test

Meta Marketing API를 로컬에서 호출해 광고계정 데이터를 조회하는 테스트(PoC) 프로젝트입니다.
DB 저장이나 운영 서비스가 목적이 아니라, **API 연동 및 조회 가능 여부 확인**이 목적입니다.

Access Token을 브라우저에 노출하지 않기 위해, Meta Graph API 호출은 항상
Next.js Route Handler(서버)에서만 수행합니다.

```text
Browser → Next.js Page/Client Component → Route Handler (/api/meta/*) → Meta Graph API
```

## 구현 범위

- `GET /api/meta/account` — 광고계정 기본정보 조회
- `GET /api/meta/campaigns`, `/adsets`, `/ads` — 목록 조회 (cursor 기반 페이지네이션)
- `GET /api/meta/insights` — 광고 성과 조회
  - 기간 필터(`datePreset`: 오늘/어제/최근 7일/최근 30일 등)
  - Breakdown(`breakdown`: 없음/연령+성별/게재 위치/노출 위치)
  - 페이지네이션
- 여러 광고계정 조회 지원 (`accountId` 쿼리 파라미터 + whitelist 검증)
- 모든 API 응답에서 `access_token`은 절대 노출되지 않음 (paging.next/previous도
  서버에서 제거)

메인 화면(`/`)에서 계정을 고르고 각 섹션 버튼을 눌러 조회하며, 결과 아래 원본
JSON을 접어서 볼 수 있습니다.

## 준비

1. Meta 개발자 앱, 비즈니스 포트폴리오, 조회할 광고계정(들), `ads_read` 권한을
   가진 Access Token이 준비되어 있어야 합니다.
   - 반복적으로 만료되지 않으려면 **System User Access Token**(만료 기간
     "없음")을 권장합니다. Graph API Explorer의 일반 User Token은 1~2시간 뒤
     만료됩니다.
2. `.env.local.example`을 복사해 `.env.local`을 만들고 실제 값을 채웁니다.

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   META_ACCESS_TOKEN=발급받은_토큰
   META_AD_ACCOUNT_IDS=act_123456789012345,act_223456789012345
   META_GRAPH_API_VERSION=v21.0
   ```

   - `META_AD_ACCOUNT_IDS`는 콤마로 구분된 하나 이상의 광고계정 ID입니다.
     첫 번째 계정이 기본값으로 쓰입니다. 화면의 "광고계정 선택" 버튼과
     `src/app/page.tsx`의 `ACCOUNT_OPTIONS` 목록도 이 값과 맞춰서 관리합니다.
   - `META_GRAPH_API_VERSION`은 Meta 개발자 대시보드에서 현재 사용 중인 Graph
     API 버전을 그대로 적습니다.
   - `.env.local`은 git에 커밋되지 않습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`(포트가 사용 중이면 콘솔에 표시되는 다른 포트)
접속 후 계정을 선택하고 각 섹션의 조회 버튼을 클릭합니다.

### 성공 기준

- 계정명, account ID, 통화(예: KRW), timezone이 카드에 출력됨
- 브라우저 응답/Network 탭 어디에도 `access_token` 값이 노출되지 않음
- 서버 콘솔에 `[META API] GET ...` 로그가 남음

### 환경변수가 비어 있을 때

`.env.local` 값이 비어 있으면 조회 버튼을 눌렀을 때 다음과 같이 설정 오류가
그대로 화면에 표시됩니다 (Access Token 값 자체는 노출되지 않습니다).

```json
{ "success": false, "error": { "message": "META_AD_ACCOUNT_IDS is not configured." } }
```

## 프로젝트 구조

```text
src/
├─ app/
│  ├─ api/meta/
│  │  ├─ account/route.ts     # GET /api/meta/account
│  │  ├─ campaigns/route.ts   # GET /api/meta/campaigns
│  │  ├─ adsets/route.ts      # GET /api/meta/adsets
│  │  ├─ ads/route.ts         # GET /api/meta/ads
│  │  └─ insights/route.ts    # GET /api/meta/insights
│  ├─ page.tsx                # 메인 테스트 화면 (Client Component)
│  └─ layout.tsx
├─ components/meta/           # MetaAccountCard, CampaignTable, AdsetTable,
│                             # AdTable, InsightTable
├─ hooks/useMetaList.ts       # 목록형(campaigns/adsets/ads/insights) 조회 +
│                             # cursor 페이지네이션 공용 훅
├─ lib/meta/
│  ├─ config.ts               # 환경변수 로딩/검증, 계정 whitelist 해석
│  └─ fetchMeta.ts            # Graph API 공통 fetch (에러 처리, paging URL 제거)
└─ types/meta.ts
```
