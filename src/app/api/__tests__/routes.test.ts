import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body,
      status: init?.status ?? 200,
      headers: init?.headers ?? {},
    }),
  },
}));
vi.mock("@/lib/teams", () => ({
  createTeam: vi.fn(),
  getTeamSecrets: vi.fn(),
}));
vi.mock("@/lib/rag", () => ({
  injectDocument: vi.fn(),
  answerQuestion: vi.fn(),
  deleteDocument: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
  signSession: vi.fn(async (slug: string, role: string) => `${role}.sig-${slug}`),
  buildCookieHeader: vi.fn(
    (slug: string, value: string) => `mr_auth_${slug}=${value}; Path=/; HttpOnly`,
  ),
  verifyPasscode: vi.fn(),
}));

import { AppError } from "@/lib/errors";
import { requireRole, verifyPasscode } from "@/lib/auth";
import { createTeam, getTeamSecrets } from "@/lib/teams";
import { answerQuestion, deleteDocument, injectDocument } from "@/lib/rag";
import { POST as teamsPost } from "../teams/route";
import { POST as authPost } from "../auth/route";
import { DELETE as injectDelete, POST as injectPost } from "../inject/route";
import { POST as queryPost } from "../query/route";

type MockResponse = {
  body: unknown;
  status: number;
  headers: Record<string, string>;
};

function makeRequest(
  body: unknown,
  { method = "POST", cookie }: { method?: string; cookie?: string } = {},
): Request {
  return new Request("http://localhost", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

const TEAM = { id: "t1", slug: "club", name: "Club", created_at: "2026-01-01" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireRole).mockResolvedValue("operator");
});

