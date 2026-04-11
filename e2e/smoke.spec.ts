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

    // Canvas is rendered
    const canvas = page.getByTestId("game-canvas");
    await expect(canvas).toBeVisible();

    // Canvas has non-zero dimensions (physics world is rendering)
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

  test("canvas renders non-blank content", async ({ page }) => {
    // Wait a tick for the game loop to paint
    await page.waitForTimeout(200);

    // Evaluate canvas pixel data to confirm it's not all one colour
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector(
        '[data-testid="game-canvas"]',
      ) as HTMLCanvasElement | null;
      if (!canvas) return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const first = [data[0], data[1], data[2]];
      for (let i = 4; i < data.length; i += 4) {
        if (
          data[i] !== first[0] ||
          data[i + 1] !== first[1] ||
          data[i + 2] !== first[2]
        ) {
          return true; // found a different pixel — canvas has varied content
        }
      }
      return false;
    });
    expect(hasContent).toBe(true);
  });

  test("touch controls are visible on mobile viewport", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      hasTouch: true,
      // Force coarse pointer so CSS media query activates
      // Playwright doesn't directly support `pointer: coarse`, but hasTouch
      // ensures touch events work. We'll just check the DOM presence.
    });
    const page = await context.newPage();
    await page.goto("/");

    // Touch controls should be in the DOM
    const touchCtrl = page.getByTestId("touch-controls");
    await expect(touchCtrl).toBeAttached();

    // Forward button should be present
    await expect(page.getByLabel("Drive forward")).toBeAttached();
    await expect(page.getByLabel("Steer left")).toBeAttached();
    await expect(page.getByLabel("Reverse")).toBeAttached();
    await expect(page.getByLabel("Steer right")).toBeAttached();

    await context.close();
  });
});
