import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../supabase", () => ({ getSupabase: vi.fn() }));
vi.mock("../auth", () => ({
  hashPasscode: vi.fn(async (p: string) => `hashed:${p}`),
}));

import { getSupabase } from "../supabase";
import { createTeam, getTeamBySlug, getTeamSecrets, requireTeam } from "../teams";

const TEAM = { id: "t1", slug: "my-team", name: "My Team", created_at: "2026-01-01" };

beforeEach(() => vi.clearAllMocks());

function mockMaybeSingle(
  data: unknown,
  error: { message: string } | null = null,
) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  vi.mocked(getSupabase).mockReturnValue({
    from: vi.fn().mockReturnValue({ select }),
  } as never);
  return { maybeSingle, select };
}

describe("getTeamBySlug", () => {
  test("슬러그로 팀을 반환한다", async () => {
    mockMaybeSingle(TEAM);
    expect(await getTeamBySlug("my-team")).toEqual(TEAM);
  });

  test("존재하지 않는 슬러그는 null을 반환한다", async () => {
    mockMaybeSingle(null);
    expect(await getTeamBySlug("ghost")).toBeNull();
  });

  test("public 컬럼만 SELECT한다(해시 누설 방지)", async () => {
    const { select } = mockMaybeSingle(TEAM);
    await getTeamBySlug("my-team");
    expect(select).toHaveBeenCalledWith("id, slug, name, created_at");
  });

  test("DB 오류 시 에러를 던진다", async () => {
    mockMaybeSingle(null, { message: "connection refused" });
    await expect(getTeamBySlug("my-team")).rejects.toThrow("팀 조회 실패");
  });
});

describe("requireTeam", () => {
  test("팀이 있으면 반환한다", async () => {
    mockMaybeSingle(TEAM);
    expect(await requireTeam("my-team")).toEqual(TEAM);
  });

  test("팀이 없으면 404 AppError를 던진다", async () => {
    mockMaybeSingle(null);
    await expect(requireTeam("ghost")).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining("ghost"),
    });
  });
});

describe("getTeamSecrets", () => {
  test("패스코드 해시 컬럼만 조회한다", async () => {
    const SECRETS = {
      operator_passcode_hash: "h1",
      member_passcode_hash: "h2",
    };
    const { select } = mockMaybeSingle(SECRETS);
    expect(await getTeamSecrets("my-team")).toEqual(SECRETS);
    expect(select).toHaveBeenCalledWith(
      "operator_passcode_hash, member_passcode_hash",
    );
  });

  test("없는 팀이면 null", async () => {
    mockMaybeSingle(null);
    expect(await getTeamSecrets("ghost")).toBeNull();
  });
});

describe("createTeam", () => {
  test("패스코드 해시와 함께 새 팀을 생성한다", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const selectForGet = vi.fn().mockReturnValue({ eq });

    const single = vi.fn().mockResolvedValue({ data: TEAM, error: null });
    const selectForInsert = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: selectForInsert });

    vi.mocked(getSupabase)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ select: selectForGet }),
      } as never)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ insert }),
      } as never);

    const result = await createTeam("new-team", "New Team", "opPass1", "memPass1");
    expect(result).toEqual(TEAM);
    expect(insert).toHaveBeenCalledWith({
      slug: "new-team",
      name: "New Team",
      operator_passcode_hash: "hashed:opPass1",
      member_passcode_hash: "hashed:memPass1",
    });
  });

  test("슬러그 중복이면 409 AppError를 던진다", async () => {
    mockMaybeSingle(TEAM);
    await expect(
      createTeam("my-team", "다른 팀", "op-pass", "mem-pass"),
    ).rejects.toMatchObject({ status: 409 });
  });

  test("DB insert 오류 시 에러를 던진다", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const selectForGet = vi.fn().mockReturnValue({ eq });

    const single = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "insert failed" } });
    const selectForInsert = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: selectForInsert });

    vi.mocked(getSupabase)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ select: selectForGet }),
      } as never)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({ insert }),
      } as never);

    await expect(
      createTeam("new-team", "New Team", "op-pass", "mem-pass"),
    ).rejects.toThrow("팀 생성 실패");
  });
});
