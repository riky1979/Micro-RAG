import Anthropic from "@anthropic-ai/sdk";
import { generateAnswer, structureInput } from "../anthropic";
import { getEnv } from "../config";
import type { LLMProvider } from "../llm";
import { ANSWER_SYSTEM } from "../prompts";
import type { RetrievedSource, StructuredDoc } from "../types";

let cachedStreamClient: Anthropic | null = null;
function getStreamClient(): Anthropic {
  if (!cachedStreamClient) cachedStreamClient = new Anthropic({ apiKey: getEnv().ANTHROPIC_API_KEY });
  return cachedStreamClient;
}

function buildUserMessage(question: string, sources: RetrievedSource[]): string {
  const context = sources.length
    ? sources.map((s, i) => `[${i + 1}] (${s.category}) ${s.content}`).join("\n")
    : "(등록된 관련 정보 없음)";
  return `다음은 우리 모임의 등록된 정보입니다.\n\n${context}\n\n---\n질문: ${question}`;
}

export class AnthropicProvider implements LLMProvider {
  constructor(private readonly model: string) {}

  structureInput(text: string): Promise<StructuredDoc> {
    return structureInput(text, this.model);
  }

  generateAnswer(question: string, sources: RetrievedSource[]): Promise<string> {
    return generateAnswer(question, sources, this.model);
  }

  generateAnswerStream(question: string, sources: RetrievedSource[]): ReadableStream<string> {
    const sdkStream = getStreamClient().messages.stream({
      model: this.model,
      max_tokens: 1024,
      system: [{ type: "text", text: ANSWER_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserMessage(question, sources) }],
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const text of sdkStream.textStream) {
            controller.enqueue(text);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }
}
