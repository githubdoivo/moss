import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the page renders with no errors, and the swamp is alive", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".wordmark")).toHaveAttribute("aria-label", "MOSS");
  await expect(page.locator(".soon")).toHaveText("soon");
  await expect(page.locator("a[href='mailto:mail@ivolopes.com']")).toBeVisible({ timeout: 8000 });
  const frames = () => page.locator("#swamp").evaluate((c) => +c.dataset.frames || 0);
  const before = await frames();
  await page.waitForTimeout(500);
  expect(await frames(), "the canvas should keep animating").toBeGreaterThan(before);
  expect(errors).toEqual([]);
});

test("with reduced motion it is one still frame, and all text shows at once", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForTimeout(600);
  expect(await page.locator("#swamp").evaluate((c) => c.dataset.frames)).toBe("1");
  await expect(page.locator(".line")).toHaveCSS("opacity", "1");
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
