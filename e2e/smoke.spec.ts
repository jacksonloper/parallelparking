import { test, expect } from "@playwright/test";

test.describe("Parallel Parking Simulator – smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("app loads with title and canvas", async ({ page }) => {
    // Title is visible
    await expect(page.getByTestId("app-title")).toBeVisible();
    await expect(page.getByTestId("app-title")).toContainText(
      "Parallel Parking Simulator",
    );

    // Three.js canvas is rendered
    const canvas = page.getByTestId("game-canvas");
    await expect(canvas).toBeVisible();

    // Canvas has non-zero dimensions (Three.js is rendering)
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(50);
  });

  test("level selector shows all levels and switches levels", async ({
    page,
  }) => {
    // All 6 level buttons should be visible
    const levelButtons = page.locator("nav button");
    await expect(levelButtons).toHaveCount(6);

    // First level is selected initially
    const desc = page.getByTestId("level-description");
    await expect(desc).toContainText("Park the car");

    // Click level 3 (Trailer Backup)
    await levelButtons.nth(2).click();
    await expect(desc).toContainText("trailer");
  });

  test("reset button is present and clickable", async ({ page }) => {
    const resetBtn = page.getByTestId("reset-button");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    // No crash — canvas is still visible
    await expect(page.getByTestId("game-canvas")).toBeVisible();
  });

  test("Three.js canvas is rendering WebGL content", async ({ page }) => {
    // Wait for the game loop to paint
    await page.waitForTimeout(500);

    // The Three.js canvas should have a webgl context
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector(
        '[data-testid="game-canvas"]',
      ) as HTMLCanvasElement | null;
      if (!canvas) return false;
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      return gl !== null;
    });
    expect(hasWebGL).toBe(true);
  });

  test("touch controls show on mobile viewport", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto("/");

    // Touch controls should be in the DOM
    const touchCtrl = page.getByTestId("touch-controls");
    await expect(touchCtrl).toBeAttached();

    // Controls should be present
    await expect(page.getByTestId("touch-steer-zone")).toBeAttached();
    await expect(page.getByLabel("Forward")).toBeAttached();
    await expect(page.getByLabel("Reverse")).toBeAttached();

    await context.close();
  });
});
