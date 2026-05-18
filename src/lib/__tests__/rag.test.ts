import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../anthropic", () => ({
  structureInput: vi.fn(),
  generateAnswer: vi.fn(),
}));
vi.mock("../openai", () => ({ embed: vi.fn() }));
vi.mock("../teams", () => ({ requireTeam: vi.fn() }));
vi.mock("../supabase", () => ({ getSupabase: vi.fn() }));

import { generateAnswer, structureInput } from "../anthropic";
import { embed } from "../openai";
import { answerQuestion, injectDocument } from "../rag";
import { getSupabase } from "../supabase";
import { requireTeam } from "../teams";
import type { StructuredDoc } from "../types";

const TEAM = { id: "team-1", slug: "club", name: "Club", created_at: "2026-05-19" };

const STRUCTURED: StructuredDoc = {
  category: "schedule",
  title: "합주 일정 변경",
  summary: "토요일 오후 3시 사당 연습실 A룸에서 합주합니다.",
  entities: { 장소: "사당 연습실 A룸" },
  effective_date: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireTeam).mockResolvedValue(TEAM);
  vi.mocked(embed).mockResolvedValue([0.1, 0.2, 0.3]);
});

describe("injectDocument", () => {
  function mockInsert() {
    const single = vi.fn().mockResolvedValue({ data: { id: "doc-1" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert }),
    } as never);
    return { insert };
  }

  test("구조화 → 임베딩 → 저장 후 id와 구조화 결과를 반환한다", async () => {
    vi.mocked(structureInput).mockResolvedValue(STRUCTURED);
    const { insert } = mockInsert();

    const result = await injectDocument("club", "이번 주 합주 토요일 3시 사당으로 변경");

    expect(result).toEqual({
      id: "doc-1",
      content: expect.stringContaining("합주 일정 변경"),
      structured: STRUCTURED,
    });
    expect(structureInput).toHaveBeenCalledWith("이번 주 합주 토요일 3시 사당으로 변경");

    // 임베딩은 buildContent 결과(평탄화 텍스트)로 호출되어야 한다
    const embeddedText = vi.mocked(embed).mock.calls[0][0];
    expect(embeddedText).toContain("장소: 사당 연습실 A룸");

    // insert payload 검증
    const payload = insert.mock.calls[0][0];
    expect(payload).toMatchObject({
      team_id: "team-1",
      category: "schedule",
      raw_input: "이번 주 합주 토요일 3시 사당으로 변경",
      embedding: [0.1, 0.2, 0.3],
    });
  });

  test("저장 실패 시 에러를 던진다", async () => {
    vi.mocked(structureInput).mockResolvedValue(STRUCTURED);
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "db down" } });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }),
      }),
    } as never);

    await expect(injectDocument("club", "텍스트")).rejects.toThrow("문서 저장 실패");
  });
});

describe("answerQuestion", () => {
  test("질문 임베딩 → 벡터 검색 → 답변 생성 흐름", async () => {
    const rows = [
      {
        id: "doc-1",
        content: "토요일 오후 3시 사당 연습실 A룸에서 합주합니다.",
        category: "schedule",
        structured: STRUCTURED,
        distance: 0.12,
      },
    ];
    const rpc = vi.fn().mockResolvedValue({ data: rows, error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc } as never);
    vi.mocked(generateAnswer).mockResolvedValue("토요일 오후 3시 사당 연습실 A룸입니다.");

    const result = await answerQuestion("club", "이번 주 어디서 모여?");

    expect(rpc).toHaveBeenCalledWith("match_documents", {
      query_embedding: [0.1, 0.2, 0.3],
      p_team_id: "team-1",
      match_count: 5,
    });
    expect(generateAnswer).toHaveBeenCalledWith(
      "이번 주 어디서 모여?",
      expect.arrayContaining([expect.objectContaining({ id: "doc-1", distance: 0.12 })]),
    );
    expect(result.answer).toBe("토요일 오후 3시 사당 연습실 A룸입니다.");
    expect(result.sources).toHaveLength(1);
  });

  test("검색 결과가 없어도 빈 출처로 답변 생성을 호출한다", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc } as never);
    vi.mocked(generateAnswer).mockResolvedValue("아직 그 정보는 등록되지 않았어요.");

    const result = await answerQuestion("club", "주차장 있어?");

    expect(generateAnswer).toHaveBeenCalledWith("주차장 있어?", []);
    expect(result.sources).toEqual([]);
  });
});
