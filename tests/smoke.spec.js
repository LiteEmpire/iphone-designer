import { test, expect } from "@playwright/test";

test("3D preview boots and core design controls work", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page).toHaveTitle(/phoneLab.*iPhone Designer/i);
  await expect(page.locator("#modelSelect")).toBeVisible();
  await expect(page.locator("#canvasWrap canvas")).toBeVisible();

  // A visible loading label after init means WebGL or the Three.js module failed.
  await expect(page.locator("#loadingLabel")).toBeHidden();

  await page.locator("#modelSelect").selectOption({ label: "iPhone 15 Pro" });
  await expect(page.locator("#previewTitle")).toHaveText("iPhone 15 Pro");
  await expect(page.locator("#previewSubtitle")).toContainText("146.6 × 70.6 × 8.25 mm");

  await page.getByRole("button", { name: "Show back" }).click();
  await page.getByRole("button", { name: "Show front" }).click();

  await page.locator("#caseToggle").check();
  await page.locator("#stickerToggle").check();
  await page.getByRole("button", { name: "Save design" }).click();
  await expect(page.locator("#savedCount")).toHaveText("1");
  await expect(page.locator("#savedDesigns")).toContainText("iPhone 15 Pro");

  expect(pageErrors, "uncaught browser JavaScript errors").toEqual([]);
});

test("PNG export produces a downloadable image", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#canvasWrap canvas")).toBeVisible();
  await expect(page.locator("#loadingLabel")).toBeHidden();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#downloadImage").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});
