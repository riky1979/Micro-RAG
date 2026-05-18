import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { createTeam } from "@/lib/teams";
import { createTeamSchema } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { slug, name } = createTeamSchema.parse(await req.json());
    const team = await createTeam(slug, name);
    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
