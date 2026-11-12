import { test, expect } from "@playwright/test";

test("new home introduces the product and opens the working lab", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Your first trade/ }),
  ).toBeVisible();
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await expect(page.locator(".lp-product-window canvas").first()).toBeVisible();
  await expect(page.locator(".lp-hero-fineprint")).toContainText(
    "No signup required.",
  );
  await page.screenshot({ path: "docs/screenshots/landing-desktop.png" });
  await page
    .getByRole("button", { name: "Start practising", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your practice market" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("landing chart preview reveals candles, switches to gold and teaches an observation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".lp-preview-player")).toContainText(
    "40 candles revealed",
  );
  await page.getByRole("button", { name: "Reveal next demo candle" }).click();
  await expect(page.locator(".lp-preview-player")).toContainText(
    "41 candles revealed",
  );
  await page.getByRole("button", { name: "Gold XAU/USD", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /Interactive XAU\/USD/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Finishing higher", exact: true })
    .click();
  await expect(page.locator(".lp-preview-feedback")).toBeVisible();
  await expect(page.locator(".lp-preview-feedback")).toContainText(
    "The next one is still uncertain.",
  );
  await page.getByRole("button", { name: "Try a guided lesson" }).click();
  await expect(
    page.getByRole("heading", { name: "Read your first candlestick" }),
  ).toBeVisible();
});

test("landing reflection saves an actual local journal record", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("A name for your observation")
    .fill("A pause before a decision");
  await page
    .getByLabel("What are you taking away?")
    .fill(
      "I can describe what price did without claiming to know the next move.",
    );
  await page
    .getByRole("button", { name: "Save reflection", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Saved to journal", exact: true }),
  ).toBeDisabled();
  const p = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("marketlab.learning.v1")!),
  );
  expect(p.journal[0].analysis).toBe("A pause before a decision");
  expect(p.journal[0].learned).toContain("without claiming");
  await page
    .getByRole("button", { name: "Open your journal", exact: true })
    .click();
  await page.getByRole("button", { name: /Your journal/ }).click();
  await expect(page.locator(".journal-entry")).toContainText(
    "without claiming",
  );
});

test("pathways, pricing and academy links have real destinations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Let’s talk about your academy" }),
  ).toHaveAttribute("href", /^mailto:/);
  await expect(
    page.getByRole("link", { name: "Enquire about Pro" }),
  ).toHaveAttribute("href", /^mailto:/);
  await page.getByRole("button", { name: /Candles & structure/ }).click();
  await expect(page.locator(".scenario-card")).toHaveCount(6);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Small scenarios",
  );
});

test("section links and the mobile sheet are keyboard accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open website navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile website navigation" })
    .getByRole("link", { name: "How it works" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#the-method")).toBeInViewport();
  await page.getByRole("button", { name: "Back to top" }).click();
  await page.getByRole("button", { name: "Open website navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

for (const width of [375, 768, 1440])
  test(`landing layout fits ${width}px and uses no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/landing-${width}.png`,
      fullPage: true,
    });
  });

test("theme and reduced-motion preferences apply to the landing page", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "How it works", exact: true }).click();
  await expect(page.locator("#the-method")).toBeInViewport();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
