import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const inView = (box, vp) => box && box.x >= 0 && box.y >= 0 && box.x + box.width <= vp.width && box.y + box.height <= vp.height;

test("the page renders with no errors: plate, bloom, wordmark and contact", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => errors.push(`failed: ${r.url()}`));
  await page.goto("/");
  await expect(page.locator("#plate")).toHaveJSProperty("complete", true);
  expect(await page.locator("#plate").evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
  expect(await page.locator("#flower").evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".word svg[aria-label='MOSS']")).toBeAttached();
  await expect(page.locator(".hud")).toContainText("TRANSMISSION");
  await expect(page.locator("a[href='mailto:mail@ivolopes.com']")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the readouts are live", async ({ page }) => {
  await page.goto("/");
  const read = () => page.locator(".hud").innerText();
  const first = await read();
  await expect.poll(read, { timeout: 6000 }).not.toBe(first);
});

test("the HUD stays on screen in a short browser window (Safari bars showing)", async ({ page }) => {
  for (const vp of [{ width: 390, height: 640 }, { width: 390, height: 844 }, { width: 1280, height: 640 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(vp);
    await page.goto("/");
    await page.waitForTimeout(300);
    for (const sel of ["a[href^='mailto']", ".word", "#ra", ".hud .t.r"]) {
      expect(inView(await page.locator(sel).first().boundingBox(), vp), `${sel} at ${vp.width}x${vp.height}`).toBe(true);
    }
  }
});

test("nothing scrolls sideways on a narrow phone", async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 700 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test("double-clicking selects nothing (no purple selection over the scene)", async ({ page }) => {
  await page.goto("/");
  const vp = page.viewportSize();
  await page.mouse.dblclick(vp.width / 2, vp.height / 2);
  await page.mouse.click(vp.width / 2, vp.height / 2, { clickCount: 3 });
  expect(await page.evaluate(() => String(getSelection()))).toBe("");
});

test("the cursor scans frequencies and locks onto the bloom", async ({ page, isMobile }) => {
  test.skip(isMobile, "pointer only");
  await page.goto("/");
  await page.mouse.move(40, 450);
  await expect(page.locator("#coords")).toContainText("HZ");
  const b = await page.locator("#bloom").boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
  await expect(page.locator("#coords")).toContainText("LIFEFORM LOCKED", { timeout: 4000 });
});

test("with reduced motion nothing moves, and the page is still complete", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".word svg")).toBeAttached();
  const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity).length);
  expect(moving).toBe(0);
  await context.close();
});

test("no serious accessibility problems", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  await context.close();
});

test("no ceramic wording anywhere (biology and technology only)", async ({ page }) => {
  await page.goto("/");
  expect(await page.content()).not.toMatch(/ceramic|clay|glaze/i);
});

test("Portuguese: the whole HUD is translated, and the page says it is Portuguese", async ({ page }) => {
  await page.goto("/?lang=pt");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await expect(page).toHaveTitle("MOSS · sinal captado");
  const hud = page.locator(".hud");
  await expect(hud).toContainText("TRANSMISSÃO");
  await expect(hud).toContainText("PRODUTOR");
  for (const en of ["TRANSMISSION", "PRODUCER", "SOON"]) await expect(hud).not.toContainText(en);
  await expect(page.locator("main.sr")).toContainText("DJ e produtor");
});

test("the language switch goes to the other language and is remembered", async ({ page }) => {
  await page.goto("/?lang=en");
  const sw = page.locator("a.lang");
  await expect(sw).toHaveAttribute("href", "?lang=pt");
  await expect(sw).toHaveAccessibleName("Ver em português");
  await sw.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await page.locator("a.lang").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("a Portuguese browser gets Portuguese on the first visit", async ({ browser }) => {
  const context = await browser.newContext({ locale: "pt-PT" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await context.close();
});

test("in both languages the switch and the email stay on screen", async ({ page }) => {
  for (const vp of [{ width: 390, height: 640 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(vp);
    for (const lang of ["en", "pt"]) {
      await page.goto(`/?lang=${lang}`);
      for (const sel of ["a.lang", "a[href^='mailto']", ".tx"]) {
        expect(inView(await page.locator(sel).first().boundingBox(), vp), `${sel} ${lang} ${vp.width}`).toBe(true);
      }
    }
  }
});

test("only the email and the language switch are links: MOSS links nowhere else", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  for (const h of hrefs) expect(h).toMatch(/^(mailto:mail@ivolopes\.com|\?lang=(en|pt))$/);
});

test("Portuguese has no serious accessibility problems", async ({ page }) => {
  await page.goto("/?lang=pt");
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter((v) => ["serious", "critical"].includes(v.impact));
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
