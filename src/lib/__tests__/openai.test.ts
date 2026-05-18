import { describe, expect, test, vi } from "vitest";

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      },
    };
  }),
}));
vi.mock("../config", () => ({
  getEnv: () => ({ OPENAI_API_KEY: "test-key" }),
  EMBEDDING_MODEL: "text-embedding-3-small",
  EMBEDDING_DIMENSIONS: 1536,
}));

import { embed } from "../openai";

describe("embed", () => {
  test("텍스트를 임베딩 벡터로 반환한다", async () => {
    const result = await embed("안녕하세요");
    expect(result).toEqual([0.1, 0.2, 0.3]);
  });

  test("빈 문자열은 에러를 던진다", async () => {
    await expect(embed("")).rejects.toThrow("Cannot embed empty text");
  });

  test("공백만 있는 문자열도 에러를 던진다", async () => {
    await expect(embed("   ")).rejects.toThrow("Cannot embed empty text");
  });
});
