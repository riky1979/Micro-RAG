import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import {
  buildCookieHeader,
  type Role,
  signSession,
  verifyPasscode,
} from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getTeamSecrets } from "@/lib/teams";
import { authRequestSchema } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { teamSlug, passcode } = authRequestSchema.parse(await req.json());
    const secrets = await getTeamSecrets(teamSlug);
    if (!secrets) throw new AppError(404, `'${teamSlug}' 팀을 찾을 수 없습니다.`);

    let role: Role | null = null;
    if (await verifyPasscode(passcode, secrets.operator_passcode_hash)) {
      role = "operator";
    } else if (await verifyPasscode(passcode, secrets.member_passcode_hash)) {
      role = "member";
    }
    if (!role) throw new AppError(401, "패스코드가 올바르지 않습니다.");

    const cookie = buildCookieHeader(teamSlug, await signSession(teamSlug, role));
    return NextResponse.json({ role }, { headers: { "Set-Cookie": cookie } });
  } catch (err) {
    return errorResponse(err);
  }
}
