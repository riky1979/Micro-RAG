import { describe, expect, test } from "vitest";
import { AppError, badRequest, conflict, notFound } from "../errors";

describe("AppError", () => {
  test("status와 message를 보유한다", () => {
    const err = new AppError(422, "처리 불가");
    expect(err.status).toBe(422);
    expect(err.message).toBe("처리 불가");
    expect(err.name).toBe("AppError");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("에러 헬퍼", () => {
  test("notFound는 404 AppError를 반환한다", () => {
    const err = notFound("찾을 수 없음");
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(404);
    expect(err.message).toBe("찾을 수 없음");
  });

  test("conflict는 409 AppError를 반환한다", () => {
    const err = conflict("이미 존재함");
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(409);
    expect(err.message).toBe("이미 존재함");
  });

  test("badRequest는 400 AppError를 반환한다", () => {
    const err = badRequest("잘못된 요청");
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("잘못된 요청");
  });
});
