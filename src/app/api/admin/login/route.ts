import { NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({ secret: z.string().min(1) });

export async function POST(req: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "어드민 기능이 비활성화되어 있습니다." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "secret 필드가 필요합니다." }, { status: 400 });
  }

  if (parsed.data.secret !== adminSecret) {
    return NextResponse.json({ error: "비밀키가 올바르지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin-token", adminSecret, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin-token");
  return res;
}
