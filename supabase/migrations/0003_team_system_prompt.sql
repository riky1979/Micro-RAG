-- 팀별 커스텀 시스템 프롬프트 컬럼 추가
-- null = 기본 프롬프트(prompts.ts ANSWER_SYSTEM) 사용

alter table teams
  add column if not exists system_prompt text;
