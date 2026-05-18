import { describe, expect, test } from "vitest";
import { buildContent } from "../structuring";
import type { StructuredDoc } from "../types";

function doc(overrides: Partial<StructuredDoc> = {}): StructuredDoc {
  return {
    category: "schedule",
    title: "합주 일정 변경",
    summary: "이번 주 토요일 오후 3시 사당 연습실 A룸에서 합주합니다.",
    entities: { 장소: "사당 연습실 A룸", 시간: "토요일 오후 3시" },
    effective_date: null,
    ...overrides,
  };
}

describe("buildContent", () => {
  test("title과 summary를 모두 포함한다", () => {
    const content = buildContent(doc());
    expect(content).toContain("합주 일정 변경");
    expect(content).toContain("사당 연습실 A룸에서 합주합니다");
  });

  test("entity의 key-value 쌍을 평탄화해 덧붙인다", () => {
    const content = buildContent(doc());
    expect(content).toContain("장소: 사당 연습실 A룸");
    expect(content).toContain("시간: 토요일 오후 3시");
  });

  test("entity가 비어 있으면 entity 라인을 만들지 않는다", () => {
    const content = buildContent(doc({ entities: {} }));
    expect(content).toBe("합주 일정 변경\n이번 주 토요일 오후 3시 사당 연습실 A룸에서 합주합니다.");
  });

  test("결과는 앞뒤 공백 없이 trim된다", () => {
    const content = buildContent(doc({ title: "  제목  ", summary: "  요약  ", entities: {} }));
    expect(content).toBe("제목\n요약");
  });

  test("title이 summary와 같아도 중복 없이 한 번만 포함한다", () => {
    const content = buildContent(doc({ title: "회비 정산", summary: "회비 정산", entities: {} }));
    expect(content).toBe("회비 정산");
  });
});
