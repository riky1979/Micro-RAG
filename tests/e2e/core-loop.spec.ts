import { expect, test } from "@playwright/test";

/**
 * 핵심 루프 E2E: 팀 생성 → 데이터 주입 → 질문 응답.
 * 실제 Supabase + Anthropic + OpenAI 키가 설정된 환경에서 실행해야 한다.
 */
const slug = `e2e-${Date.now()}`;

test.describe.serial("Micro-RAG 핵심 루프", () => {
  test("새 팀을 생성하면 주입 콘솔로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("orchestra-2026").fill(slug);
    await page.getByPlaceholder("아마추어 오케스트라").fill("E2E 테스트 팀");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();

    await expect(page).toHaveURL(`/${slug}/inject`);
  });

  test("텍스트를 주입하면 AI가 구조화한다", async ({ page }) => {
    await page.goto(`/${slug}/inject`);
    await page
      .getByPlaceholder(/합주/)
      .fill("이번 주 합주 토요일 오후 3시 사당 연습실 A룸으로 변경. 준비 곡 아리랑 앙상블 편곡.");
    await page.getByRole("button", { name: "주입하기" }).click();

    await expect(page.getByText("방금 학습했어요")).toBeVisible({ timeout: 40_000 });
  });

  test("주입된 정보를 질문하면 근거 기반으로 답한다", async ({ page }) => {
    await page.goto(`/${slug}/ask`);
    await page.getByPlaceholder("질문을 입력하세요").fill("이번 주 어디서 모여?");
    await page.getByRole("button", { name: "물어보기" }).click();

    await expect(page.getByText(/사당/)).toBeVisible({ timeout: 40_000 });
  });
});
