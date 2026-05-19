import { getEnv } from "./config";
import { AnthropicProvider } from "./providers/anthropic-provider";
import { OpenAIProvider } from "./providers/openai-provider";
import type { RetrievedSource, StructuredDoc, Team } from "./types";
import { makeUsageCallback } from "./usage";

export interface LLMProvider {
  structureInput(text: string): Promise<StructuredDoc>;
  generateAnswer(question: string, sources: RetrievedSource[]): Promise<string>;
  generateAnswerStream(question: string, sources: RetrievedSource[]): ReadableStream<string>;
}

export function getProviderForTeam(team: Team): LLMProvider {
  const env = getEnv();
  const provider = team.llm_provider ?? env.DEFAULT_LLM_PROVIDER;
  const systemPrompt = team.system_prompt ?? null;
  const onUsage = makeUsageCallback(team.id);

  if (provider === "openai") {
    return new OpenAIProvider(team.llm_model ?? env.OPENAI_CHAT_MODEL, systemPrompt, onUsage);
  }
  return new AnthropicProvider(team.llm_model ?? env.ANTHROPIC_MODEL, systemPrompt, onUsage);
}
