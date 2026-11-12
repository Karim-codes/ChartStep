import { chromium } from "@playwright/test";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  for (const route of ["trading", "learn", "library", "home"]) {
    await page.goto(`http://localhost:5174/#${route}`);
    await page
      .locator(route === "home" ? ".lp-hero" : ".workspace-design")
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
    if (route === "trading")
      await page.getByRole("button", { name: "Pause replay" }).click();
    await page.screenshot({
      path: `docs/screenshots/chartstep-${route}-desktop.png`,
      fullPage: route !== "trading",
    });
  }
  await page.goto("http://localhost:5174/#trading");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: "docs/screenshots/chartstep-trading-dark.png",
  });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "docs/screenshots/chartstep-trading-mobile.png",
    fullPage: true,
  });
  console.log(
    await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
    })),
  );
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("http://localhost:5174/docs/brand/identity.html");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "docs/brand/chartstep-identity.png" });
} finally {
  await browser.close();
}
