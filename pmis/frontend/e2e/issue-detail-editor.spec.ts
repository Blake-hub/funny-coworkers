import { test, expect, Page } from '@playwright/test';

test.describe('Issue Detail - Description Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@pmis.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    await page.waitForNavigation();
    await page.waitForURL(/\/(dashboard|issues)$/);
  });

  test('should enter edit mode with single click, save on outside click, show one toast', async ({ page }) => {
    const editor = page.locator('[data-testid="issue-description-editor"]');

    await page.goto('/issues');
    await page.waitForTimeout(1000);
    await page.goto('/issues/6');
    await page.waitForSelector('text=Description', { timeout: 1000 });

    await editor.waitFor({ state: 'visible', timeout: 5000 });
    const editorContent = page.locator('[data-testid="issue-description-editor"] .ProseMirror');
    await editorContent.waitFor({ state: 'visible', timeout: 5000 });
    await editorContent.click();
    await page.waitForTimeout(500);
    await expect(editorContent).toBeFocused();

    await page.keyboard.type('extra text');

    const editorBoundingBox = await editor.boundingBox();
    if (editorBoundingBox) {
      await page.mouse.click(editorBoundingBox.x - 10, editorBoundingBox.y + editorBoundingBox.height / 2);
    }

    const toast = page.locator('text=Changes saved');
    await toast.waitFor({ timeout: 3000 });

    await page.waitForTimeout(1000);
    const toastCount = await toast.count();
    expect(toastCount).toBe(1);
  });

  test('should save on Enter key press', async ({ page }) => {
    await page.goto('/issues');
    await page.waitForTimeout(1000);
    await page.goto('/issues/6');
    await page.waitForSelector('text=Description', { timeout: 10000 });

    await page.click('div:has-text("Write a description for this issue...")', { force: true });
    await page.keyboard.type('test content');
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=Changes saved', { timeout: 3000 });
  });

  test('should abort changes on ESC key press', async ({ page }) => {
    await page.goto('/issues');
    await page.waitForTimeout(1000);
    await page.goto('/issues/6');
    await page.waitForSelector('text=Description', { timeout: 10000 });

    await page.click('div:has-text("Write a description for this issue...")', { force: true });
    await page.keyboard.type('discarded text');
    await page.keyboard.press('Escape');

    await page.waitForTimeout(1000);
    const toast = page.locator('text=Changes saved');
    expect(await toast.count()).toBe(0);

    const descriptionText = await page.textContent('div:has-text("Write a description for this issue...")');
    expect(descriptionText).not.toContain('discarded text');
  });

  test('should exit edit mode without saving when clicking outside left edge', async ({ page }) => {
    const editor = page.locator('[data-testid="issue-description-editor"]');

    await page.goto('/issues');
    await page.waitForTimeout(1000);
    await page.goto('/issues/6');
    await page.waitForSelector('text=Description', { timeout: 10000 });

    // Click to enter edit mode
    await page.click('div:has-text("Write a description for this issue...")', { force: true });
    // Verify editor IS focused (edit mode)
    expect(await editor.evaluate(e => document.activeElement === e)).toBe(true);

    // Click outside (10px left of editor midline)
    const editorBoundingBox = await editor.boundingBox();
    if (editorBoundingBox) {
      await page.mouse.click(editorBoundingBox.x - 10, editorBoundingBox.y + editorBoundingBox.height / 2);
    }

    await page.waitForTimeout(1000);

    // Verify no toast (no database save)
    const toast = page.locator('text=Changes saved');
    expect(await toast.count()).toBe(0);

    // Verify editor is NOT focused (exited edit mode)
    expect(await editor.evaluate(e => document.activeElement === e)).toBe(false);
  });

  test('should exit edit mode without saving when clicking outside top edge', async ({ page }) => {
    const editor = page.locator('[data-testid="issue-description-editor"]');

    await page.goto('/issues');
    await page.waitForTimeout(1000);
    await page.goto('/issues/6');
    await page.waitForSelector('text=Description', { timeout: 10000 });

    // Click to enter edit mode
    await page.click('div:has-text("Write a description for this issue...")', { force: true });
    // Verify editor IS focused (edit mode)
    expect(await editor.evaluate(e => document.activeElement === e)).toBe(true);

    // Click outside (10px above editor midline)
    const editorBoundingBox = await editor.boundingBox();
    if (editorBoundingBox) {
      await page.mouse.click(editorBoundingBox.x + editorBoundingBox.width / 2, editorBoundingBox.y - 10);
    }

    await page.waitForTimeout(1000);

    // Verify no toast (no database save)
    const toast = page.locator('text=Changes saved');
    expect(await toast.count()).toBe(0);

    // Verify editor is NOT focused (exited edit mode)
    expect(await editor.evaluate(e => document.activeElement === e)).toBe(false);
  });

  test('should exit edit mode without saving when clicking outside bottom edge', async ({ page }) => {
    const editor = page.locator('[data-testid="issue-description-editor"]');

    await page.goto('/issues');
    await page.waitForTimeout(1000);
    await page.goto('/issues/6');
    await page.waitForSelector('text=Description', { timeout: 10000 });

    // Click to enter edit mode
    await page.click('div:has-text("Write a description for this issue...")', { force: true });
    // Verify editor IS focused (edit mode)
    expect(await editor.evaluate(e => document.activeElement === e)).toBe(true);

    // Click outside (10px below editor)
    const editorBoundingBox = await editor.boundingBox();
    if (editorBoundingBox) {
      await page.mouse.click(editorBoundingBox.x + editorBoundingBox.width / 2, editorBoundingBox.y + editorBoundingBox.height + 10);
    }

    await page.waitForTimeout(1000);

    // Verify no toast (no database save)
    const toast = page.locator('text=Changes saved');
    expect(await toast.count()).toBe(0);

    // Verify editor is NOT focused (exited edit mode)
    expect(await editor.evaluate(e => document.activeElement === e)).toBe(false);
  });

  test('should exit edit mode without saving when clicking outside right edge', async ({ page }) => {
    const editor = page.locator('[data-testid="issue-description-editor"]');

    await page.goto('/issues');
    await page.waitForTimeout(1000);
    await page.goto('/issues/6');
    await page.waitForSelector('text=Description', { timeout: 10000 });

    // Click to enter edit mode
    await page.click('div:has-text("Write a description for this issue...")', { force: true });
    // Verify editor IS focused (edit mode)
    expect(await editor.evaluate(e => document.activeElement === e)).toBe(true);

    // Click outside (10px right of editor midline)
    const editorBoundingBox = await editor.boundingBox();
    if (editorBoundingBox) {
      await page.mouse.click(editorBoundingBox.x + editorBoundingBox.width + 10, editorBoundingBox.y + editorBoundingBox.height / 2);
    }

    await page.waitForTimeout(1000);

    // Verify no toast (no database save)
    const toast = page.locator('text=Changes saved');
    expect(await toast.count()).toBe(0);

    // Verify editor is NOT focused (exited edit mode)
    expect(await editor.evaluate(e => document.activeElement === e)).toBe(false);
  });

  test('should enter edit mode with single click', async ({ page }) => {
    const editor = page.locator('[data-testid="issue-description-editor"]');

    await page.goto('/issues');
    await page.waitForTimeout(1000);
    await page.goto('/issues/6');
    await page.waitForSelector('text=Description', { timeout: 10000 });

    await page.click('div:has-text("Write a description for this issue...")', { force: true });
    await expect(editor).toBeFocused({ timeout: 1000 });

    const isFocused = await editor.evaluate(e => document.activeElement === e);
    expect(isFocused).toBe(true);
  });
});