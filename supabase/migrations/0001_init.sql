-- Micro-RAG 초기 스키마: 팀 네임스페이스 + 임베딩 문서 + 벡터 검색 함수

create extension if not exists vector;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  raw_input text not null,
  category text not null,
  structured jsonb not null,
  content text not null,
  embedding vector (1536),
  created_at timestamptz not null default now()
);

create index if not exists documents_team_id_idx on documents (team_id);
create index if not exists documents_embedding_idx
  on documents using hnsw (embedding vector_cosine_ops);

-- 팀 네임스페이스 내 코사인 유사도 검색
create or replace function match_documents (
  query_embedding vector (1536),
  p_team_id uuid,
  match_count int
)
returns table (
  id uuid,
  content text,
  category text,
  structured jsonb,
  distance float
)
language sql
stable
as $$
  select
    d.id,
    d.content,
    d.category,
    d.structured,
    d.embedding <=> query_embedding as distance
  from documents d
  where d.team_id = p_team_id
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
