import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api";
import { deleteDocument } from "@/lib/rag";

const querySchema = z.object({ teamSlug: z.string().min(1) });

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const { teamSlug } = querySchema.parse({ teamSlug: searchParams.get("teamSlug") });
    await deleteDocument(teamSlug, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
