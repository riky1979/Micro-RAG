# 아키텍처

## 디렉토리 구조
```
src/
├── app/                  # Next.js App Router: 페이지 + API 라우트
│   ├── page.tsx          # 랜딩 + 팀 생성
│   ├── [team]/           # 팀 허브 / inject / ask 페이지
│   └── api/              # teams · inject · query 라우트 핸들러
├── components/           # 클라이언트 UI 컴포넌트
└── lib/                  # 도메인 로직 + 외부 API 래퍼
    ├── rag.ts            # 주입/조회 오케스트레이션
    ├── anthropic.ts      # Claude 구조화·답변 생성
    ├── openai.ts         # 임베딩
    ├── supabase.ts       # 서버 전용 DB 클라이언트
    ├── teams.ts          # 팀 조회·생성
    ├── structuring.ts    # 구조화 레코드 → 검색 텍스트 평탄화
    ├── types.ts          # Zod 스키마 + 도메인 타입
    └── config.ts · errors.ts · api.ts · categories.ts
supabase/migrations/      # DB 스키마 + pgvector 검색 함수
tests/e2e/                # Playwright E2E
```

## 패턴
- **Server Components 기본.** 인터랙션(폼·채팅)이 필요한 곳만 Client Component.
- 외부 API 클라이언트는 모듈 단위 lazy 싱글톤 (`getClient()` / `getSupabase()`).
- 입력 검증은 Zod 스키마(`types.ts`)로 API 경계에서 일괄 처리.
- 도메인 에러는 `AppError`(HTTP status 동반) → `errorResponse()`가 JSON 응답으로 매핑.

## 데이터 흐름
```
주입:  운영진 텍스트 → POST /api/inject → injectDocument()
       → Claude 구조화 → buildContent() → OpenAI 임베딩 → Supabase documents

조회:  멤버 질문 → POST /api/query → answerQuestion()
       → OpenAI 임베딩 → match_documents()(pgvector, 팀 범위) → Claude 답변
```

## 상태 관리
- **서버 상태** — Server Components가 Supabase에서 직접 조회.
- **클라이언트 상태** — 폼·채팅 컴포넌트의 `useState` (전역 스토어 없음).
- **팀 격리** — 모든 문서는 `team_id`로 네임스페이스 분리, `match_documents` 함수가 팀 범위를 강제한다.
