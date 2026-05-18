import { generateAnswer, structureInput } from "../anthropic";
import type { LLMProvider } from "../llm";
import type { RetrievedSource, StructuredDoc } from "../types";

export class AnthropicProvider implements LLMProvider {
  constructor(private readonly model: string) {}

  structureInput(text: string): Promise<StructuredDoc> {
    return structureInput(text, this.model);
  }

  generateAnswer(question: string, sources: RetrievedSource[]): Promise<string> {
    return generateAnswer(question, sources, this.model);
  }
}
