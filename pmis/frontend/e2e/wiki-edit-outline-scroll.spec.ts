import { test, expect } from '@playwright/test';

test.describe('Wiki Document Outline Scroll in Edit Page', () => {
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

  test('clicking outline item scrolls heading to viewport top in edit page', async ({ page }) => {
    test.setTimeout(120000);

    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);

    const titleInput = page.locator('input[placeholder="Enter document title..."]');
    await titleInput.fill('Test Document - Outline Scroll Verification');
    await page.waitForTimeout(200);

    const fillerParagraph = '<p>' + 'Line of text to fill space. '.repeat(10) + '</p>';
    const fillerContent = fillerParagraph.repeat(50);

    const htmlContent = `
      <h1>Chapter 1: Introduction</h1>
      ${fillerContent}
      <h1>Chapter 2: Main Content</h1>
      ${fillerContent}
      <h1>Chapter 3: Conclusion</h1>
      ${fillerContent}
    `;

    await page.evaluate((html) => {
      const tiptapEditor = document.querySelector('.tiptap-editor .ProseMirror');
      if (tiptapEditor) {
        tiptapEditor.innerHTML = html;
      }
    }, htmlContent);

    await page.waitForTimeout(1000);

    const saveButton = page.locator('button:has-text("Save Draft")');
    await saveButton.click();
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    expect(currentUrl).toContain('/wiki/');
    expect(currentUrl).toContain('/edit');

    const urlParts = currentUrl.split('/');
    const docId = urlParts[urlParts.length - 2];
    console.log(`Document saved with ID: ${docId}`);

    await page.waitForTimeout(2000);

    const outlineItems = page.locator('.outline-item');
    const outlineCount = await outlineItems.count();
    console.log(`Number of outline items found: ${outlineCount}`);
    
    expect(outlineCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < outlineCount; i++) {
      const text = await outlineItems.nth(i).textContent();
      console.log(`Outline item ${i}: ${text}`);
    }
    
    await page.waitForTimeout(500);

    const chapter2Item = outlineItems.filter({ hasText: 'Chapter 2: Main Content' }).first();
    await chapter2Item.waitFor({ state: 'visible', timeout: 5000 });
    await chapter2Item.click();
    await page.waitForTimeout(2000);

    const headingTop = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1');
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        if (heading.textContent?.includes('Chapter 2: Main Content')) {
          const rect = heading.getBoundingClientRect();
          return rect.top;
        }
      }
      return null;
    });
    console.log(`Chapter 2 heading top position: ${headingTop}`);
    
    expect(headingTop).not.toBeNull();
    expect(headingTop).toBeLessThan(200);

    console.log('Outline scroll test passed!');
  });

  test('clicking outline item applies visual highlight effect to target heading', async ({ page }) => {
    test.setTimeout(120000);

    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);

    const titleInput = page.locator('input[placeholder="Enter document title..."]');
    await titleInput.fill('Test Document - Highlight Effect');
    await page.waitForTimeout(200);

    const fillerParagraph = '<p>' + 'Line of text to fill space. '.repeat(10) + '</p>';
    const fillerContent = fillerParagraph.repeat(30);

    const htmlContent = `
      <h1>Chapter 1: Introduction</h1>
      ${fillerContent}
      <h1>Chapter 2: Main Content</h1>
      ${fillerContent}
      <h1>Chapter 3: Conclusion</h1>
      ${fillerContent}
    `;

    await page.evaluate((html) => {
      const tiptapEditor = document.querySelector('.tiptap-editor .ProseMirror');
      if (tiptapEditor) {
        tiptapEditor.innerHTML = html;
      }
    }, htmlContent);

    await page.waitForTimeout(1000);

    const saveButton = page.locator('button:has-text("Save Draft")');
    await saveButton.click();
    await page.waitForTimeout(3000);

    await page.waitForTimeout(2000);

    const outlineItems = page.locator('.outline-item');
    const chapter2Item = outlineItems.filter({ hasText: 'Chapter 2: Main Content' }).first();
    await chapter2Item.waitFor({ state: 'visible', timeout: 5000 });

    const hasHighlightOverlay = async () => {
      return page.evaluate(() => {
        const overlay = document.querySelector('.heading-highlight-overlay');
        return overlay !== null;
      });
    };

    const overlayExistsBeforeClick = await hasHighlightOverlay();
    console.log(`Highlight overlay before click: ${overlayExistsBeforeClick}`);
    expect(overlayExistsBeforeClick).toBe(false);

    await chapter2Item.click();

    await page.waitForTimeout(500);

    const overlayExistsAfterClick = await hasHighlightOverlay();
    console.log(`Highlight overlay after 500ms: ${overlayExistsAfterClick}`);
    expect(overlayExistsAfterClick).toBe(true);

    await page.waitForTimeout(1000);

    const overlayExistsDuringAnimation = await hasHighlightOverlay();
    console.log(`Highlight overlay during animation (1.5s): ${overlayExistsDuringAnimation}`);
    expect(overlayExistsDuringAnimation).toBe(true);

    await page.waitForTimeout(1000);

    const overlayExistsAfterAnimation = await hasHighlightOverlay();
    console.log(`Highlight overlay after animation (2.5s): ${overlayExistsAfterAnimation}`);
    expect(overlayExistsAfterAnimation).toBe(false);

    console.log('Highlight effect test passed!');
  });
});
