import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the page renders with no errors, and the specimen is alive", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".wordmark")).toHaveText("MOSS");
  await expect(page.locator(".soon")).toContainText("SOON");
  await expect(page.locator("a[href='mailto:mail@ivolopes.com']")).toBeVisible({ timeout: 8000 });
  const frames = () => page.locator("#specimen").evaluate((c) => +c.dataset.frames || 0);
  const before = await frames();
  await page.waitForTimeout(500);
  expect(await frames(), "the specimen should keep animating").toBeGreaterThan(before);
  expect(errors).toEqual([]);
});

test("with reduced motion the specimen is one still frame, fully grown", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForTimeout(600);
  expect(await page.locator("#specimen").evaluate((c) => c.dataset.frames)).toBe("1");
  // Drawn fully grown straight away.
  expect(await page.locator("#specimen").evaluate((c) => c.dataset.coverage)).toBe("100.0");
  await context.close();
});

test("nothing scrolls sideways on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 700 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test("no serious accessibility problems once the text has faded in", async ({ browser }) => {
  // Scan the settled page: mid-fade text would read as low contrast.
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  await context.close();
});

test("the specimen grows: moss coverage rises to 100% over the first seconds", async ({ page }) => {
  await page.goto("/");
  const cov = () => page.locator("#specimen").evaluate((c) => parseFloat(c.dataset.coverage || "0"));
  await page.waitForTimeout(1500);
  const early = await cov();
  expect(early).toBeLessThan(100);
  await expect.poll(cov, { timeout: 12000 }).toBe(100);
  await expect(page.locator("#v-cov")).toHaveText("100.0");
});

test("on a phone, the extra panels step aside for the specimen", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone layout only");
  await page.goto("/");
  for (const sel of [".feed", ".gauge", ".map"]) await expect(page.locator(sel)).toBeHidden();
  for (const sel of [".id-card", ".growth", ".transmission"]) await expect(page.locator(sel)).toBeVisible();
});
