import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const VALID_ENV = {
  ANTHROPIC_API_KEY: "test-anthropic-key",
  ANTHROPIC_MODEL: "claude-test",
  OPENAI_API_KEY: "test-openai-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

describe("getEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("유효한 환경변수로 파싱된 설정을 반환한다", async () => {
    const { getEnv } = await import("../config");
    const env = getEnv();
    expect(env.ANTHROPIC_API_KEY).toBe("test-anthropic-key");
    expect(env.OPENAI_API_KEY).toBe("test-openai-key");
    expect(env.ANTHROPIC_MODEL).toBe("claude-test");
  });

  test("ANTHROPIC_API_KEY가 없으면 에러를 던진다", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { getEnv } = await import("../config");
    expect(() => getEnv()).toThrow("Invalid environment configuration");
  });

  test("OPENAI_API_KEY가 없으면 에러를 던진다", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { getEnv } = await import("../config");
    expect(() => getEnv()).toThrow("Invalid environment configuration");
  });

  test("NEXT_PUBLIC_SUPABASE_URL이 유효한 URL이 아니면 에러를 던진다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    const { getEnv } = await import("../config");
    expect(() => getEnv()).toThrow("Invalid environment configuration");
  });

  test("결과를 캐싱하여 두 번째 호출 시 동일한 객체를 반환한다", async () => {
    const { getEnv } = await import("../config");
    const first = getEnv();
    const second = getEnv();
    expect(first).toBe(second);
  });
});
