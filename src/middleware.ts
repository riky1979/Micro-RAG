import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "어드민 기능이 비활성화되어 있습니다." }, { status: 503 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin-token")?.value;
  if (token !== adminSecret) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
