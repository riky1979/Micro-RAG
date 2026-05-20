import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const VALID_ENV = {
  ANTHROPIC_API_KEY: "x",
  ANTHROPIC_MODEL: "x",
  OPENAI_API_KEY: "x",
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "x",
  AUTH_SECRET: "0123456789abcdef0123456789abcdef",
};

beforeEach(() => {
  vi.resetModules();
  for (const [k, v] of Object.entries(VALID_ENV)) vi.stubEnv(k, v);
});
afterEach(() => vi.unstubAllEnvs());

describe("hashPasscode/verifyPasscode", () => {
  test("올바른 패스코드는 검증을 통과한다", async () => {
    const { hashPasscode, verifyPasscode } = await import("../auth");
    const hash = await hashPasscode("hunter2x");
    expect(await verifyPasscode("hunter2x", hash)).toBe(true);
  });

  test("잘못된 패스코드는 false를 반환한다", async () => {
    const { hashPasscode, verifyPasscode } = await import("../auth");
    const hash = await hashPasscode("hunter2x");
    expect(await verifyPasscode("wrong-one", hash)).toBe(false);
  });

  test("null 또는 잘못된 포맷은 false를 반환한다", async () => {
    const { verifyPasscode } = await import("../auth");
    expect(await verifyPasscode("any", null)).toBe(false);
    expect(await verifyPasscode("any", "not-a-hash")).toBe(false);
    expect(await verifyPasscode("any", "s$bad$bad")).toBe(false);
  });

  test("같은 패스코드도 매번 다른 해시(salt)가 생성된다", async () => {
    const { hashPasscode } = await import("../auth");
    const a = await hashPasscode("samesame");
    const b = await hashPasscode("samesame");
    expect(a).not.toBe(b);
  });
});

describe("signSession/verifySession", () => {
  test("서명된 쿠키는 같은 slug에서 검증된다", async () => {
    const { signSession, verifySession } = await import("../auth");
    const value = await signSession("club", "operator");
    expect(await verifySession(value, "club")).toBe("operator");
  });

  test("다른 slug로는 검증이 실패한다", async () => {
    const { signSession, verifySession } = await import("../auth");
    const value = await signSession("club", "operator");
    expect(await verifySession(value, "other")).toBeNull();
  });

  test("위조된 서명은 거부된다", async () => {
    const { verifySession } = await import("../auth");
    expect(await verifySession("operator.deadbeef", "club")).toBeNull();
    expect(await verifySession(undefined, "club")).toBeNull();
    expect(await verifySession("no-dot", "club")).toBeNull();
    expect(await verifySession("admin.abcd", "club")).toBeNull();
  });
});

describe("requireRole", () => {
  function makeReq(cookieValue?: string, slug = "club"): Request {
    return new Request("http://localhost", {
      headers: cookieValue ? { cookie: `mr_auth_${slug}=${cookieValue}` } : {},
    });
  }

  test("쿠키 없으면 401", async () => {
    const { requireRole } = await import("../auth");
    await expect(requireRole(makeReq(), "club", "member")).rejects.toMatchObject({
      status: 401,
    });
  });

  test("운영진은 member 권한도 만족한다", async () => {
    const { signSession, requireRole } = await import("../auth");
    const value = await signSession("club", "operator");
    await expect(requireRole(makeReq(value), "club", "member")).resolves.toBe(
      "operator",
    );
    await expect(requireRole(makeReq(value), "club", "operator")).resolves.toBe(
      "operator",
    );
  });

  test("멤버는 operator 권한 요구 시 403", async () => {
    const { signSession, requireRole } = await import("../auth");
    const value = await signSession("club", "member");
    await expect(
      requireRole(makeReq(value), "club", "operator"),
    ).rejects.toMatchObject({ status: 403 });
  });
});
