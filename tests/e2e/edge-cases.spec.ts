import { expect, test } from "@playwright/test";

/**
 * 엣지 케이스 E2E.
 * 실제 Supabase + Anthropic + OpenAI 키가 설정된 환경에서 실행해야 한다.
 */

test.describe.serial("중복 slug 방지", () => {
  const slug = `dup-${Date.now()}`;

  test("첫 번째 팀 생성은 성공한다", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("orchestra-2026").fill(slug);
    await page.getByPlaceholder("아마추어 오케스트라").fill("중복 테스트 팀");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();

    await expect(page).toHaveURL(`/${slug}/inject`);
  });

  test("같은 slug로 재생성 시도하면 에러 메시지를 표시한다", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("orchestra-2026").fill(slug);
    await page.getByPlaceholder("아마추어 오케스트라").fill("이름은 달라도");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();

    await expect(page.getByText(/이미 사용 중|already/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/inject/);
  });
});

test.describe.serial("문서 없는 팀에 질문", () => {
  const slug = `empty-${Date.now()}`;

  test("팀을 생성하고 문서 없이 질문하면 AI가 답변을 반환한다", async ({ page }) => {
    // 팀 생성
    await page.goto("/");
    await page.getByPlaceholder("orchestra-2026").fill(slug);
    await page.getByPlaceholder("아마추어 오케스트라").fill("빈 팀");
    await page.getByRole("button", { name: "팀 만들고 시작하기" }).click();
    await expect(page).toHaveURL(`/${slug}/inject`);

    // 주입 없이 바로 질문
    await page.goto(`/${slug}/ask`);
    await page.getByPlaceholder("질문을 입력하세요").fill("이번 주 합주 일정이 어떻게 돼?");
    await page.getByRole("button", { name: "물어보기" }).click();

    // AI 답변 버블이 나타나야 한다
    const answerBubble = page.locator(".rounded-2xl.bg-surface-raised").last();
    await expect(answerBubble).toBeVisible({ timeout: 40_000 });
    await expect(answerBubble).not.toBeEmpty();

    // 출처 배지 컨테이너(.mt-2.flex.flex-wrap)는 sources가 없으면 렌더링되지 않는다
    await expect(page.locator(".mt-2.flex.flex-wrap").first()).not.toBeAttached();
  });

  test("주입 콘솔에 '아직 주입된 데이터가 없어요' 안내가 표시된다", async ({ page }) => {
    await page.goto(`/${slug}/inject`);

    await expect(page.getByText("아직 주입된 데이터가 없어요")).toBeVisible();
  });
});
