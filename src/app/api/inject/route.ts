import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { injectDocument } from "@/lib/rag";
import { injectRequestSchema } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { teamSlug, text } = injectRequestSchema.parse(await req.json());
    const result = await injectDocument(teamSlug, text);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
