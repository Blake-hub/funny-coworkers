import { test, expect } from '@playwright/test';

test.describe('Wiki - Editor Layout Features', () => {
  test.beforeEach(async ({ page, context }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await context.clearCookies();
    
    page.on('console', msg => {
      console.log(`Browser: ${msg.type()} - ${msg.text()}`);
    });
    
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', 'admin@pmis.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
  });

  test('should toggle toolbar visibility with Eye/EyeOff button on new-document-ex page', async ({ page }) => {
    await page.goto('/wiki/new-document-ex');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    await page.waitForSelector('.tiptap-editor', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const toolbar = page.locator('.flex.flex-wrap.items-center.gap-1');
    const hideToolbarBtn = page.locator('button[title="Hide Toolbar"]');
    const showToolbarBtn = page.locator('button[title="Show Toolbar"]');

    const isToolbarVisibleInitially = await toolbar.first().isVisible();
    expect(isToolbarVisibleInitially).toBe(true);

    const isHideBtnVisible = await hideToolbarBtn.isVisible();
    expect(isHideBtnVisible).toBe(true);

    const isShowBtnVisible = await showToolbarBtn.isVisible();
    expect(isShowBtnVisible).toBe(false);

    await hideToolbarBtn.click();
    await page.waitForTimeout(500);

    const isToolbarHidden = await toolbar.first().isHidden();
    expect(isToolbarHidden).toBe(true);

    const isShowBtnVisibleAfterHide = await showToolbarBtn.isVisible();
    expect(isShowBtnVisibleAfterHide).toBe(true);

    const isHideBtnVisibleAfterHide = await hideToolbarBtn.isVisible();
    expect(isHideBtnVisibleAfterHide).toBe(false);

    await showToolbarBtn.click();
    await page.waitForTimeout(500);

    const isToolbarVisibleAgain = await toolbar.first().isVisible();
    expect(isToolbarVisibleAgain).toBe(true);

    const isHideBtnVisibleAgain = await hideToolbarBtn.isVisible();
    expect(isHideBtnVisibleAgain).toBe(true);

    const isShowBtnVisibleAgain = await showToolbarBtn.isVisible();
    expect(isShowBtnVisibleAgain).toBe(false);
  });

  test('should have correct title container padding (py-2)', async ({ page }) => {
    await page.goto('/wiki/new-document-ex');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    await page.waitForSelector('.tiptap-editor', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const titleContainer = page.locator('div.px-8.py-2');
    
    const hasPy2Class = await titleContainer.first().evaluate((el) => {
      return el.classList.contains('py-2');
    });
    expect(hasPy2Class).toBe(true);

    const paddingTop = await titleContainer.first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.paddingTop);
    });
    expect(paddingTop).toBeLessThan(24);
    expect(paddingTop).toBeGreaterThanOrEqual(8);
  });

  test('should have correct tiptap-editor padding-left (30px)', async ({ page }) => {
    await page.goto('/wiki/new-document-ex');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    await page.waitForSelector('.tiptap-editor', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const paddingLeft = await page.locator('.tiptap-editor').first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.paddingLeft);
    });

    console.log('tiptap-editor padding-left:', paddingLeft);
    expect(paddingLeft).toBeLessThan(40);
    expect(paddingLeft).toBeGreaterThanOrEqual(25);
  });

  test('should have correct drag handle dimensions (height > width)', async ({ page }) => {
    await page.goto('/wiki/new-document-ex');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    await page.waitForSelector('.tiptap-editor', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const editor = page.locator('.tiptap-editor .ProseMirror');
    await editor.first().click();
    await page.waitForTimeout(500);

    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });

    const codeBlockCommand = page.locator('.slash-menu-item', { hasText: 'Code Block' });
    await codeBlockCommand.click();
    await page.waitForTimeout(1000);

    const preElement = page.locator('pre');
    const preBoundingBox = await preElement.first().boundingBox();
    if (preBoundingBox) {
      await page.mouse.move(preBoundingBox.x + preBoundingBox.width / 2, preBoundingBox.y + preBoundingBox.height / 2);
    }
    await page.waitForTimeout(500);

    const dragHandleDimensions = await page.locator('.tiptap-drag-handle').first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        width: parseFloat(style.width),
        height: parseFloat(style.height)
      };
    });

    console.log('Drag handle dimensions:', dragHandleDimensions);
    expect(dragHandleDimensions.height).toBeGreaterThan(dragHandleDimensions.width);
    expect(dragHandleDimensions.width).toBeLessThan(30);
    expect(dragHandleDimensions.height).toBeGreaterThanOrEqual(25);
  });
});