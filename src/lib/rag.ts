import { MATCH_COUNT } from "./config";
import { getProviderForTeam } from "./llm";
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
  const provider = getProviderForTeam(team);

  const structured = await provider.structureInput(text);
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
  const provider = getProviderForTeam(team);

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

  const answer = await provider.generateAnswer(question, sources);
  return { answer, sources };
}

/** 팀 소속 문서 하나를 삭제한다. 팀 소속이 아닌 문서는 404. */
export async function deleteDocument(teamSlug: string, documentId: string): Promise<void> {
  const team = await requireTeam(teamSlug);

  const { error, count } = await getSupabase()
    .from("documents")
    .delete({ count: "exact" })
    .eq("id", documentId)
    .eq("team_id", team.id);

  if (error) throw new Error(`문서 삭제 실패: ${error.message}`);
  if (count === 0) throw new Error("문서를 찾을 수 없습니다.");
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
