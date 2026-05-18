import OpenAI from "openai";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, getEnv } from "./config";

let cached: OpenAI | null = null;

function getClient(): OpenAI {
  if (!cached) {
    cached = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });
  }
  return cached;
}

/**
 * 단일 텍스트를 임베딩 벡터로 변환한다.
 * RAG 주입(문서)과 조회(질문) 양쪽에서 동일 모델로 호출해 공간을 일치시킨다.
 */
export async function embed(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text");
  }

  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return res.data[0].embedding;
}
