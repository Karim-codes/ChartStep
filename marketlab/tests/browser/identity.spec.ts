import { test, expect } from "@playwright/test";

test("ChartStep identity continues through every workspace and both appearances", async ({
  page,
}) => {
  await page.goto("/#learn");
  for (const theme of ["light", "dark"] as const) {
    if (theme === "dark")
      await page.getByRole("button", { name: "Switch to dark mode" }).click();
    for (const route of [
      "learn",
      "pathways",
      "library",
      "replay",
      "trading",
      "progress",
      "pricing",
    ]) {
      await page.goto(`/#${route}`);
      await expect(
        page.getByRole("button", { name: "ChartStep home" }),
      ).toBeVisible();
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/marketlab/i);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      if (["pathways", "progress", "pricing", "replay"].includes(route)) {
        await page.screenshot({
          path: `docs/screenshots/chartstep-${route}-${theme}.png`,
        });
      }
    }
  }
});

test("mobile navigation closes fully and the same identity returns to the public site", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/#trading");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "ChartStep home" }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "My learning", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make sense of the market." }),
  ).toBeVisible();
  await expect(page.locator(".sidebar")).not.toBeInViewport();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page.getByRole("button", { name: "ChartStep home" }).click();
  await expect(
    page.getByRole("link", { name: "ChartStep home", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/marketlab/i);
});
