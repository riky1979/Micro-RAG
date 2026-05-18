import { describe, expect, test } from "vitest";
import {
  injectRequestSchema,
  queryRequestSchema,
  structuredDocSchema,
  teamSlugSchema,
} from "../types";

describe("teamSlugSchema", () => {
  test("영소문자·숫자·하이픈 slug를 허용한다", () => {
    expect(teamSlugSchema.safeParse("orchestra-2026").success).toBe(true);
  });

  test("대문자·공백·특수문자를 거부한다", () => {
    expect(teamSlugSchema.safeParse("Orchestra").success).toBe(false);
    expect(teamSlugSchema.safeParse("my team").success).toBe(false);
    expect(teamSlugSchema.safeParse("팀").success).toBe(false);
  });

  test("2자 미만을 거부한다", () => {
    expect(teamSlugSchema.safeParse("a").success).toBe(false);
  });
});

describe("structuredDocSchema", () => {
  test("유효한 구조화 레코드를 통과시킨다", () => {
    const result = structuredDocSchema.safeParse({
      category: "finance",
      title: "뒷풀이 정산",
      summary: "오늘 뒷풀이 비용은 총 12만원이며 6명이 2만원씩 정산합니다.",
      entities: { 금액: "120000", 인원: "6" },
      effective_date: "2026-05-19",
    });
    expect(result.success).toBe(true);
  });

  test("정의되지 않은 category를 거부한다", () => {
    const result = structuredDocSchema.safeParse({
      category: "unknown",
      title: "x",
      summary: "y",
      entities: {},
      effective_date: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("injectRequestSchema", () => {
  test("빈 텍스트를 거부한다", () => {
    expect(injectRequestSchema.safeParse({ teamSlug: "club", text: "   " }).success).toBe(false);
  });

  test("유효한 주입 요청을 통과시킨다", () => {
    expect(
      injectRequestSchema.safeParse({ teamSlug: "club", text: "합주 일정 변경" }).success,
    ).toBe(true);
  });
});

describe("queryRequestSchema", () => {
  test("빈 질문을 거부한다", () => {
    expect(queryRequestSchema.safeParse({ teamSlug: "club", question: "" }).success).toBe(false);
  });

  test("유효한 질문 요청을 통과시킨다", () => {
    expect(
      queryRequestSchema.safeParse({ teamSlug: "club", question: "이번 주 어디서 모여?" }).success,
    ).toBe(true);
  });
});
