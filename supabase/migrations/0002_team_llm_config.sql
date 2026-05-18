-- 팀별 LLM 프로바이더·모델 오버라이드 컬럼 추가
-- null = 전역 기본값(환경변수) 사용

alter table teams
  add column if not exists llm_provider text
    check (llm_provider in ('anthropic', 'openai')),
  add column if not exists llm_model text;
