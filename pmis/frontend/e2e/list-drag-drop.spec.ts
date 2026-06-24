import { test, expect } from '@playwright/test';

test.describe('Rich Text Editor - List Drag and Drop', () => {
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

  test('drag bullet list below ordered list with empty line between', async ({ page }) => {
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
    await page.waitForTimeout(500);
    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });

    const bulletListCommand = page.locator('.slash-menu-item', { hasText: 'Bullet List' });
    await bulletListCommand.click();
    await page.waitForTimeout(1000);

    await page.keyboard.type('bullet item1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    await page.keyboard.type('bullet item2');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    await page.keyboard.type('paragraphs');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });

    const orderedListCommand = page.locator('.slash-menu-item', { hasText: 'Ordered List' });
    await orderedListCommand.click();
    await page.waitForTimeout(1000);

    await page.keyboard.type('ordered item 1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    await page.keyboard.type('ordered item 2');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    await page.keyboard.type('ordered item 3');
    await page.waitForTimeout(500);

    const initialStructure = await page.evaluate(() => {
      const editor = document.querySelector('.tiptap, .ProseMirror, [contenteditable="true"]');
      if (!editor) return null;
      
      const blocks: Array<{ tag: string; text: string; isEmpty: boolean }> = [];
      const elements = editor.querySelectorAll('p, ul, ol');
      
      elements.forEach(el => {
        const text = el.textContent?.trim() || '';
        blocks.push({
          tag: el.tagName.toLowerCase(),
          text: text,
          isEmpty: text === ''
        });
      });
      
      return blocks;
    });

    console.log('Initial structure:', JSON.stringify(initialStructure, null, 2));

    const ulElement = page.locator('ul').nth(0);
    const ulBox = await ulElement.boundingBox();
    if (!ulBox) {
      throw new Error('Could not get bounding box for bullet list');
    }

    const dragHandleX = ulBox.x + 10;
    const dragHandleY = ulBox.y + ulBox.height / 2;

    await page.mouse.move(dragHandleX, dragHandleY);
    await page.waitForTimeout(200);

    const olElement = page.locator('ol').nth(0);
    const olBox = await olElement.boundingBox();
    if (!olBox) {
      throw new Error('Could not get bounding box for ordered list');
    }

    const dropTargetX = olBox.x + 50;
    const dropTargetY = olBox.y + olBox.height + 20;

    await page.mouse.down({ button: 'left' });
    await page.waitForTimeout(100);

    await page.mouse.move(dropTargetX, dropTargetY, { steps: 20 });
    await page.waitForTimeout(200);

    const dropIndicatorVisible = await page.locator('.drop-indicator').isVisible();
    console.log('Drop indicator visible:', dropIndicatorVisible);

    await page.mouse.up();
    await page.waitForTimeout(500);

    const finalStructure = await page.evaluate(() => {
      const editor = document.querySelector('.tiptap, .ProseMirror, [contenteditable="true"]');
      if (!editor) return null;
      
      const blocks: Array<{ tag: string; text: string; isEmpty: boolean }> = [];
      const elements = editor.querySelectorAll('p, ul, ol');
      
      elements.forEach(el => {
        const text = el.textContent?.trim() || '';
        blocks.push({
          tag: el.tagName.toLowerCase(),
          text: text,
          isEmpty: text === ''
        });
      });
      
      return blocks;
    });

    console.log('Final structure:', JSON.stringify(finalStructure, null, 2));

    expect(finalStructure).not.toBeNull();
    
    const pIndex = finalStructure!.findIndex(b => b.tag === 'p' && b.text === 'paragraphs');
    const olIndex = finalStructure!.findIndex(b => b.tag === 'ol');
    const ulIndex = finalStructure!.findIndex(b => b.tag === 'ul');

    expect(pIndex).not.toBe(-1);
    expect(olIndex).not.toBe(-1);
    expect(ulIndex).not.toBe(-1);
    expect(pIndex).toBeLessThan(olIndex);
    expect(olIndex).toBeLessThan(ulIndex);

    const emptyLinesAfterOl = finalStructure!.slice(olIndex + 1, ulIndex);
    const hasExtraEmptyLines = emptyLinesAfterOl.some(b => b.tag === 'p' && b.isEmpty);
    expect(hasExtraEmptyLines).toBe(false);
  });
});