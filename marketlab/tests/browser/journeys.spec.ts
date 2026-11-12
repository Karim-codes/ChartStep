import { test, expect } from "@playwright/test";

test("home is honest, readable, and chart canvas renders", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#learn");
  await expect(
    page.getByRole("heading", { name: "Make sense of the market." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /38 revealed candles/ }),
  ).toBeVisible();
  expect(await page.locator("canvas").count()).toBeGreaterThan(1);
  await expect(page.locator(".home-progress")).toContainText("0 of 27");
  await page.screenshot({
    path: "docs/screenshots/desktop-learning.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("library filters authored scenarios and clearly separates its roadmap", async ({
  page,
}) => {
  await page.goto("/#library");
  await expect(page.locator(".scenario-card")).toHaveCount(27);
  await page
    .getByLabel("Concept", { exact: true })
    .selectOption("Market structure");
  await expect(page.locator(".scenario-card")).toHaveCount(3);
  await page
    .getByLabel("Difficulty", { exact: true })
    .selectOption("Intermediate");
  await expect(page.locator(".scenario-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page
    .getByRole("searchbox", { name: "Search scenarios" })
    .fill("doesnotexist");
  await expect(
    page.getByRole("heading", { name: "No scenarios match just yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Curriculum roadmap" }).click();
  await expect(page.locator(".roadmap-grid>article")).toHaveCount(9);
  await expect(page.locator(".scenario-card")).toHaveCount(0);
});

test("a beginner submits, reveals, receives feedback and persists real completion", async ({
  page,
}) => {
  await page.goto("/#learn");
  await page.getByRole("button", { name: "Start your first lesson" }).click();
  await expect(
    page.getByRole("img", { name: /40 revealed candles/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit & reveal" }),
  ).toBeDisabled();
  await expect(page.locator(".assessment-feedback")).toHaveCount(0);
  await page
    .getByRole("radio", {
      name: "The closing price was above the opening price",
    })
    .check();
  await page.getByLabel("Playback speed").selectOption("4");
  await page.getByRole("button", { name: "Submit & reveal" }).click();
  await expect(page.locator(".assessment-feedback")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "You’re seeing the idea." }),
  ).toBeVisible();
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("marketlab.learning.v1")!),
  );
  expect(persisted.completed).toEqual(["candle-body"]);
  expect(persisted.attempts).toHaveLength(1);
  await page.reload();
  await page.getByRole("button", { name: "My learning", exact: true }).click();
  await expect(page.locator(".home-progress")).toContainText("1 of 27");
});

test("guided horizontal-level exercise uses real price mapping and scores its marking", async ({
  page,
}) => {
  await page.goto("/#replay");
  await page.getByLabel("Switch scenario").selectOption("higher-highs");
  await expect(
    page.getByRole("img", { name: /40 revealed candles/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Horizontal level", exact: true })
    .click();
  await page.getByLabel("Annotation price", { exact: true }).fill("1.08460");
  await page
    .getByRole("button", { name: "Add annotation", exact: true })
    .click();
  await page
    .getByRole("radio", { name: "Higher highs and higher lows" })
    .check();
  await page.screenshot({
    path: "docs/screenshots/desktop-replay.png",
    fullPage: true,
  });
  await page.getByLabel("Playback speed").selectOption("4");
  await page.getByRole("button", { name: "Submit & reveal" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re seeing the idea." }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Previous candle (clears orders and assessment)",
    })
    .click();
  await expect(
    page.getByText("Exploration mode", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".assessment-feedback")).toHaveCount(0);
  await expect(page.getByRole("radio").first()).not.toBeChecked();
});

test("price-region exercise accepts two keyboard price coordinates", async ({
  page,
}) => {
  await page.goto("/#replay");
  await page.getByLabel("Switch scenario").selectOption("support");
  await page.getByRole("button", { name: "Price region", exact: true }).click();
  await page.getByLabel("Annotation price", { exact: true }).fill("1.08320");
  await page.getByLabel("Region second price").fill("1.08350");
  await page
    .getByRole("button", { name: "Add annotation", exact: true })
    .click();
  await page
    .getByRole("radio", {
      name: "An area of earlier reactions worth observing",
    })
    .check();
  await page.getByLabel("Playback speed").selectOption("4");
  await page.getByRole("button", { name: "Submit & reveal" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re seeing the idea." }),
  ).toBeVisible();
});

test("virtual trades calculate spread, fills, balance and saved history", async ({
  page,
}) => {
  await page.goto("/#trading");
  await page
    .getByRole("button", { name: "Guided replay", exact: true })
    .click();
  await page.getByRole("button", { name: "Practise", exact: true }).click();
  await page.getByRole("button", { name: "Place simulated buy" }).click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(1);
  await expect(page.locator(".lesson-panel .position-row")).toContainText(
    "-$0.12",
  );
  await page.getByRole("button", { name: "Next candle", exact: true }).click();
  await page.locator(".lesson-panel .close-position").click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(0);
  await expect(page.locator(".trade-detail")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Close positions & save session" })
    .click();
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("marketlab.learning.v1")!),
  );
  const session = persisted.sessions[0];
  expect(session.trades).toHaveLength(1);
  expect(session.balance).toBeCloseTo(10000 + session.trades[0].pnl, 6);
  await page
    .getByRole("button", { name: "Restart scenario", exact: true })
    .click();
  await expect(page.locator(".trade-detail")).toHaveCount(0);
  await expect(page.locator(".account-values")).toContainText("$10,000.00");
});

test("invalid notional is explained and sell direction can execute", async ({
  page,
}) => {
  await page.goto("/#trading");
  await page.getByLabel("Position size").fill("100000");
  await page.getByRole("button", { name: "Place simulated buy" }).click();
  await expect(page.getByRole("alert")).toContainText("Choose fewer units");
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(0);
  await page.getByLabel("Position size").fill("1000");
  await page.getByRole("button", { name: "Open sell", exact: true }).click();
  await page.getByRole("button", { name: "Place simulated sell" }).click();
  await expect(page.locator(".lesson-panel .position-row")).toContainText(
    "SELL",
  );
  await page
    .getByRole("button", { name: "Guided replay", exact: true })
    .click();
  await page.getByLabel("Switch scenario").selectOption("wide-spread");
  await page.getByRole("button", { name: "Practise", exact: true }).click();
  await expect(page.locator(".lesson-panel .position-row")).toHaveCount(0);
  await expect(page.locator(".account-values")).toContainText("$10,000.00");
  await expect(page.locator(".quote-strip")).toContainText("4.0 pip spread");
});

test("reflection saves and survives reload", async ({ page }) => {
  await page.goto("/#progress");
  await page.getByRole("button", { name: /Your journal/ }).click();
  await page.getByRole("button", { name: "New reflection" }).click();
  await page
    .getByLabel("What did you observe?")
    .fill("Higher lows were forming.");
  await page
    .getByLabel("What was your risk plan?")
    .fill("Keep the planned loss small.");
  await page
    .getByLabel(/What will you take into your next practice/)
    .fill("A pattern is an observation, not a guarantee.");
  await page.getByRole("button", { name: "Save reflection" }).click();
  await expect(page.locator(".journal-entry")).toContainText(
    "A pattern is an observation, not a guarantee.",
  );
  await page.reload();
  await page.getByRole("button", { name: /Your journal/ }).click();
  await expect(page.locator(".journal-entry")).toHaveCount(1);
});

test("pricing has planned tiers, working enquiry links and no checkout", async ({
  page,
}) => {
  await page.goto("/#pricing");
  await expect(page.locator(".pricing-card")).toHaveCount(3);
  await expect(
    page.locator(".pricing-card .pill").filter({ hasText: "Planned" }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "Discuss your academy" }),
  ).toHaveAttribute("href", /^mailto:/);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
});

for (const width of [375, 768, 1440]) {
  test(`layout works at ${width}px without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "learn",
      "library",
      "pathways",
      "replay",
      "trading",
      "progress",
      "pricing",
    ]) {
      await page.goto("/#" + route);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".app-footer")).toBeAttached();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    if (width === 375) {
      await page.goto("/#learn");
      await page.screenshot({
        path: "docs/screenshots/mobile-learning.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("button", { name: "Market replay", exact: true })
        .click();
      await expect(
        page.getByRole("img", { name: /40 revealed candles/ }),
      ).toBeVisible();
      await page.screenshot({
        path: "docs/screenshots/mobile-replay.png",
        fullPage: true,
      });
    }
  });
}

test("keyboard playback, modal focus and reduced motion are supported", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#replay");
  await page.locator("h1").click();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("img", { name: /41 revealed candles/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Trading glossary" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const prefers = await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  expect(prefers).toBe(true);
});
