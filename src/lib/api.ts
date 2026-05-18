import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

/** 모든 API route에서 공유하는 에러 → JSON 응답 매핑. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? "잘못된 요청입니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (err instanceof SyntaxError) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  console.error("[api] unhandled error:", err);
  return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
}
