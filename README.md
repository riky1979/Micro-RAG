# Micro-RAG

소규모 모임·소상공인 전용 비공개 지식베이스. 비정형 한국어 메시지 한 줄을 던지면 AI가 구조화해 저장하고, 멤버 누구나 자연어로 물어볼 수 있다.

## 무엇을 해결하나

회비 현황, 합주 일정, 창고 재고처럼 범용 AI가 절대 모르는 '극도로 사적인 실시간 데이터'를 팀 단위로 학습시키고 검색한다. 운영진은 공지·영수증·일정 변경을 텍스트로 툭 던지고, 멤버는 등록된 정보를 자연어로 조회한다.

## 빠른 시작

1. 의존성 설치: `npm install`
2. `.env.example`를 `.env.local`로 복사하고 키 입력
3. Supabase 프로젝트에 `supabase/migrations/` 안의 SQL을 순서대로 적용 (`0001_init.sql` → `0002_auth.sql`)
4. 개발 서버 실행: `npm run dev`

## 환경 변수

| 변수 | 용도 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude 구조화·답변 생성 |
| `ANTHROPIC_MODEL` | 선택. 기본 `claude-sonnet-4-6` |
| `OPENAI_API_KEY` | 임베딩 전용 (`text-embedding-3-small`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 DB 키 — 클라이언트 번들 노출 금지 |
| `AUTH_SECRET` | 세션 쿠키 서명 시크릿(32자+). 예: `openssl rand -hex 32` |

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | Vitest 단위 테스트 |
| `npm run test:e2e` | Playwright E2E 테스트 |
| `npm run lint` | ESLint |

## 핵심 흐름

```
주입:  운영진 텍스트 → Claude 구조화 → OpenAI 임베딩 → Supabase 저장
조회:  멤버 질문 → OpenAI 임베딩 → pgvector 팀 범위 검색 → Claude 답변
```

## 문서

| 주제 | 문서 |
|---|---|
| 제품 목표, 사용자, 핵심 기능, MVP 범위 | `docs/PRD.md` |
| 디렉토리 구조, 데이터 흐름, 상태 관리 패턴 | `docs/ARCHITECTURE.md` |
| 기술 선택 배경과 트레이드오프 | `docs/ADR.md` |
| UI 디자인 원칙, 색상·컴포넌트 토큰 | `docs/UI_GUIDE.md` |

## 기술 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase(Postgres + pgvector) · Anthropic SDK · OpenAI SDK · Zod · Vitest · Playwright
