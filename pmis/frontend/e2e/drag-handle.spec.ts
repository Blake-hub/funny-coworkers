import { test, expect } from '@playwright/test';

test.describe('Wiki - Drag Handle Feature', () => {
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

  test('should not show grip-vertical icon when entering new-document page', async ({ page }) => {
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
    
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    
    await page.waitForTimeout(1000);
    
    const dragHandles = page.locator('.drag-handle');
    const dragHandleCount = await dragHandles.count();
    
    const visibleDragHandles = await dragHandles.evaluateAll((handles) => {
      return handles.filter((handle: HTMLElement | SVGElement) => {
        const style = window.getComputedStyle(handle);
        return style.opacity === '1';
      }).length;
    });
    
    console.log('Visible drag handles on page load:', visibleDragHandles);
    expect(visibleDragHandles).toBe(0);
  });

  test('should show grip-vertical icon when hovering over code block', async ({ page }) => {
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
    
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    
    await editor.first().click();
    await page.waitForTimeout(500);

    await page.keyboard.type('/');
    await page.waitForTimeout(1000);

    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });

    const codeBlockCommand = page.locator('.slash-menu-item', { hasText: 'Code Block' });
    await codeBlockCommand.click();
    await page.waitForTimeout(1000);

    await page.waitForSelector('pre', { timeout: 5000 });
    await page.waitForTimeout(1000);

    const preElement = page.locator('pre');
    const preBoundingBox = await preElement.first().boundingBox();
    
    if (preBoundingBox) {
      await page.mouse.move(preBoundingBox.x + preBoundingBox.width / 2, preBoundingBox.y + preBoundingBox.height / 2);
    }
    await page.waitForTimeout(500);

    const dragHandle = page.locator('.drag-handle');
    
    const isVisible = await dragHandle.first().evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.opacity === '1';
    });
    expect(isVisible).toBe(true);

    const svgExists = await dragHandle.locator('svg').count();
    expect(svgExists).toBeGreaterThanOrEqual(1);
  });

  test('drag handle position should be correctly aligned with hovered segment', async ({ page }) => {
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
    
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    
    await editor.first().click();
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    
    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    
    const codeBlockCommand = page.locator('.slash-menu-item', { hasText: 'Code Block' });
    await codeBlockCommand.click();
    await page.waitForTimeout(1000);
    
    const preElement = page.locator('pre');
    await preElement.first().waitFor({ state: 'visible' });
    
    const preBoundingBox = await preElement.first().boundingBox();
    if (preBoundingBox) {
      await page.mouse.move(preBoundingBox.x + preBoundingBox.width / 2, preBoundingBox.y + preBoundingBox.height / 2);
    }
    await page.waitForTimeout(500);
    
    const positions = await page.evaluate(() => {
      const handle = document.querySelector('.drag-handle') as HTMLElement;
      const pre = document.querySelector('pre') as HTMLElement;
      
      if (!handle || !pre) {
        return null;
      }
      
      const handleRect = handle.getBoundingClientRect();
      const preRect = pre.getBoundingClientRect();
      
      const spaceBetween = 4;
      const expectedHandleX = preRect.left - handleRect.width - spaceBetween;
      
      return {
        handleX: handleRect.left,
        handleY: handleRect.top,
        segmentX: preRect.left,
        segmentY: preRect.top,
        handleWidth: handleRect.width,
        handleHeight: handleRect.height,
        expectedHandleX: expectedHandleX,
      };
    });
    
    expect(positions).not.toBeNull();
    const yDifference = Math.abs(positions!.handleY - positions!.segmentY);
    expect(yDifference).toBeLessThan(10);
    const xDifference = Math.abs(positions!.handleX - positions!.expectedHandleX);
    expect(xDifference).toBeLessThan(30);
  });

  test('should show only one grip-vertical icon when hovering over a segment', async ({ page }) => {
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
    
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    
    await editor.first().click();
    
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.locator('.slash-menu').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Code Block' }).click();
    await page.waitForTimeout(1000);
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    await page.keyboard.type('Second code');
    await page.waitForTimeout(500);
    
    const preElements = page.locator('pre');
    const preCount = await preElements.count();
    console.log('Number of code blocks:', preCount);
    
    await preElements.first().waitFor({ state: 'visible' });
    const firstPreBoundingBox = await preElements.first().boundingBox();
    if (firstPreBoundingBox) {
      await page.mouse.move(firstPreBoundingBox.x + firstPreBoundingBox.width / 2, firstPreBoundingBox.y + firstPreBoundingBox.height / 2);
    }
    await page.waitForTimeout(500);
    
    const visibleDragHandles = await page.locator('.drag-handle').evaluateAll((handles) => {
      return handles.filter((handle: HTMLElement | SVGElement) => {
        const style = window.getComputedStyle(handle);
        return style.opacity === '1';
      }).length;
    });
    
    console.log('Visible drag handles:', visibleDragHandles);
    expect(visibleDragHandles).toBe(1);
  });

  test('should hide all grip-vertical icons when not hovering over any segment', async ({ page }) => {
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
    
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    
    await editor.first().click();
    
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
    
    const visibleDuringHover = await page.locator('.drag-handle').evaluateAll((handles) => {
      return handles.filter((handle: HTMLElement | SVGElement) => {
        const style = window.getComputedStyle(handle);
        return style.opacity === '1';
      }).length;
    });
    expect(visibleDuringHover).toBe(1);
    
    await page.mouse.move(10, 10);
    await page.waitForTimeout(500);
    
    const visibleAfterHover = await page.locator('.drag-handle').evaluateAll((handles) => {
      return handles.filter((handle: HTMLElement | SVGElement) => {
        const style = window.getComputedStyle(handle);
        return style.opacity === '1';
      }).length;
    });
    
    console.log('Visible drag handles after moving away:', visibleAfterHover);
    expect(visibleAfterHover).toBe(0);
  });
});