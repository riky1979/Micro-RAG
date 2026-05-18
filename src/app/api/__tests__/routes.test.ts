import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));
vi.mock("@/lib/teams", () => ({ createTeam: vi.fn() }));
vi.mock("@/lib/rag", () => ({ injectDocument: vi.fn(), answerQuestion: vi.fn() }));

import { AppError } from "@/lib/errors";
import { createTeam } from "@/lib/teams";
import { answerQuestion, injectDocument } from "@/lib/rag";
import { POST as teamsPost } from "../teams/route";
import { POST as injectPost } from "../inject/route";
import { POST as queryPost } from "../query/route";

type MockResponse = { body: unknown; status: number };

function makeRequest(body: unknown): Request {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const TEAM = { id: "t1", slug: "club", name: "Club", created_at: "2026-01-01" };

beforeEach(() => vi.clearAllMocks());

describe("POST /api/teams", () => {
  test("유효한 요청 → 201과 팀 객체", async () => {
    vi.mocked(createTeam).mockResolvedValue(TEAM);
    const res = (await teamsPost(makeRequest({ slug: "club", name: "Club" }))) as MockResponse;

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ team: TEAM });
    expect(createTeam).toHaveBeenCalledWith("club", "Club");
  });

  test("대문자·공백이 포함된 slug → 400", async () => {
    const res = (await teamsPost(makeRequest({ slug: "INVALID!", name: "Team" }))) as MockResponse;
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("slug 1자 (최소 길이 미달) → 400", async () => {
    const res = (await teamsPost(makeRequest({ slug: "a", name: "Team" }))) as MockResponse;
    expect(res.status).toBe(400);
  });

  test("slug 누락 → 400", async () => {
    const res = (await teamsPost(makeRequest({ name: "Team" }))) as MockResponse;
    expect(res.status).toBe(400);
  });

  test("중복 slug (AppError 409) → 409", async () => {
    vi.mocked(createTeam).mockRejectedValue(new AppError(409, "슬러그 중복"));
    const res = (await teamsPost(makeRequest({ slug: "club", name: "Club" }))) as MockResponse;
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "슬러그 중복" });
  });
});

describe("POST /api/inject", () => {
  const INJECT_RESULT = { id: "d1", content: "내용", structured: {} };

  test("유효한 요청 → 201과 주입 결과", async () => {
    vi.mocked(injectDocument).mockResolvedValue(INJECT_RESULT as never);
    const res = (await injectPost(
      makeRequest({ teamSlug: "club", text: "원문 텍스트" }),
    )) as MockResponse;

    expect(res.status).toBe(201);
    expect(res.body).toEqual(INJECT_RESULT);
    expect(injectDocument).toHaveBeenCalledWith("club", "원문 텍스트");
  });

  test("빈 text → 400", async () => {
    const res = (await injectPost(makeRequest({ teamSlug: "club", text: "" }))) as MockResponse;
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("teamSlug 누락 → 400", async () => {
    const res = (await injectPost(makeRequest({ text: "내용" }))) as MockResponse;
    expect(res.status).toBe(400);
  });

  test("존재하지 않는 팀 (AppError 404) → 404", async () => {
    vi.mocked(injectDocument).mockRejectedValue(new AppError(404, "팀 없음"));
    const res = (await injectPost(
      makeRequest({ teamSlug: "ghost", text: "내용" }),
    )) as MockResponse;
    expect(res.status).toBe(404);
  });
});

describe("POST /api/query", () => {
  const ANSWER_RESULT = { answer: "사당입니다", sources: [] };

  test("유효한 요청 → 200과 답변", async () => {
    vi.mocked(answerQuestion).mockResolvedValue(ANSWER_RESULT);
    const res = (await queryPost(
      makeRequest({ teamSlug: "club", question: "어디서 모여?" }),
    )) as MockResponse;

    expect(res.status).toBe(200);
    expect(res.body).toEqual(ANSWER_RESULT);
    expect(answerQuestion).toHaveBeenCalledWith("club", "어디서 모여?");
  });

  test("빈 question → 400", async () => {
    const res = (await queryPost(
      makeRequest({ teamSlug: "club", question: "" }),
    )) as MockResponse;
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("question 누락 → 400", async () => {
    const res = (await queryPost(makeRequest({ teamSlug: "club" }))) as MockResponse;
    expect(res.status).toBe(400);
  });

  test("서비스 오류 (AppError 404) → 404", async () => {
    vi.mocked(answerQuestion).mockRejectedValue(new AppError(404, "팀 없음"));
    const res = (await queryPost(
      makeRequest({ teamSlug: "ghost", question: "질문" }),
    )) as MockResponse;
    expect(res.status).toBe(404);
  });
});
