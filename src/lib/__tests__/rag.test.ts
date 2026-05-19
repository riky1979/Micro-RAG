import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../llm", () => ({ getProviderForTeam: vi.fn() }));
vi.mock("../openai", () => ({ embed: vi.fn() }));
vi.mock("../teams", () => ({ requireTeam: vi.fn() }));
vi.mock("../supabase", () => ({ getSupabase: vi.fn() }));

import { getProviderForTeam } from "../llm";
import { embed } from "../openai";
import { answerQuestion, injectDocument, listRecentDocuments } from "../rag";
import { getSupabase } from "../supabase";
import { requireTeam } from "../teams";
import type { StructuredDoc } from "../types";

const TEAM = {
  id: "team-1",
  slug: "club",
  name: "Club",
  created_at: "2026-05-19",
  llm_provider: null,
  llm_model: null,
};

const STRUCTURED: StructuredDoc = {
  category: "schedule",
  title: "합주 일정 변경",
  summary: "토요일 오후 3시 사당 연습실 A룸에서 합주합니다.",
  entities: { 장소: "사당 연습실 A룸" },
  effective_date: null,
};

let mockStructureInput: ReturnType<typeof vi.fn>;
let mockGenerateAnswer: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();

  mockStructureInput = vi.fn();
  mockGenerateAnswer = vi.fn();

  vi.mocked(requireTeam).mockResolvedValue(TEAM);
  vi.mocked(embed).mockResolvedValue([0.1, 0.2, 0.3]);
  vi.mocked(getProviderForTeam).mockReturnValue({
    structureInput: mockStructureInput,
    generateAnswer: mockGenerateAnswer,
    generateAnswerStream: vi.fn(),
  });
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
    mockStructureInput.mockResolvedValue(STRUCTURED);
    const { insert } = mockInsert();

    const result = await injectDocument("club", "이번 주 합주 토요일 3시 사당으로 변경");

    expect(result).toEqual({
      id: "doc-1",
      content: expect.stringContaining("합주 일정 변경"),
      structured: STRUCTURED,
    });
    expect(mockStructureInput).toHaveBeenCalledWith("이번 주 합주 토요일 3시 사당으로 변경");

    const embeddedText = vi.mocked(embed).mock.calls[0][0];
    expect(embeddedText).toContain("장소: 사당 연습실 A룸");

    const payload = insert.mock.calls[0][0];
    expect(payload).toMatchObject({
      team_id: "team-1",
      category: "schedule",
      raw_input: "이번 주 합주 토요일 3시 사당으로 변경",
      embedding: [0.1, 0.2, 0.3],
    });
  });

  test("저장 실패 시 에러를 던진다", async () => {
    mockStructureInput.mockResolvedValue(STRUCTURED);
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "db down" } });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }),
      }),
    } as never);

    await expect(injectDocument("club", "텍스트")).rejects.toThrow("문서 저장 실패");
  });

  test("embed 실패 시 에러를 전파한다", async () => {
    mockStructureInput.mockResolvedValue(STRUCTURED);
    vi.mocked(embed).mockRejectedValue(new Error("OpenAI 오류"));

    await expect(injectDocument("club", "텍스트")).rejects.toThrow("OpenAI 오류");
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
    mockGenerateAnswer.mockResolvedValue("토요일 오후 3시 사당 연습실 A룸입니다.");

    const result = await answerQuestion("club", "이번 주 어디서 모여?");

    expect(rpc).toHaveBeenCalledWith("match_documents", {
      query_embedding: [0.1, 0.2, 0.3],
      p_team_id: "team-1",
      match_count: 5,
    });
    expect(mockGenerateAnswer).toHaveBeenCalledWith(
      "이번 주 어디서 모여?",
      expect.arrayContaining([expect.objectContaining({ id: "doc-1", distance: 0.12 })]),
    );
    expect(result.answer).toBe("토요일 오후 3시 사당 연습실 A룸입니다.");
    expect(result.sources).toHaveLength(1);
  });

  test("검색 결과가 없어도 빈 출처로 답변 생성을 호출한다", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc } as never);
    mockGenerateAnswer.mockResolvedValue("아직 그 정보는 등록되지 않았어요.");

    const result = await answerQuestion("club", "주차장 있어?");

    expect(mockGenerateAnswer).toHaveBeenCalledWith("주차장 있어?", []);
    expect(result.sources).toEqual([]);
  });

  test("RPC 실패 시 에러를 던진다", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "rpc failed" } });
    vi.mocked(getSupabase).mockReturnValue({ rpc } as never);

    await expect(answerQuestion("club", "질문")).rejects.toThrow("벡터 검색 실패");
  });
});

describe("listRecentDocuments", () => {
  const DOC = {
    id: "d1",
    team_id: "team-1",
    raw_input: "원문",
    category: "schedule",
    structured: STRUCTURED,
    content: "내용",
    created_at: "2026-05-01",
  };

  test("팀의 최근 문서 목록을 반환한다", async () => {
    const limit = vi.fn().mockResolvedValue({ data: [DOC], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(getSupabase).mockReturnValue({ from: vi.fn().mockReturnValue({ select }) } as never);

    const result = await listRecentDocuments("club");

    expect(result).toEqual([DOC]);
    expect(limit).toHaveBeenCalledWith(10);
  });

  test("limit 파라미터를 그대로 전달한다", async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(getSupabase).mockReturnValue({ from: vi.fn().mockReturnValue({ select }) } as never);

    await listRecentDocuments("club", 3);

    expect(limit).toHaveBeenCalledWith(3);
  });

  test("DB 오류 시 에러를 던진다", async () => {
    const limit = vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(getSupabase).mockReturnValue({ from: vi.fn().mockReturnValue({ select }) } as never);

    await expect(listRecentDocuments("club")).rejects.toThrow("문서 목록 조회 실패");
  });
});
