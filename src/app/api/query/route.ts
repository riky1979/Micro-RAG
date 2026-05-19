import { errorResponse } from "@/lib/api";
import { streamAnswer } from "@/lib/rag";
import { queryRequestSchema } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { teamSlug, question } = queryRequestSchema.parse(await req.json());
    return await streamAnswer(teamSlug, question);
  } catch (err) {
    return errorResponse(err);
  }
}
