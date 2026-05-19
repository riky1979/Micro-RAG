import OpenAI from "openai";
import { getEnv } from "../config";
import type { LLMProvider } from "../llm";
import { ANSWER_SYSTEM, STRUCTURE_SYSTEM } from "../prompts";
import { structuredDocSchema, type RetrievedSource, type StructuredDoc } from "../types";

// entities를 strict 모드에서 지원하려면 배열로 표현 후 변환한다
const STRUCTURE_SCHEMA = {
  type: "object" as const,
  properties: {
    category: {
      type: "string" as const,
      enum: ["schedule", "finance", "member", "resource", "general"] as const,
    },
    title: { type: "string" as const },
    summary: { type: "string" as const },
    entities: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          key: { type: "string" as const },
          value: { type: "string" as const },
        },
        required: ["key", "value"] as const,
        additionalProperties: false as const,
      },
    },
    effective_date: {
      anyOf: [{ type: "string" as const }, { type: "null" as const }],
    },
  },
  required: ["category", "title", "summary", "entities", "effective_date"] as const,
  additionalProperties: false as const,
};

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });
  }
  return cachedClient;
}

export class OpenAIProvider implements LLMProvider {
  constructor(private readonly model: string) {}

  async structureInput(text: string): Promise<StructuredDoc> {
    const res = await getClient().chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: STRUCTURE_SYSTEM },
        { role: "user", content: text },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "structured_doc", strict: true, schema: STRUCTURE_SCHEMA },
      },
    });

    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI가 입력을 구조화하지 못했습니다.");

    const raw = JSON.parse(content) as {
      category: string;
      title: string;
      summary: string;
      entities: Array<{ key: string; value: string }>;
      effective_date: string | null;
    };
    const entities = Object.fromEntries(raw.entities.map((e) => [e.key, e.value]));
    return structuredDocSchema.parse({ ...raw, entities });
  }

  async generateAnswer(question: string, sources: RetrievedSource[]): Promise<string> {
    const context = sources.length
      ? sources.map((s, i) => `[${i + 1}] (${s.category}) ${s.content}`).join("\n")
      : "(등록된 관련 정보 없음)";

    const res = await getClient().chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: ANSWER_SYSTEM },
        {
          role: "user",
          content: `다음은 우리 모임의 등록된 정보입니다.\n\n${context}\n\n---\n질문: ${question}`,
        },
      ],
    });

    return res.choices[0]?.message?.content?.trim() ?? "";
  }

  generateAnswerStream(question: string, sources: RetrievedSource[]): ReadableStream<string> {
    const context = sources.length
      ? sources.map((s, i) => `[${i + 1}] (${s.category}) ${s.content}`).join("\n")
      : "(등록된 관련 정보 없음)";

    const streamPromise = getClient().chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: "system", content: ANSWER_SYSTEM },
        {
          role: "user",
          content: `다음은 우리 모임의 등록된 정보입니다.\n\n${context}\n\n---\n질문: ${question}`,
        },
      ],
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          const stream = await streamPromise;
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(text);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }
}
