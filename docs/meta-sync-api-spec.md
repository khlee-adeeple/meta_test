# Meta 광고 데이터 적재 API 명세서

## 0. 배경 / 목적

`meta_api_nextjs.md` 기준 PoC(`meta-ads-test`)에서 Meta Marketing API 연동과
조회가 정상 동작하는 것을 확인했다. 이 문서는 그 다음 단계 — **Meta에서 받은
row 데이터를 우리 DB에 영구 적재하는 API**의 명세다.

이 API는 **별도 백엔드(예: Spring Boot)가 수신 측으로 구현**한다. 이 Next.js
프로젝트(또는 이를 대체할 스케줄러)는 여전히 Meta Graph API를 호출하는
**클라이언트/수집기(collector)** 역할만 하고, 수집한 row를 이 문서에 정의된
엔드포인트로 **그대로 전달(POST/PUT)** 하는 구조다.

```text
Meta Graph API
  ↓ (Next.js Route Handler가 조회 — 기존 /api/meta/* 그대로 유지)
Next.js 수집기(collector) / 스케줄러
  ↓ (이 문서에서 정의하는 적재 API 호출)
백엔드(Spring Boot 등) 적재 API
  ↓
DB
```

## 1. 설계 원칙

- **Meta 원본 필드명을 그대로 쓴다.** 프론트/PoC 단계에서 지켜온 원칙(임의로
  필드를 만들거나 값을 변환하지 않는다)을 적재 API에도 동일하게 적용한다.
- **Upsert 기반.** Meta 성과 지표는 attribution window 때문에 최초 수집 후
  며칠간 값이 소급 수정될 수 있다. 매번 같은 자연키로 재수집해서 최신값으로
  덮어쓰는 것을 기본 동작으로 한다 (append-only 이력은 이번 범위에 포함하지
  않음 — §8 참고).
- **부분 실패를 허용한다.** 배치 하나에 잘못된 row가 하나 섞여 있다고 전체
  배치를 실패시키지 않는다. row 단위로 성공/실패를 구분해서 응답한다.
- **Meta의 동적 필드(`action_type` 등)를 억지로 정규화하지 않는다.** 원본
  구조를 최대한 보존해서 저장한다 (JSONB + 선택적 정규화 테이블 병행, §4.5).
- 이 API는 내부 서비스 간(server-to-server) 통신 전제. 사용자 인증이 아니라
  **서비스 인증**(고정 API 키 또는 mTLS)을 쓴다.

## 2. 용어

| 용어 | 의미 |
|---|---|
| 차원(dimension) 테이블 | 자주 안 바뀌는 메타데이터: 계정/캠페인/광고세트/광고 |
| 팩트(fact) 테이블 | 매일 바뀌는 성과 수치: insight_records |
| breakdown_type | 우리 PoC 화면과 동일한 값: `none` \| `age_gender` \| `publisher_platform` \| `placement` |
| dimension_key | breakdown 조합을 하나의 문자열로 정규화한 값 (아래 §4.5 참고) |

## 3. 인증 / 공통 요청·응답 규칙

- 모든 요청: `Authorization: Bearer <META_SYNC_API_KEY>` (백엔드가 발급, Next.js
  쪽 `.env.local`에 `META_SYNC_API_KEY`로 보관 — Access Token과 마찬가지로
  절대 클라이언트에 노출하지 않음)
- 모든 요청/응답 Body: `application/json`
- 모든 적재 엔드포인트는 **PUT** (전체 리소스를 멱등하게 upsert한다는 의미를
  명확히 하기 위함). 배치당 `records` 최대 500개 권장 (그 이상은 클라이언트가
  분할 요청).
- 공통 응답 포맷:

```jsonc
{
  "success": true,
  "summary": { "received": 120, "upserted": 118, "failed": 2 },
  "failures": [
    { "index": 37, "message": "date_start가 유효한 날짜 형식이 아닙니다." }
  ]
}
```

- 실패 시(요청 자체가 잘못된 경우, 인증 실패 등):

```jsonc
{ "success": false, "error": { "message": "..." } }
```

## 4. 데이터 모델

### 4.1 `ad_accounts`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` (PK) | text | 예: `act_123456789012345`, Meta 원본 `id` |
| `account_id` | text | `act_` 접두사 없는 숫자 ID |
| `name` | text | |
| `account_status` | int | Meta 원본 숫자 그대로 (1=ACTIVE 등, 앱단에서 라벨링은 조회 시 처리) |
| `currency` | text | |
| `timezone_name` | text | |
| `timezone_offset_hours_utc` | numeric | |
| `synced_at` | timestamptz | 이 row가 마지막으로 갱신된 시각 |

Upsert 키: `id`

### 4.2 `campaigns`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` (PK) | text | Meta 캠페인 ID |
| `account_id` | text (FK → ad_accounts.id) | **주의**: Meta 캠페인 객체 자체에는 `account_id`가 없다. 수집기가 어떤 계정에서 가져왔는지 알고 있으므로, 요청 body에 반드시 같이 실어 보낸다 |
| `name` | text | |
| `status` | text | |
| `effective_status` | text | |
| `objective` | text | |
| `created_time` | timestamptz | |
| `updated_time` | timestamptz | Meta 쪽 수정시각 (우리 쪽 적재시각인 `synced_at`과 구분) |
| `synced_at` | timestamptz | |

