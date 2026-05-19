import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { answerQuestion } from "@/lib/rag";
import { queryRequestSchema } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { teamSlug, question } = queryRequestSchema.parse(await req.json());
    await requireRole(req, teamSlug, "member");
    const result = await answerQuestion(teamSlug, question);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
