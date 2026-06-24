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

  test('blockquote drag handle should be left-aligned with other blocks', async ({ page }) => {
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
    
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    
    await editor.first().click();
    await page.waitForTimeout(500);

    // Create a bullet list
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Bullet List' }).click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('bullet item1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('bullet item2');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');  // Exit list and create empty paragraph
    await page.waitForTimeout(200);
    
    // Type text and then use slash command for Quote
    await page.keyboard.type('paragraph');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Now use slash command to create Quote
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Quote' }).click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('quoted text');
    await page.waitForTimeout(500);

    // Verify positions
    const positions = await page.evaluate(() => {
      const bulletList = document.querySelector('ul');
      const blockquote = document.querySelector('blockquote');
      const allDragHandles = document.querySelectorAll('.drag-handle');
      
      if (!bulletList || !blockquote || allDragHandles.length === 0) {
        return null;
      }

      // Get the block bounding rects
      const bulletRect = bulletList.getBoundingClientRect();
      const blockquoteRect = blockquote.getBoundingClientRect();
      
      // Get quote bar position (left edge of blockquote)
      // The quote bar is the border-left of the blockquote, which is drawn at the left edge
      const quoteBarLeft = blockquoteRect.left;
      
      // Get bullet marker position (left edge of bullet list + padding-left)
      // Since list-style-position: inside, bullets appear at the content edge (after padding)
      const bulletListComputedStyle = window.getComputedStyle(bulletList);
      const bulletPaddingLeft = parseFloat(bulletListComputedStyle.paddingLeft) || 0;
      const bulletMarkerLeft = bulletRect.left + bulletPaddingLeft;
      
      // Find drag handles by looking for siblings of blocks
      let bulletHandleLeft = null;
      let blockquoteHandleLeft = null;
      
      allDragHandles.forEach((handle) => {
        const handleRect = handle.getBoundingClientRect();
        const handleTop = handleRect.top;
        const handleBottom = handleRect.bottom;
        
        // Check if this handle is at the same vertical position as the bullet list
        const bulletTop = bulletRect.top;
        const bulletBottom = bulletRect.bottom;
        
        // Check if this handle is at the same vertical position as the blockquote
        const blockquoteTop = blockquoteRect.top;
        const blockquoteBottom = blockquoteRect.bottom;
        
        // If handle is vertically aligned with bullet list
        if (handleTop >= bulletTop - 5 && handleBottom <= bulletBottom + 5) {
          bulletHandleLeft = handleRect.left;
        }
        
        // If handle is vertically aligned with blockquote
        if (handleTop >= blockquoteTop - 5 && handleBottom <= blockquoteBottom + 5) {
          blockquoteHandleLeft = handleRect.left;
        }
      });

      return {
        // Quote bar position (vertical line)
        quoteBarLeft: quoteBarLeft,
        // Bullet marker position
        bulletMarkerLeft: bulletMarkerLeft,
        // Drag handle positions
        bulletHandleLeft: bulletHandleLeft,
        blockquoteHandleLeft: blockquoteHandleLeft,
      };
    });

    expect(positions).not.toBeNull();
    
    // Test 1: Quote bar (vertical line) is left aligned with bullet markers
    // The quote bar should appear at the same horizontal position as the bullet markers
    expect(positions!.quoteBarLeft).toBe(positions!.bulletMarkerLeft);
    
    // Test 2: A quote block should only have one drag handle
    // Verify that exactly one drag handle is vertically associated with the blockquote
    expect(positions!.blockquoteHandleLeft).not.toBeNull();
    
    // Test 3: Quote block's drag handle should align with bullet's drag handle
    expect(positions!.blockquoteHandleLeft).toBe(positions!.bulletHandleLeft);
  });

  test('table drag handle should be left-aligned with other blocks', async ({ page }) => {
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
    
    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    
    await editor.first().click();
    await page.waitForTimeout(500);

    // Create a bullet list
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Bullet List' }).click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('bullet item1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('bullet item2');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    
    // Type text and then use slash command for Table
    await page.keyboard.type('paragraph');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Now use slash command to create Table
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Insert Table' }).click();
    await page.waitForTimeout(1500);
    
    // Type something in the first cell
    await page.keyboard.type('table cell');
    await page.waitForTimeout(500);

    // Verify positions
    const positions = await page.evaluate(() => {
      const bulletList = document.querySelector('ul');
      const table = document.querySelector('table');
      const allDragHandles = document.querySelectorAll('.drag-handle');
      
      if (!bulletList || !table || allDragHandles.length === 0) {
        return null;
      }

      // Get the block bounding rects
      const bulletRect = bulletList.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();
      
      // Get bullet marker position (left edge of bullet list + padding-left)
      const bulletListComputedStyle = window.getComputedStyle(bulletList);
      const bulletPaddingLeft = parseFloat(bulletListComputedStyle.paddingLeft) || 0;
      const bulletMarkerLeft = bulletRect.left + bulletPaddingLeft;
      
      // Get table left edge position
      // Table has margin-left: 24px, so its left edge should align with bullet markers
      const tableLeftEdge = tableRect.left;
      
      // Find drag handles by looking at vertical positions
      let bulletHandleLeft = null;
      let tableHandleLeft = null;
      
      // Get all drag handles with their positions
      const dragHandlesInfo: Array<{left: number, top: number, bottom: number}> = [];
      allDragHandles.forEach((handle) => {
        const handleRect = handle.getBoundingClientRect();
        dragHandlesInfo.push({
          left: handleRect.left,
          top: handleRect.top,
          bottom: handleRect.bottom
        });
      });
      
      // Sort drag handles by top position
      dragHandlesInfo.sort((a, b) => a.top - b.top);
      
      const bulletTop = bulletRect.top;
      const tableTop = tableRect.top;
      
      // Find closest drag handle to bullet list top
      let minBulletDist = Infinity;
      let minTableDist = Infinity;
      
      for (const handle of dragHandlesInfo) {
        const distToBullet = Math.abs(handle.top - bulletTop);
        const distToTable = Math.abs(handle.top - tableTop);
        
        if (distToBullet < minBulletDist && distToBullet < 50) {
          minBulletDist = distToBullet;
          bulletHandleLeft = handle.left;
        }
        
        if (distToTable < minTableDist && distToTable < 50) {
          minTableDist = distToTable;
          tableHandleLeft = handle.left;
        }
      }

      return {
        // Table left edge should align with bullet markers
        tableLeftEdge: tableLeftEdge,
        bulletMarkerLeft: bulletMarkerLeft,
        // Drag handle positions
        bulletHandleLeft: bulletHandleLeft,
        tableHandleLeft: tableHandleLeft,
      };
    });

    expect(positions).not.toBeNull();
    
    // Test 1: A table should only have one drag handle (check for drag handle before the table)
    // The drag handle is a sibling widget inserted before the table element
    const tableHandlesInside = await page.locator('table .drag-handle').count();
    expect(tableHandlesInside).toBe(0); // No drag handles inside table
    // There should be exactly 1 drag handle associated with the table (found by vertical position matching)
    expect(positions!.tableHandleLeft).not.toBeNull();
    
    // Test 2: Table should left align with bullets (taking ul padding-left into account)
    // Table left edge should equal bullet marker position
    expect(positions!.tableLeftEdge).toBe(positions!.bulletMarkerLeft);
    
    // Test 3: Table's drag handle should align with bullet's drag handle
    expect(positions!.tableHandleLeft).toBe(positions!.bulletHandleLeft);
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