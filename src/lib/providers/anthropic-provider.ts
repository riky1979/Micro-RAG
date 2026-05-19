import Anthropic from "@anthropic-ai/sdk";
import { generateAnswer, structureInput } from "../anthropic";
import { getEnv } from "../config";
import type { LLMProvider } from "../llm";
import { ANSWER_SYSTEM } from "../prompts";
import type { RetrievedSource, StructuredDoc } from "../types";
import type { UsageCallback } from "../usage";

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
  constructor(
    private readonly model: string,
    private readonly systemPrompt: string | null = null,
    private readonly onUsage?: UsageCallback,
  ) {}

  structureInput(text: string): Promise<StructuredDoc> {
    return structureInput(text, this.model, (input, output) => {
      this.onUsage?.({ provider: "anthropic", model: this.model, operation: "structure", input_tokens: input, output_tokens: output });
    });
  }

  generateAnswer(question: string, sources: RetrievedSource[]): Promise<string> {
    return generateAnswer(question, sources, this.model, this.systemPrompt ?? undefined, (input, output) => {
      this.onUsage?.({ provider: "anthropic", model: this.model, operation: "answer", input_tokens: input, output_tokens: output });
    });
  }

  generateAnswerStream(question: string, sources: RetrievedSource[]): ReadableStream<string> {
    const system = this.systemPrompt ?? ANSWER_SYSTEM;
    const onUsage = this.onUsage;
    const model = this.model;
    const sdkStream = getStreamClient().messages.stream({
      model,
      max_tokens: 1024,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildUserMessage(question, sources) }],
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const text of sdkStream.textStream) {
            controller.enqueue(text);
          }
          const finalMsg = await sdkStream.finalMessage();
          onUsage?.({ provider: "anthropic", model, operation: "answer", input_tokens: finalMsg.usage.input_tokens, output_tokens: finalMsg.usage.output_tokens });
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }
}
