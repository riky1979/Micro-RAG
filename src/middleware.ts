import { NextResponse, type NextRequest } from "next/server";
import { cookieName, verifySession } from "@/lib/auth";

const SLUG_RE = /^[a-z0-9-]+$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [slug, second] = pathname.split("/").filter(Boolean);

  // 슬러그 패턴이 아닌 경로(정적 자원·잘못된 경로)는 통과시킨다.
  if (!slug || !SLUG_RE.test(slug)) return NextResponse.next();
  // 로그인 페이지 자체는 비로그인 접근 허용.
  if (second === "login") return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return new NextResponse("AUTH_SECRET not configured", { status: 500 });
  }

  const value = req.cookies.get(cookieName(slug))?.value;
  const role = await verifySession(value, slug, secret);
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = `/${slug}/login`;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/).*)"],
};
