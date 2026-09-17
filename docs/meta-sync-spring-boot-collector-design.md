# Meta 수집 + DB 적재 서버 설계 (Spring Boot, 단일 서비스)

## 0. 배경

`docs/meta-sync-api-spec.md`는 "별도 백엔드가 적재 API를 수신하고, 이
Next.js 프로젝트가 수집기(collector) 역할을 한다"는 2-서비스 구조를
전제로 작성됐다.

이 문서는 그와 별개로 — **이 `meta-ads-test` Next.js 프로젝트와는 완전히
독립된 새 서버**를, **같은 방법(원칙)** 으로 만들 때의 설계다. 다만 이번엔
"수집(collector)"과 "적재(DB 저장)"를 **하나의 Spring Boot 서비스** 안에서
같이 처리한다 (별도 적재 API를 거치지 않고, 이 서비스가 Meta를 직접 조회해서
자기 DB에 바로 저장).

```text
Meta Graph API
  ↓
MetaGraphClient (WebClient)          — Next.js의 fetchMeta.ts와 같은 역할
  ↓
Mapper (Meta JSON → Entity)
  ↓
Repository (JPA, upsert)             — meta-sync-api-spec.md §4 테이블 스키마 재사용
  ↓
DB
```

같은 데이터 모델(§4의 `ad_accounts`/`campaigns`/`adsets`/`ads`/
`insight_records`/`insight_actions`)을 그대로 쓰므로, 나중에 이 서비스를
"수집 전용"으로 쪼개고 별도 적재 API를 붙이는 구조로 바꿔도 테이블 설계는
안 바뀐다.

## 1. 패키지 구조

```text
com.adeeple.metasync
├─ config/
│  ├─ MetaProperties.kt        # @ConfigurationProperties(prefix="meta") — token, accountIds, apiVersion
│  └─ WebClientConfig.kt       # baseUrl = https://graph.facebook.com/{version}
├─ client/
│  └─ MetaGraphClient.kt       # getAccount(), getCampaigns(), getAdsets(), getAds(), getInsights()
├─ dto/                        # Meta 응답 매핑용 (meta-ads-test의 src/types/meta.ts와 1:1)
│  ├─ MetaAdAccountDto, MetaCampaignDto, MetaAdsetDto, MetaAdDto
│  └─ MetaInsightDto, MetaActionDto, MetaPagingDto
├─ entity/                     # meta-sync-api-spec.md §4 테이블 그대로
│  ├─ AdAccountEntity, CampaignEntity, AdsetEntity, AdEntity
│  └─ InsightRecordEntity, InsightActionEntity
├─ repository/                 # Spring Data JPA
├─ service/
│  ├─ MetaSyncService.kt       # 계정 1개: account→campaigns→adsets→ads→insights 순서로 수집+적재
│  └─ MetaSyncOrchestrator.kt  # 설정된 여러 계정에 대해 MetaSyncService 반복 호출 + 부분실패 집계
├─ scheduler/
│  └─ MetaSyncScheduler.kt     # @Scheduled(cron=...)
└─ controller/ (선택)
   └─ AdminSyncController.kt   # POST /admin/meta-sync/trigger — 수동 트리거, 내부 인증 필요
```

## 2. 단계별 진행 순서

PoC(`meta_api_nextjs.md`)와 같은 방식 — 한 번에 다 만들지 않고 하나씩
검증하며 진행한다.

