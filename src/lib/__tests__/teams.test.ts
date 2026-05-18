import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../supabase", () => ({ getSupabase: vi.fn() }));

import { getSupabase } from "../supabase";
import { AppError } from "../errors";
import { createTeam, getTeamBySlug, requireTeam } from "../teams";

const TEAM = { id: "t1", slug: "my-team", name: "My Team", created_at: "2026-01-01" };

beforeEach(() => vi.clearAllMocks());

function mockMaybySingle(data: typeof TEAM | null, error: { message: string } | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  vi.mocked(getSupabase).mockReturnValue({ from: vi.fn().mockReturnValue({ select }) } as never);
  return { maybeSingle };
}

describe("getTeamBySlug", () => {
  test("슬러그로 팀을 반환한다", async () => {
    mockMaybySingle(TEAM);
    expect(await getTeamBySlug("my-team")).toEqual(TEAM);
  });

  test("존재하지 않는 슬러그는 null을 반환한다", async () => {
    mockMaybySingle(null);
    expect(await getTeamBySlug("ghost")).toBeNull();
  });

  test("DB 오류 시 에러를 던진다", async () => {
    mockMaybySingle(null, { message: "connection refused" });
    await expect(getTeamBySlug("my-team")).rejects.toThrow("팀 조회 실패");
  });
});

describe("requireTeam", () => {
  test("팀이 있으면 반환한다", async () => {
    mockMaybySingle(TEAM);
    expect(await requireTeam("my-team")).toEqual(TEAM);
  });

  test("팀이 없으면 404 AppError를 던진다", async () => {
    mockMaybySingle(null);
    await expect(requireTeam("ghost")).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining("ghost"),
    });
  });
});

describe("createTeam", () => {
  test("새 팀을 생성하고 반환한다", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const selectForGet = vi.fn().mockReturnValue({ eq });

    const single = vi.fn().mockResolvedValue({ data: TEAM, error: null });
    const selectForInsert = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: selectForInsert });

    vi.mocked(getSupabase)
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ select: selectForGet }) } as never)
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ insert }) } as never);

    const result = await createTeam("new-team", "New Team");
    expect(result).toEqual(TEAM);
    expect(insert).toHaveBeenCalledWith({ slug: "new-team", name: "New Team" });
  });

  test("슬러그 중복이면 409 AppError를 던진다", async () => {
    mockMaybySingle(TEAM);
    await expect(createTeam("my-team", "다른 팀")).rejects.toMatchObject({ status: 409 });
  });

  test("DB insert 오류 시 에러를 던진다", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const selectForGet = vi.fn().mockReturnValue({ eq });

    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "insert failed" } });
    const selectForInsert = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: selectForInsert });

    vi.mocked(getSupabase)
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ select: selectForGet }) } as never)
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ insert }) } as never);

    await expect(createTeam("new-team", "New Team")).rejects.toThrow("팀 생성 실패");
  });
});
