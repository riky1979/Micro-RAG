import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { updateTeamSettings } from "@/lib/teams";

const updateSchema = z.object({
  llm_provider: z.enum(["anthropic", "openai"]).nullable(),
  llm_model: z.string().min(1).nullable(),
  system_prompt: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = updateSchema.parse(await req.json());
    const team = await updateTeamSettings(slug, {
      llm_provider: body.llm_provider,
      llm_model: body.llm_model,
      system_prompt: body.system_prompt ?? null,
    });
    return NextResponse.json({ team });
  } catch (err) {
    return errorResponse(err);
  }
}
