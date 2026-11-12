import { test, expect } from "@playwright/test";

test("gold and silver execute base-ounce positions with USD P&L and retain history across markets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#trading");
  await page.getByRole("button", { name: "Pause replay" }).click();
  for (const instrument of [
    "XAU/USD",
    "XAG/USD",
    "GBP/USD",
    "AUD/USD",
    "EUR/USD",
  ]) {
    await page.getByLabel("Practice instrument").selectOption(instrument);
    await expect(
      page.getByRole("img", { name: new RegExp(`Interactive ${instrument}`) }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Place simulated buy" }).click();
    await expect(page.locator(".lesson-panel .position-row")).toHaveCount(1);
    await expect(page.getByLabel("Practice instrument")).toBeDisabled();
    const position = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("marketlab.practice.v1")!).state.account
          .positions[0],
    );
    expect(position.instrument).toBe(instrument);
    if (instrument === "XAU/USD") {
      await expect(page.getByLabel("Position size")).toHaveValue("1");
      await expect(page.locator(".lesson-panel .position-row")).toContainText(
        "-$0.50",
      );
      await expect(page.locator(".lesson-panel .position-row")).toContainText(
        "1 oz",
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: "docs/screenshots/gold-practice.png",
        fullPage: true,
      });
    }
    await page
      .locator(".lesson-panel")
      .getByRole("button", { name: "Sell to close" })
      .click();
    await expect(page.getByLabel("Practice instrument")).toBeEnabled();
    if (instrument === "XAU/USD")
      await expect(page.locator(".account-values>div").first()).toContainText(
        "$9,999.50",
      );
  }
  await expect(page.locator(".trade-detail")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Close positions & save session" })
    .click();
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("marketlab.learning.v1")!).sessions[0],
  );
  expect(
    new Set(saved.trades.map((t: { instrument: string }) => t.instrument)).size,
  ).toBe(5);
  expect(saved.balance).toBeCloseTo(
    10000 +
      saved.trades.reduce((n: number, t: { pnl: number }) => n + t.pnl, 0),
    6,
  );
  expect(errors).toEqual([]);
});

test("fractional gold ounces recover at the same price and support closing a short", async ({
  page,
}) => {
  await page.goto("/#trading");
  await page.getByRole("button", { name: "Pause replay" }).click();
  await page.getByLabel("Practice instrument").selectOption("XAU/USD");
  await page.getByRole("button", { name: "Open sell", exact: true }).click();
  await page.getByLabel("Position size").fill("0.1");
  await page.getByRole("button", { name: "Place simulated sell" }).click();
  await expect(page.locator(".lesson-panel .position-row")).toContainText(
    "0.1 oz",
  );
  const before = (await page.locator(".account-values").textContent())!;
  await page.reload();
  await expect(page.getByLabel("Practice instrument")).toHaveValue("XAU/USD");
  await expect(page.getByText("Market paused", { exact: true })).toBeVisible();
  await expect(page.locator(".account-values")).toHaveText(before);
  await page
    .locator(".lesson-panel")
    .getByRole("button", { name: "Buy to close" })
    .click();
  await expect(page.locator(".account-values>div").first()).toContainText(
    "$9,999.95",
  );
});

test("fresh sessions change both the history and future and reset their order ticket prices", async ({
  page,
}) => {
  await page.goto("/#trading");
  await page.getByRole("button", { name: "Pause replay" }).click();
  const snapshot = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("marketlab.practice.v1")!).state.live,
    );
  const first = await snapshot();
  await page.getByRole("button", { name: "Fresh market", exact: true }).click();
  await page.getByRole("button", { name: "Pause replay" }).click();
  const second = await snapshot();
  expect(first.sessionSeed).not.toBe(second.sessionSeed);
  expect(first.candles).not.toEqual(second.candles);
  await page.getByRole("button", { name: "Place simulated buy" }).click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(1);
});

test("continuous markets keep playing beyond candle 66", async ({ page }) => {
  await page.clock.install();
  await page.goto("/#trading");
  await expect(
    page.getByRole("button", { name: "Pause replay" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("marketlab.practice.v1")),
    )
    .not.toBeNull();
  await page.clock.runFor(400000);
  const state = await page.evaluate(
    () => JSON.parse(localStorage.getItem("marketlab.practice.v1")!).state,
  );
  expect(state.playing).toBe(true);
  expect(state.live.candles.length).toBeGreaterThan(66);
  await expect(
    page.getByRole("button", { name: "Pause replay" }),
  ).toBeEnabled();
  await expect(page.getByText("Market moving", { exact: true })).toBeVisible();
});

for (const width of [375, 768])
  test(`gold practice fits at ${width}px with usable price controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#trading");
    await page.getByLabel("Practice instrument").selectOption("XAU/USD");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("img", { name: /Interactive XAU\/USD/ }),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `docs/screenshots/${width === 375 ? "mobile" : "tablet"}-gold-practice.png`,
      fullPage: true,
    });
  });
