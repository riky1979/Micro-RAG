import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { updateTeamModel } from "@/lib/teams";

const updateModelSchema = z.object({
  llm_provider: z.enum(["anthropic", "openai"]).nullable(),
  llm_model: z.string().min(1).nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = updateModelSchema.parse(await req.json());
    const team = await updateTeamModel(slug, body.llm_provider, body.llm_model);
    return NextResponse.json({ team });
  } catch (err) {
    return errorResponse(err);
  }
}
