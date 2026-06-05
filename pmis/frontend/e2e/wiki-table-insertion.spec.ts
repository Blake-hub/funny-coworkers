import { test, expect } from '@playwright/test';

test.describe('Wiki - Table Insertion', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    
    page.on('request', request => {
      console.log(`Request: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      if (!response.ok()) {
        console.log(`Response error: ${response.status()} ${response.url()}`);
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser console error: ${msg.text()}`);
      }
    });
    
    await page.goto('/login');
    
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@pmis.com');
    await page.fill('input[type="password"]', 'password');
    
    const signInButton = page.locator('button[type="submit"]');
    await signInButton.waitFor({ state: 'visible', timeout: 5000 });
    await signInButton.click();

    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
  });

  test('should insert table via proper workflow with header row containing th elements', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const addToWikiButton = page.locator('button[title="Add to Wiki"]');
    await addToWikiButton.waitFor({ state: 'visible', timeout: 10000 });
    await addToWikiButton.click();

    await page.waitForTimeout(500);

    const documentOption = page.locator('text=Document');
    await documentOption.waitFor({ state: 'visible', timeout: 5000 });
    await documentOption.click();

    await page.waitForNavigation({ timeout: 30000 });
    await page.waitForSelector('input[placeholder="Enter document title..."]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    console.log('Current URL:', page.url());
    const pageContent = await page.content();
    console.log('Page contains ProseMirror:', pageContent.includes('ProseMirror'));

    const editor = page.locator('div.ProseMirror');
    const editorCount = await editor.count();
    console.log('Editor count:', editorCount);
    
    if (editorCount > 0) {
      await editor.first().click();
      await page.waitForTimeout(500);
      
      await page.keyboard.type('/');
      await page.waitForTimeout(500);

      const slashMenu = page.locator('.slash-menu');
      await slashMenu.waitFor({ state: 'visible', timeout: 5000 });

      const tableCommand = page.locator('.slash-menu-item', { hasText: 'Insert Table' });
      await tableCommand.click();

      await page.waitForTimeout(500);

      const tableWrapper = page.locator('.tableWrapper');
      await tableWrapper.waitFor({ state: 'visible', timeout: 5000 });

      const table = tableWrapper.locator('table');
      await expect(table).toBeVisible();

      const headerCells = table.locator('tbody tr:first-child th');
      const headerCellCount = await headerCells.count();
      expect(headerCellCount).toBe(3);

      const bodyCells = table.locator('tbody tr:not(:first-child) td');
      const bodyCellCount = await bodyCells.count();
      expect(bodyCellCount).toBe(6);

      const colgroup = table.locator('colgroup');
      await expect(colgroup).toBeVisible();

      const cols = colgroup.locator('col');
      const colCount = await cols.count();
      expect(colCount).toBe(3);
    } else {
      throw new Error('Editor not found on page');
    }
  });

  test('should show language selector when code block is inserted', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const addToWikiButton = page.locator('button[title="Add to Wiki"]');
    await addToWikiButton.waitFor({ state: 'visible', timeout: 10000 });
    await addToWikiButton.click();

    await page.waitForTimeout(500);

    const documentOption = page.locator('text=Document');
    await documentOption.waitFor({ state: 'visible', timeout: 5000 });
    await documentOption.click();

    await page.waitForNavigation({ timeout: 30000 });
    await page.waitForSelector('input[placeholder="Enter document title..."]', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    const editor = page.locator('div.ProseMirror');
    const editorCount = await editor.count();
    console.log('Editor count:', editorCount);
    
    if (editorCount > 0) {
      await editor.first().click();
      await page.waitForTimeout(500);
      
      await page.keyboard.type('/');
      await page.waitForTimeout(500);

      const slashMenu = page.locator('.slash-menu');
      await slashMenu.waitFor({ state: 'visible', timeout: 5000 });

      const codeBlockCommand = page.locator('.slash-menu-item', { hasText: 'Code Block' });
      await codeBlockCommand.click();

      await page.waitForTimeout(1000);

      const codeBlock = editor.locator('pre');
      await codeBlock.waitFor({ state: 'visible', timeout: 5000 });
      
      const codeBlockCount = await codeBlock.count();
      console.log('Code block count:', codeBlockCount);

      if (codeBlockCount > 0) {
        await codeBlock.first().click();
        await page.waitForTimeout(500);

        const languageDropdown = page.locator('.code-block-language-dropdown');
          const dropdownCount = await languageDropdown.count();
          console.log('Language dropdown count:', dropdownCount);
          
          const isDropdownVisible = await languageDropdown.isVisible();
          console.log('Language dropdown visible:', isDropdownVisible);
          
          const isDropdownHidden = await languageDropdown.isHidden();
          console.log('Language dropdown hidden:', isDropdownHidden);

          if (dropdownCount > 0) {
          const dropdownTrigger = languageDropdown.locator('.toolbar-dropdown-trigger');
          await dropdownTrigger.click();

          const dropdownMenu = page.locator('.toolbar-dropdown-menu');
          await dropdownMenu.waitFor({ state: 'visible', timeout: 5000 });

          const menuItems = dropdownMenu.locator('.toolbar-dropdown-item');
          const itemCount = await menuItems.count();
          console.log('Number of languages:', itemCount);

          const languageLabels = await menuItems.allTextContents();
          console.log('Available languages:', languageLabels);

          expect(languageLabels).toContain('JavaScript');
          expect(languageLabels).toContain('TypeScript');
          expect(languageLabels).toContain('Python');
          expect(languageLabels).toContain('Java');
          expect(languageLabels).toContain('C++');
          expect(languageLabels).toContain('C');
        } else {
          console.log('Language dropdown is NOT visible');
          
          const pageContent = await page.content();
          console.log('Page HTML (first 5000 chars):', pageContent.substring(0, 5000));
          
          const editorHtml = await editor.first().innerHTML();
          console.log('Editor HTML:', editorHtml);
          
          throw new Error('Language dropdown not found - check if code block is properly inserted');
        }
      } else {
        throw new Error('Code block not found');
      }
    } else {
      throw new Error('Editor not found on page');
    }
  });
});