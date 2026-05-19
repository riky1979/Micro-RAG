-- API 호출당 토큰 사용량 기록 테이블

create table if not exists api_usage (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams (id) on delete cascade,
  provider   text not null,
  model      text not null,
  operation  text not null check (operation in ('structure', 'answer')),
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists api_usage_team_id_idx  on api_usage (team_id);
create index if not exists api_usage_created_at_idx on api_usage (created_at);
