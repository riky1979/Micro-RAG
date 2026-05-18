import { expect, test } from "@playwright/test";

/**
 * 클라이언트 측 유효성 검사 E2E.
 * 외부 API 없이 Next.js 서버만으로 실행 가능하다.
 */

test.describe("팀 생성 폼 — 클라이언트 검증", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("1자 slug는 에러 메시지를 표시한다", async ({ page }) => {
    await page.getByPlaceholder("orchestra-2026").fill("a");
    await page.getByPlaceholder("아마추어 오케스트라").fill("팀 이름");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();

    await expect(page.getByText(/영소문자.*하이픈/)).toBeVisible();
    await expect(page).not.toHaveURL(/\/inject/);
  });

  test("대문자가 포함된 slug는 에러 메시지를 표시한다", async ({ page }) => {
    await page.getByPlaceholder("orchestra-2026").fill("MyTeam");
    await page.getByPlaceholder("아마추어 오케스트라").fill("팀 이름");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();

    await expect(page.getByText(/영소문자.*하이픈/)).toBeVisible();
  });

  test("공백이 포함된 slug는 에러 메시지를 표시한다", async ({ page }) => {
    await page.getByPlaceholder("orchestra-2026").fill("my team");
    await page.getByPlaceholder("아마추어 오케스트라").fill("팀 이름");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();

    await expect(page.getByText(/영소문자.*하이픈/)).toBeVisible();
  });

  test("팀 이름 없이 제출하면 에러 메시지를 표시한다", async ({ page }) => {
    await page.getByPlaceholder("orchestra-2026").fill("valid-slug");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();

    await expect(page.getByText(/팀 이름을 입력하세요/)).toBeVisible();
    await expect(page).not.toHaveURL(/\/inject/);
  });

  test("에러 후 올바른 slug로 수정하면 에러가 사라진다", async ({ page }) => {
    await page.getByPlaceholder("orchestra-2026").fill("A");
    await page.getByPlaceholder("아마추어 오케스트라").fill("팀 이름");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();
    await expect(page.getByText(/영소문자.*하이픈/)).toBeVisible();

    await page.getByPlaceholder("orchestra-2026").fill("valid-slug");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();

    await expect(page.getByText(/영소문자.*하이픈/)).not.toBeVisible();
  });
});