Upsert 키: `id`

### 4.3 `adsets`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` (PK) | text | |
| `account_id` | text (FK) | 수집기가 채움 |
| `campaign_id` | text (FK → campaigns.id) | |
| `name` | text | |
| `status` / `effective_status` | text | |
| `daily_budget` / `lifetime_budget` | numeric, nullable | Meta가 문자열로 주는 원 단위 그대로 숫자로 파싱. 파싱 실패 시 해당 필드만 null 처리하고 원본은 §4.5처럼 raw 보존 방식을 따르지 않고 실패 목록에 기록 (필요하면 이후 raw 컬럼 추가 검토) |
| `optimization_goal` / `billing_event` | text | |
| `start_time` / `end_time` | timestamptz, nullable | |
| `created_time` / `updated_time` | timestamptz | |
| `synced_at` | timestamptz | |

Upsert 키: `id`

### 4.4 `ads`

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` (PK) | text | |
| `account_id` / `campaign_id` / `adset_id` | text (FK) | 모두 수집기가 채움 (`adset_id`는 Meta 광고 객체에 포함되어 있음) |
| `name` | text | |
| `status` / `effective_status` | text | |
| `created_time` / `updated_time` | timestamptz | |
| `synced_at` | timestamptz | |

Upsert 키: `id`

### 4.5 `insight_records` (+ `insight_actions`)

Insights는 breakdown 유무에 따라 한 (ad, 날짜) 조합에 여러 row가 나올 수
있으므로, 자연키에 breakdown을 포함한 `dimension_key`를 둔다.

**`dimension_key` 계산 규칙 (수집기가 계산해서 요청에 포함시킨다):**

| breakdown_type | dimension_key 예시 | 비고 |
|---|---|---|
| `none` | `"-"` | 고정값 |
| `age_gender` | `"25-34\|female"` | `age`, `gender`를 `\|`로 연결 |
| `publisher_platform` | `"facebook"` | `publisher_platform` 값 그대로 |
| `placement` | `"facebook\|feed"` | `publisher_platform`, `platform_position`을 `\|`로 연결 |

`insight_records` 테이블:

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` (PK) | bigserial / uuid | 내부 대리키 |
| `account_id` | text (FK) | |
| `campaign_id` / `adset_id` / `ad_id` | text (FK, nullable) | level=ad 고정이라 항상 채워짐 |
| `date_start` / `date_stop` | date | `time_increment=1` 고정이라 보통 동일 |
| `breakdown_type` | text | `none`\|`age_gender`\|`publisher_platform`\|`placement` |
| `dimension_key` | text | 위 규칙, breakdown 없으면 `"-"` |
| `age` / `gender` / `publisher_platform` / `platform_position` | text, nullable | breakdown 종류에 따라만 채워짐 (Meta가 안 준 값은 null, `0`이나 빈 문자열로 대체 금지) |
| `spend` / `impressions` / `reach` / `clicks` / `inline_link_clicks` | numeric | Meta가 문자열로 준 값을 파싱. 파싱 불가 값은 이 row를 실패 처리 |
| `ctr` / `cpc` / `cpm` / `frequency` | numeric, nullable | |
| `raw_actions` / `raw_action_values` / `raw_cost_per_action_type` / `raw_purchase_roas` | jsonb | Meta가 준 `[{action_type, value}, ...]` 배열을 **그대로** 저장 (안전망) |
| `synced_at` | timestamptz | |

Upsert 키: (`account_id`, `ad_id`, `date_start`, `breakdown_type`, `dimension_key`)