| STEP | 내용 |
|---|---|
| 1 | 프로젝트 골격 + `MetaProperties` (환경변수 `META_ACCESS_TOKEN`/`META_AD_ACCOUNT_IDS`/`META_GRAPH_API_VERSION` 로드, 누락 시 `@PostConstruct`에서 명확한 예외) |
| 2 | `MetaGraphClient.getAccount()` 하나만 구현 → 계정 1개 조회 성공 확인 (아직 DB 저장 없이 로그로만) |
| 3 | `entity`/`repository` 만들고, account 1건을 upsert하는 것까지 확인 (JPA에서 `@Id`를 Meta의 `id`로 직접 지정하면 `save()`가 insert/update를 upsert처럼 처리함) |
| 4 | campaigns/adsets/ads도 같은 패턴으로 확장 (조회 → 매핑 → upsert) |
| 5 | insights 조회 + `dimension_key` 계산 + `insight_records`/`insight_actions` upsert |
| 6 | `MetaSyncOrchestrator`로 여러 계정 순회, 계정 하나 실패해도 나머지는 계속 진행 (Next.js `/api/meta/insights/all`과 같은 부분실패 패턴) |
| 7 | `@Scheduled` 스케줄러 연결 (처음엔 수동 트리거 엔드포인트로 먼저 검증한 뒤 cron 등록) |
| 8 | `sync_runs` 로깅 붙이기 (meta-sync-api-spec.md §5.6과 동일한 목적) |

## 3. PoC에서 반드시 그대로 가져와야 할 원칙

- **토큰 흐름**: `MetaGraphClient` 내부에서만 access_token을 쿼리파라미터로
  붙인다. DTO/엔티티/로그 어디에도 절대 노출되지 않게 한다 — 특히 Meta
  응답의 `paging.next`/`paging.previous`에는 access_token이 포함된 전체
  URL이 그대로 들어있으므로 (PoC에서 실제로 발견했던 버그, `fetchMeta.ts`의
  `stripPagingUrls` 참고), **아예 DTO 필드로 매핑하지 않는 것**을 권장한다.
  역직렬화 대상에서 빼면 실수로 로그/응답에 찍힐 일 자체가 없다.
  `paging.cursors.after`만 다음 페이지 조회에 사용한다.
- **whitelist 검증**: breakdown, date_preset 같은 값은 enum으로 받는다.
  외부(관리자 트리거 API 등)에서 값을 받는다면 Bean Validation(`@Pattern`
  또는 enum 타입)으로 막는다.
- **에러 구분**: WebClient 호출 자체의 네트워크 예외와 Meta가 준
  `{error: {message, type, code, error_subcode, fbtrace_id}}`를 구분해서
  로깅한다 (`fetchMeta.ts`와 동일한 정신 — access_token, app_secret은
  로그에 남기지 않는다).
- **breakdown별 필드셋 분리**: 기본 지표 조회와 breakdown 조회를 완전히
  분리된 요청/필드셋으로 유지한다 (모든 breakdown이 모든 지표 조합을
  지원하지는 않으므로).
- **계정 목록**: `META_AD_ACCOUNT_IDS` 콤마 구분 형식을 그대로 재사용한다 —
  지금 `.env.local`에 있는 4개 계정으로 바로 테스트 가능하다.

## 4. 시크릿 관리 (Next.js `.env.local`과의 대응)

Spring Boot는 `application.yml`에 값을 직접 넣지 않고 환경변수 참조만
둔다.

```yaml
meta:
  access-token: ${META_ACCESS_TOKEN}
  ad-account-ids: ${META_AD_ACCOUNT_IDS}
  graph-api-version: ${META_GRAPH_API_VERSION}
```

실제 값은 배포 환경의 환경변수/시크릿 매니저에 두고, `application.yml`
자체는 커밋해도 안전하게 유지한다 (`.env.local`이 gitignore된 것과 같은
효과를 환경변수가 대신한다).

## 5. 이번 설계에서 열어둔 결정 사항

실제 구현을 시작할 때 정해야 할 것들 (이 문서에서는 확정하지 않음):

- DB 종류 (Postgres / MySQL 등)
- ORM 방식 (JPA vs jOOQ 등 — upsert를 네이티브 `ON CONFLICT`로 할지, JPA의
  assigned-id `save()` 동작에 맡길지)
- 이 서비스를 나중에 "수집 전용"과 "적재 전용"으로 다시 쪼갤지 여부 —
  쪼개게 되면 `docs/meta-sync-api-spec.md`의 적재 API 명세를 그대로 이
  서비스의 내부 인터페이스 경계로 재사용할 수 있다.
