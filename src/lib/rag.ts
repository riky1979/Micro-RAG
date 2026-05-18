import { generateAnswer, structureInput } from "./anthropic";
import { MATCH_COUNT } from "./config";
import { embed } from "./openai";
import { buildContent } from "./structuring";
import { getSupabase } from "./supabase";
import { requireTeam } from "./teams";
import type {
  AnswerResult,
  Category,
  DocumentRecord,
  RetrievedSource,
  StructuredDoc,
} from "./types";

export interface InjectResult {
  id: string;
  content: string;
  structured: StructuredDoc;
}

/**
 * 데이터 주입: 비정형 텍스트 → Claude 구조화 → 임베딩 → Supabase 저장.
 */
export async function injectDocument(
  teamSlug: string,
  text: string,
): Promise<InjectResult> {
  const team = await requireTeam(teamSlug);

  const structured = await structureInput(text);
  const content = buildContent(structured);
  const embedding = await embed(content);

  const { data, error } = await getSupabase()
    .from("documents")
    .insert({
      team_id: team.id,
      raw_input: text,
      category: structured.category,
      structured,
      content,
      embedding,
    })
    .select("id")
    .single();

  if (error) throw new Error(`문서 저장 실패: ${error.message}`);

  return { id: (data as { id: string }).id, content, structured };
}

/**
 * 데이터 조회: 질문 임베딩 → 팀 네임스페이스 벡터 검색 → Claude 답변.
 */
export async function answerQuestion(
  teamSlug: string,
  question: string,
): Promise<AnswerResult> {
  const team = await requireTeam(teamSlug);

  const queryEmbedding = await embed(question);

  const { data, error } = await getSupabase().rpc("match_documents", {
    query_embedding: queryEmbedding,
    p_team_id: team.id,
    match_count: MATCH_COUNT,
  });

  if (error) throw new Error(`벡터 검색 실패: ${error.message}`);

  const sources: RetrievedSource[] = (data ?? []).map(
    (row: {
      id: string;
      content: string;
      category: Category;
      structured: StructuredDoc;
      distance: number;
    }) => ({
      id: row.id,
      content: row.content,
      category: row.category,
      structured: row.structured,
      distance: row.distance,
    }),
  );

  const answer = await generateAnswer(question, sources);
  return { answer, sources };
}

/** 주입 콘솔에 보여줄 최근 문서 목록. */
export async function listRecentDocuments(
  teamSlug: string,
  limit = 10,
): Promise<DocumentRecord[]> {
  const team = await requireTeam(teamSlug);

  const { data, error } = await getSupabase()
    .from("documents")
    .select("id, team_id, raw_input, category, structured, content, created_at")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`문서 목록 조회 실패: ${error.message}`);
  return (data as DocumentRecord[]) ?? [];
}
