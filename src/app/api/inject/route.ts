import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { deleteDocument, injectDocument } from "@/lib/rag";
import { deleteDocumentSchema, injectRequestSchema } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { teamSlug, text } = injectRequestSchema.parse(await req.json());
    const result = await injectDocument(teamSlug, text);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const { teamSlug, documentId } = deleteDocumentSchema.parse(await req.json());
    await deleteDocument(teamSlug, documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