**정규화 테이블 `insight_actions` (선택, 조회 성능/필터링용 — 예: "purchase만
집계"):**

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `insight_record_id` (FK) | bigint/uuid | |
| `kind` | text | `action`\|`action_value`\|`cost_per_action_type`\|`purchase_roas` (원본 필드 구분) |
| `action_type` | text | Meta의 동적 값 그대로 (`link_click`, `purchase`, `omni_purchase` 등 — 문서 26번 섹션 경고대로 임의로 의미를 단정하지 않는다) |
| `value` | numeric | |

`insight_records`가 upsert될 때 `insight_actions`도 해당 `insight_record_id`
기준으로 전량 삭제 후 재삽입한다 (부분 diff보다 단순하고, 매번 전체 배열을
받으므로 안전).

## 5. 엔드포인트

### 5.1 `PUT /internal/meta-sync/v1/accounts`

```jsonc
// Request
{
  "accounts": [
    {
      "id": "act_1993422144326874",
      "account_id": "1993422144326874",
      "name": "ADEEPLE 광고 계정",
      "account_status": 1,
      "currency": "KRW",
      "timezone_name": "Asia/Seoul",
      "timezone_offset_hours_utc": 9
    }
  ]
}
```

### 5.2 `PUT /internal/meta-sync/v1/campaigns`

```jsonc
{
  "campaigns": [
    {
      "id": "120247336475840485",
      "account_id": "act_1993422144326874",
      "name": "...",
      "status": "ACTIVE",
      "effective_status": "ACTIVE",
      "objective": "OUTCOME_SALES",
      "created_time": "2026-08-24T16:58:11+0900",
      "updated_time": "2026-08-24T16:58:11+0900"
    }
  ]
}
```

### 5.3 `PUT /internal/meta-sync/v1/adsets`

`campaigns`와 동일한 형태 + `campaign_id`, `daily_budget`, `lifetime_budget`,
`optimization_goal`, `billing_event`, `start_time`, `end_time` 포함
(§4.3 필드 그대로).

### 5.4 `PUT /internal/meta-sync/v1/ads`

`campaign_id`, `adset_id` 포함 (§4.4 필드 그대로).

### 5.5 `PUT /internal/meta-sync/v1/insights`

```jsonc
{
  "breakdown_type": "age_gender",
  "records": [
    {
      "account_id": "act_1993422144326874",
      "campaign_id": "...",
      "adset_id": "...",
      "ad_id": "...",
      "date_start": "2026-09-01",
      "date_stop": "2026-09-01",
      "dimension_key": "25-34|female",
      "age": "25-34",
      "gender": "female",
      "publisher_platform": null,
      "platform_position": null,
      "spend": "68026",
      "impressions": "3413",
      "reach": null,
      "clicks": "61",
      "inline_link_clicks": null,
      "ctr": null,
      "cpc": null,
      "cpm": null,
      "frequency": null,
      "actions": [{ "action_type": "link_click", "value": "51" }],
      "action_values": [],
      "cost_per_action_type": [],
      "purchase_roas": []
    }
  ]
}
```

- `breakdown_type` 하나에 대해 여러 `records`를 한 번에 보낸다 (배치 하나
  = 하나의 breakdown 종류). 여러 breakdown을 같이 적재하려면 요청을 여러 번
  나눠 보낸다.
- 요청 필드명은 이 프로젝트의 `MetaInsight` 타입(`src/types/meta.ts`)과
  1:1로 맞춘다 — 수집기가 Meta 응답을 거의 그대로 전달할 수 있게.

### 5.6 (선택) `POST /internal/meta-sync/v1/sync-runs`

수집 이력(관측용, upsert 대상 아님 — append-only):

```jsonc
// Request
{
  "account_ids": ["act_...", "act_..."],
  "date_preset": "last_7d",
  "breakdown_type": "none",
  "started_at": "2026-09-17T00:00:00Z",
  "finished_at": "2026-09-17T00:00:12Z",
  "status": "success", // success | partial | failed
  "row_counts": { "accounts": 4, "campaigns": 40, "adsets": 120, "ads": 300, "insights": 91 },
  "errors": [{ "account_id": "act_...", "message": "..." }]
}
```

스케줄러(§8의 정기 수집)를 붙이기 전엔 필수는 아니지만, 나중에 "언제 마지막
으로 잘 돌았는지" 확인하려면 초기부터 만들어두는 걸 권장.

## 6. Upsert 키 요약

| 테이블 | Upsert 키 |
|---|---|
| `ad_accounts` | `id` |
| `campaigns` | `id` |
| `adsets` | `id` |
| `ads` | `id` |
| `insight_records` | `account_id, ad_id, date_start, breakdown_type, dimension_key` |

## 7. 재시도 / 부분 실패

- 수집기는 네트워크 오류 시 **같은 배치를 그대로 재시도**해도 안전하다
  (모든 엔드포인트가 upsert이므로).
- 백엔드는 배치 내 row 하나가 검증 실패(날짜 파싱 실패, 필수 키 누락 등)해도
  나머지 row는 정상 적재하고, 실패한 row만 `failures` 배열에 `index` +
  사유로 알려준다 (§3 공통 응답 포맷).
- 계정 하나 전체가 Meta 쪽 오류(권한 회수, 계정 비활성 등)로 조회 자체가
  안 된 경우는 이 API 호출 이전 단계(수집기)에서 걸러지므로, 이 API는 그
  계정의 요청 자체를 받지 않는다 — PoC의 `/api/meta/insights/all`이 이미
  이 방식(계정별 부분 실패를 `accountErrors`로 분리)을 쓰고 있다.

## 8. 이번 범위에 포함하지 않는 것 (다음 단계)

- 정기 수집 스케줄러(cron) 자체의 구현 — 이 문서는 스케줄러가 "무엇을
  호출해야 하는지"만 정의한다.
- 이력(append-only) 보존 — 지금은 upsert로 최신값만 유지. 나중에 "어제
  대비 오늘 소급 수정된 값 추적"이 필요해지면 `insight_records`에
  `previous_value` 스냅샷을 남기는 이력 테이블을 별도로 추가하는 방향을
  검토.
- 증분(incremental) 동기화 범위 최적화 — 지금은 매번 `date_preset` 전체
  재조회 + upsert. 데이터量이 커지면 "최근 N일만 다시 긁기" 같은 전략 필요.
- 인증 방식의 구체적 구현(API 키 발급/로테이션 절차)은 백엔드 팀 책임 범위.
