import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getEnv } from "./config";
import { ANSWER_SYSTEM, STRUCTURE_SYSTEM } from "./prompts";
import { structuredDocSchema, type RetrievedSource, type StructuredDoc } from "./types";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (!cached) {
    cached = new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });
  }
  return cached;
}

/** 비정형 텍스트를 구조화 레코드로 변환한다. */
export async function structureInput(
  text: string,
  model?: string,
  onUsage?: (input: number, output: number) => void,
): Promise<StructuredDoc> {
  const resolvedModel = model ?? getEnv().ANTHROPIC_MODEL;
  const res = await getClient().messages.parse({
    model: resolvedModel,
    max_tokens: 1024,
    system: [{ type: "text", text: STRUCTURE_SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { format: zodOutputFormat(structuredDocSchema) },
    messages: [{ role: "user", content: text }],
  });

  if (!res.parsed_output) {
    throw new Error("Claude가 입력을 구조화하지 못했습니다.");
  }
  onUsage?.(res.usage.input_tokens, res.usage.output_tokens);
  return res.parsed_output;
}

/** 회수된 출처 문서를 근거로 질문에 답한다. */
export async function generateAnswer(
  question: string,
  sources: RetrievedSource[],
  model?: string,
  systemPrompt?: string,
  onUsage?: (input: number, output: number) => void,
): Promise<string> {
  const resolvedModel = model ?? getEnv().ANTHROPIC_MODEL;
  const resolvedSystem = systemPrompt ?? ANSWER_SYSTEM;
  const context = sources.length
    ? sources
        .map((s, i) => `[${i + 1}] (${s.category}) ${s.content}`)
        .join("\n")
    : "(등록된 관련 정보 없음)";

  const res = await getClient().messages.create({
    model: resolvedModel,
    max_tokens: 1024,
    system: [{ type: "text", text: resolvedSystem, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `다음은 우리 모임의 등록된 정보입니다.\n\n${context}\n\n---\n질문: ${question}`,
      },
    ],
  });

  onUsage?.(res.usage.input_tokens, res.usage.output_tokens);
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}
