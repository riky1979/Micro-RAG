import { NextResponse } from "next/server";
import { getEnv } from "@/lib/config";

export async function GET() {
  const env = getEnv();
  return NextResponse.json({
    defaultProvider: env.DEFAULT_LLM_PROVIDER,
    defaultAnthropicModel: env.ANTHROPIC_MODEL,
    defaultOpenaiModel: env.OPENAI_CHAT_MODEL,
  });
}
