import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

import { errorResponse } from "../api";
import { AppError } from "../errors";

describe("errorResponse", () => {
  test("AppError → 해당 status와 error 메시지", () => {
    const res = errorResponse(new AppError(409, "슬러그가 이미 존재합니다")) as {
      body: unknown;
      status: number;
    };
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "슬러그가 이미 존재합니다" });
  });

  test("ZodError → 400과 첫 번째 이슈 메시지", () => {
    const zodErr = z.string().min(1, "필수 항목입니다").safeParse("").error!;
    const res = errorResponse(zodErr) as { body: unknown; status: number };
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "필수 항목입니다" });
  });

  test("SyntaxError → 400과 형식 오류 메시지", () => {
    const res = errorResponse(new SyntaxError("Unexpected token")) as {
      body: unknown;
      status: number;
    };
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "요청 형식이 올바르지 않습니다." });
  });

  test("알 수 없는 에러 → 500", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = errorResponse(new Error("db exploded")) as {
      body: unknown;
      status: number;
    };
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "서버 오류가 발생했습니다." });
    consoleSpy.mockRestore();
  });
});