describe("POST /api/teams", () => {
  const VALID = {
    slug: "club",
    name: "Club",
    operatorPasscode: "op-pass-1",
    memberPasscode: "mem-pass-1",
  };

  test("유효한 요청 → 201 + 팀 + 운영진 쿠키", async () => {
    vi.mocked(createTeam).mockResolvedValue(TEAM);
    const res = (await teamsPost(makeRequest(VALID))) as unknown as MockResponse;

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ team: TEAM });
    expect(createTeam).toHaveBeenCalledWith("club", "Club", "op-pass-1", "mem-pass-1");
    expect(res.headers["Set-Cookie"]).toContain("mr_auth_club=operator.sig-club");
  });

  test("패스코드 누락 → 400", async () => {
    const res = (await teamsPost(
      makeRequest({ slug: "club", name: "Club" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(400);
  });

  test("두 패스코드가 같으면 400", async () => {
    const res = (await teamsPost(
      makeRequest({ ...VALID, memberPasscode: "op-pass-1" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(400);
  });

  test("대문자·공백이 포함된 slug → 400", async () => {
    const res = (await teamsPost(
      makeRequest({ ...VALID, slug: "INVALID!" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(400);
  });

  test("중복 slug (AppError 409) → 409", async () => {
    vi.mocked(createTeam).mockRejectedValue(new AppError(409, "슬러그 중복"));
    const res = (await teamsPost(makeRequest(VALID))) as unknown as MockResponse;
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth", () => {
  const SECRETS = { operator_passcode_hash: "h-op", member_passcode_hash: "h-mem" };

  test("운영진 패스코드 일치 → operator 쿠키 발급", async () => {
    vi.mocked(getTeamSecrets).mockResolvedValue(SECRETS);
    vi.mocked(verifyPasscode).mockImplementation(
      async (p, h) => p === "op-pass" && h === "h-op",
    );
    const res = (await authPost(
      makeRequest({ teamSlug: "club", passcode: "op-pass" }),
    )) as unknown as MockResponse;

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ role: "operator" });
    expect(res.headers["Set-Cookie"]).toContain("mr_auth_club=operator.sig-club");
  });

  test("멤버 패스코드 일치 → member 쿠키 발급", async () => {
    vi.mocked(getTeamSecrets).mockResolvedValue(SECRETS);
    vi.mocked(verifyPasscode).mockImplementation(
      async (p, h) => p === "mem-pass" && h === "h-mem",
    );
    const res = (await authPost(
      makeRequest({ teamSlug: "club", passcode: "mem-pass" }),
    )) as unknown as MockResponse;

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ role: "member" });
    expect(res.headers["Set-Cookie"]).toContain("mr_auth_club=member.sig-club");
  });

  test("패스코드 불일치 → 401", async () => {
    vi.mocked(getTeamSecrets).mockResolvedValue(SECRETS);
    vi.mocked(verifyPasscode).mockResolvedValue(false);
    const res = (await authPost(
      makeRequest({ teamSlug: "club", passcode: "wrong" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(401);
  });

  test("존재하지 않는 팀 → 404", async () => {
    vi.mocked(getTeamSecrets).mockResolvedValue(null);
    const res = (await authPost(
      makeRequest({ teamSlug: "ghost", passcode: "any-pass" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(404);
  });
});

describe("POST /api/inject", () => {
  const INJECT_RESULT = { id: "d1", content: "내용", structured: {} };

  test("운영진 인증 시 201", async () => {
    vi.mocked(injectDocument).mockResolvedValue(INJECT_RESULT as never);
    const res = (await injectPost(
      makeRequest({ teamSlug: "club", text: "원문" }),
    )) as unknown as MockResponse;

    expect(res.status).toBe(201);
    expect(requireRole).toHaveBeenCalledWith(expect.anything(), "club", "operator");
  });

  test("미인증(401) → 401", async () => {
    vi.mocked(requireRole).mockRejectedValue(new AppError(401, "로그인 필요"));
    const res = (await injectPost(
      makeRequest({ teamSlug: "club", text: "원문" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(401);
    expect(injectDocument).not.toHaveBeenCalled();
  });

  test("멤버 권한(403) → 403", async () => {
    vi.mocked(requireRole).mockRejectedValue(new AppError(403, "권한 부족"));
    const res = (await injectPost(
      makeRequest({ teamSlug: "club", text: "원문" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(403);
  });

  test("빈 text → 400(인증 검사 전에 차단)", async () => {
    const res = (await injectPost(
      makeRequest({ teamSlug: "club", text: "" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/inject", () => {
  const UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

  test("운영진 인증 시 200", async () => {
    const res = (await injectDelete(
      makeRequest({ teamSlug: "club", documentId: UUID }, { method: "DELETE" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(200);
    expect(deleteDocument).toHaveBeenCalledWith("club", UUID);
    expect(requireRole).toHaveBeenCalledWith(expect.anything(), "club", "operator");
  });

  test("미인증 → 401", async () => {
    vi.mocked(requireRole).mockRejectedValue(new AppError(401, "로그인 필요"));
    const res = (await injectDelete(
      makeRequest({ teamSlug: "club", documentId: UUID }, { method: "DELETE" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(401);
    expect(deleteDocument).not.toHaveBeenCalled();
  });
});

describe("POST /api/query", () => {
  const ANSWER_RESULT = { answer: "사당입니다", sources: [] };

  test("멤버 인증 시 200", async () => {
    vi.mocked(requireRole).mockResolvedValue("member");
    vi.mocked(answerQuestion).mockResolvedValue(ANSWER_RESULT);
    const res = (await queryPost(
      makeRequest({ teamSlug: "club", question: "어디서?" }),
    )) as unknown as MockResponse;

    expect(res.status).toBe(200);
    expect(requireRole).toHaveBeenCalledWith(expect.anything(), "club", "member");
  });

  test("미인증 → 401", async () => {
    vi.mocked(requireRole).mockRejectedValue(new AppError(401, "로그인 필요"));
    const res = (await queryPost(
      makeRequest({ teamSlug: "club", question: "?" }),
    )) as unknown as MockResponse;
    expect(res.status).toBe(401);
    expect(answerQuestion).not.toHaveBeenCalled();
  });
});
