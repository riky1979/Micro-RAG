import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { buildCookieHeader, signSession } from "@/lib/auth";
import { createTeam } from "@/lib/teams";
import { createTeamSchema } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { slug, name, operatorPasscode, memberPasscode } =
      createTeamSchema.parse(await req.json());
    const team = await createTeam(slug, name, operatorPasscode, memberPasscode);
    const cookie = buildCookieHeader(slug, await signSession(slug, "operator"));
    return NextResponse.json(
      { team },
      { status: 201, headers: { "Set-Cookie": cookie } },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
