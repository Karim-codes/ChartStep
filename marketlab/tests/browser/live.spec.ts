import { test, expect } from "@playwright/test";

test("continuous practice moves, adds buys and sells to close only the chosen position", async ({
  page,
}) => {
  await page.goto("/#trading");
  await expect(
    page.getByRole("heading", { name: "Your practice market" }),
  ).toBeVisible();
  await expect(
    page.getByText("CONTINUOUS SIMULATION · NOT LIVE MARKET DATA"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause replay" }).click();
  await page.getByRole("button", { name: "Place simulated buy" }).click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(1);
  await expect(page.locator(".lesson-panel .position-row")).toContainText(
    "Sell to close",
  );
  await page.getByRole("button", { name: "Add another buy" }).click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(2);
  const quoteBefore = await page.locator(".quote-strip").textContent();
  for (
    let i = 0;
    i < 8 && (await page.locator(".quote-strip").textContent()) === quoteBefore;
    i++
  )
    await page
      .getByRole("button", { name: "Next candle", exact: true })
      .click();
  await expect(page.locator(".quote-strip")).not.toHaveText(quoteBefore!);
  await page
    .locator(".chart-position-strip")
    .getByRole("button", { name: "Sell to close" })
    .first()
    .click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(1);
  await expect(page.locator(".trade-detail")).toHaveCount(1);
  await page
    .locator(".lesson-panel")
    .getByRole("button", { name: "Sell to close" })
    .click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(0);
  await expect(page.locator(".trade-detail")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Close positions & save session" })
    .click();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("marketlab.learning.v1")!),
  );
  expect(stored.sessions[0].mode).toBe("live");
  expect(stored.sessions[0].balance).toBeCloseTo(
    10000 +
      stored.sessions[0].trades.reduce(
        (n: number, t: { pnl: number }) => n + t.pnl,
        0,
      ),
    6,
  );
});

test("all account sizes reset honestly and selection is remembered", async ({
  page,
}) => {
  await page.goto("/#trading");
  await page.getByRole("button", { name: "Pause replay" }).click();
  for (const balance of [50000, 100000, 10000]) {
    await page
      .getByLabel("Starting account balance")
      .selectOption(String(balance));
    await expect(page.locator(".account-values>div").first()).toContainText(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(balance),
    );
    await page.getByRole("button", { name: "Place simulated buy" }).click();
    await expect(page.locator(".lesson-panel .position-row")).toHaveCount(1);
    await page.getByRole("button", { name: "New market session" }).click();
    await page.getByRole("button", { name: "Pause replay" }).click();
    await expect(page.locator(".lesson-panel .position-row")).toHaveCount(0);
  }
  await page.getByLabel("Starting account balance").selectOption("50000");
  await page.reload();
  await expect(page.getByLabel("Starting account balance")).toHaveValue(
    "50000",
  );
});

test("trend and price drawings remain usable while the synthetic market streams", async ({
  page,
}) => {
  await page.goto("/#trading");
  await page.getByRole("button", { name: "Trend line", exact: true }).click();
  await page.getByLabel("Annotation price", { exact: true }).fill("1.08350");
  await page.getByLabel("Trend second price").fill("1.08500");
  await page
    .getByRole("button", { name: "Add annotation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Undo last drawing" }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Horizontal level", exact: true })
    .click();
  await page.getByLabel("Annotation price", { exact: true }).fill("1.08420");
  await page
    .getByRole("button", { name: "Add annotation", exact: true })
    .click();
  await page.getByRole("button", { name: "Next candle", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Clear annotations" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Undo last drawing" }).click();
  await expect(
    page.getByRole("button", { name: "Clear annotations" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Clear annotations" }).click();
  await expect(
    page.getByRole("button", { name: "Undo last drawing" }),
  ).toBeDisabled();
});

test("light and dark modes include the chart and persist across reload", async ({
  page,
}) => {
  await page.goto("/#trading");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".dark-chart")).toHaveCount(1);
  await page.screenshot({
    path: "docs/screenshots/dark-practice.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".dark-chart")).toHaveCount(0);
});

test("open practice positions survive leaving and reload without unobserved execution", async ({
  page,
}) => {
  await page.goto("/#trading");
  await page.getByRole("button", { name: "Pause replay" }).click();
  await page.getByRole("button", { name: "Place simulated buy" }).click();
  await page.getByRole("button", { name: "My learning", exact: true }).click();
  await page
    .getByRole("button", { name: "Virtual trading", exact: true })
    .click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(1);
  await expect(page.getByText("Market paused", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Play replay" })).toBeVisible();
});

test("mobile shortcuts connect the chart, ticket and learning panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#trading");
  await page
    .getByRole("navigation", { name: "Practice workspace shortcuts" })
    .getByRole("button", { name: "Trade", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Place simulated buy" }),
  ).toBeAttached();
  await page
    .getByRole("navigation", { name: "Practice workspace shortcuts" })
    .getByRole("button", { name: "Learn", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Plan. Act. Observe. Reflect." }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Practice workspace shortcuts" })
    .getByRole("button", { name: "Chart", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: /Interactive EUR\/USD/ }),
  ).toBeVisible();
});
