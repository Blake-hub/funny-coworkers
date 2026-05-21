import { test, expect } from '@playwright/test';

test.describe('Create Issue Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'admin@pmis.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
  });

  test('should have default height of 300px without scroll bar', async ({ page }) => {
    await page.goto('/issues');
    
    await page.click('[data-testid="create-issue-button"]');
    
    const dialog = page.locator('[data-testid="create-issue-dialog"]');
    await expect(dialog).toBeVisible();
    
    const box = await dialog.boundingBox();
    console.log('Dialog height:', box?.height);
    
    expect(box?.height).toBe(300);
    
    const editor = page.locator('[data-testid="issue-description-editor"]');
    const hasScrollbar = await editor.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overflowY !== 'hidden' && el.scrollHeight > el.clientHeight;
    });
    
    console.log('Editor has scrollbar:', hasScrollbar);
    expect(hasScrollbar).toBe(false);
  });

  test('should expand as text is typed', async ({ page }) => {
    await page.goto('/issues');
    
    await page.click('[data-testid="create-issue-button"]');
    
    const dialog = page.locator('[data-testid="create-issue-dialog"]');
    
    const initialBox = await dialog.boundingBox();
    console.log('Initial dialog height:', initialBox?.height);
    
    const proseMirrorEditor = page.locator('.ProseMirror');
    const longText = 'This is a very long description '.repeat(20);
    await proseMirrorEditor.type(longText);
    
    await page.waitForTimeout(500);
    
    const expandedBox = await dialog.boundingBox();
    console.log('Expanded dialog height:', expandedBox?.height);
    
    expect(expandedBox?.height).toBeGreaterThan(initialBox?.height ?? 0);
  });

  test('should show scrollbar on text editor when at max height', async ({ page }) => {
    await page.goto('/issues');
    
    await page.click('[data-testid="create-issue-button"]');
    
    const dialog = page.locator('[data-testid="create-issue-dialog"]');
    const editor = page.locator('[data-testid="issue-description-editor"]');
    
    const proseMirrorEditor = page.locator('.ProseMirror');
    const veryLongText = 'This is an extremely long description '.repeat(100);
    await proseMirrorEditor.type(veryLongText);
    
    await page.waitForTimeout(500);
    
    const box = await dialog.boundingBox();
    console.log('Dialog height at max:', box?.height);
    
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const maxDialogHeight = viewportHeight * 0.8;
    
    expect(box?.height).toBeLessThanOrEqual(maxDialogHeight + 10);
    
    const editorScrollHeight = await editor.evaluate((el) => {
      return (el as HTMLElement).scrollHeight;
    });
    const editorClientHeight = await editor.evaluate((el) => {
      return (el as HTMLElement).clientHeight;
    });
    
    console.log('Editor scrollHeight:', editorScrollHeight);
    console.log('Editor clientHeight:', editorClientHeight);
    
    expect(editorScrollHeight).toBeGreaterThan(editorClientHeight);
  });

  test('should have all four corners rounded', async ({ page }) => {
    await page.goto('/issues');
    
    await page.click('[data-testid="create-issue-button"]');
    
    const dialog = page.locator('[data-testid="create-issue-dialog"]');
    
    const borderRadius = await dialog.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    
    console.log('Dialog border-radius:', borderRadius);
    expect(borderRadius).not.toBe('0px');
  });

  test('should be centered on screen', async ({ page }) => {
    await page.goto('/issues');
    
    await page.click('[data-testid="create-issue-button"]');
    
    const dialog = page.locator('[data-testid="create-issue-dialog"]');
    const box = await dialog.boundingBox();
    
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    const dialogCenterX = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const dialogCenterY = (box?.y ?? 0) + (box?.height ?? 0) / 2;
    
    console.log('Dialog center X:', dialogCenterX);
    console.log('Viewport center X:', viewportWidth / 2);
    console.log('Dialog center Y:', dialogCenterY);
    console.log('Viewport center Y:', viewportHeight / 2);
    
    expect(dialogCenterX).toBeCloseTo(viewportWidth / 2, -1);
    expect(dialogCenterY).toBeCloseTo(viewportHeight / 2, -1);
  });
});