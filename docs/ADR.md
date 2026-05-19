# Architecture Decision Records

## 철학
MVP 속도 최우선. 외부 의존성 최소화. 작동하는 최소 구현을 선택한다.

---

### ADR-001: Next.js App Router 단일 앱
**결정**: 프론트엔드와 API를 Next.js App Router 한 프로젝트에 둔다.
**이유**: 별도 백엔드 서버 없이 페이지와 API 라우트를 함께 배포. Server Components로 DB를 직접 조회해 데이터 페칭 계층을 줄인다.
**트레이드오프**: 프론트와 백엔드가 강결합. 추후 API를 독립 서비스로 분리하려면 재구성이 필요하다.

### ADR-002: 구조화는 Claude, 임베딩은 OpenAI
**결정**: 비정형 텍스트 구조화·답변 생성은 Claude(Anthropic SDK의 zod 출력 포맷), 임베딩은 OpenAI `text-embedding-3-small`(1536차원)을 사용한다.
**이유**: 한국어 구조화·답변 품질은 Claude가 강점, 임베딩은 저렴하고 검증된 OpenAI 모델로 충분. 주입(문서)과 조회(질문)를 동일 모델로 임베딩해 벡터 공간을 일치시킨다.
**트레이드오프**: 두 벤더의 API 키를 모두 관리해야 하고, 호출당 비용·지연이 늘어난다.

### ADR-003: Supabase + pgvector 팀 네임스페이스
**결정**: 문서와 임베딩을 Supabase Postgres에 저장하고, pgvector HNSW 인덱스와 `match_documents` 함수로 팀 범위 코사인 유사도 검색을 수행한다.
**이유**: 별도 벡터 DB 없이 관계형 데이터와 벡터를 한 곳에서 관리. `team_id` 컬럼으로 팀 간 데이터를 격리한다.
**트레이드오프**: 인증 없이 service-role 키를 서버에서만 사용 — slug를 알면 팀 데이터에 접근 가능(MVP에서 의도한 범위).
