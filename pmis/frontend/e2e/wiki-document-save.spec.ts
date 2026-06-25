import { test, expect } from '@playwright/test';

test.describe('Wiki Document Save and Read', () => {
  test.beforeEach(async ({ page, context }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await context.clearCookies();

    page.on('console', msg => {
      console.log(`Browser: ${msg.type()} - ${msg.text()}`);
    });

    // Login first
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.fill('input[type="email"]', 'admin@pmis.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
  });

  test('create document with rich content, save to DB, and verify saved content', async ({ page }) => {
    // Navigate to new document page (same pattern as working test)
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    await editor.first().click();
    await page.waitForTimeout(500);

    // Verify Save Draft button exists
    const saveButton = page.locator('button:has-text("Save Draft")');
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });

    // Step 2: Enter document title
    const titleInput = page.locator('input[placeholder="Enter document title..."]');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill('Test Document - Rich Content Verification');
    await page.waitForTimeout(200);

    // Step 3: Add content with various elements

    // Add paragraph
    await editor.first().click();
    await page.keyboard.type('This is a test paragraph with some text content.');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Add another paragraph
    await page.keyboard.type('This is the second paragraph to verify multiple paragraphs are saved correctly.');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Add bullet list using slash command
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Bullet List' }).click();
    await page.waitForTimeout(500);

    await page.keyboard.type('Bullet item 1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('Bullet item 2');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('Bullet item 3');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // Exit list
    await page.waitForTimeout(200);

    // Add ordered list using slash command
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Ordered List' }).click();
    await page.waitForTimeout(500);

    await page.keyboard.type('Ordered item 1');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('Ordered item 2');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('Ordered item 3');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // Exit list
    await page.waitForTimeout(200);

    // Add quote block using slash command
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Quote' }).click();
    await page.waitForTimeout(500);

    await page.keyboard.type('This is a quote block for testing quote saving.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // Exit quote
    await page.waitForTimeout(200);

    // Add code block using slash command
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Code Block' }).click();
    await page.waitForTimeout(500);

    await page.keyboard.type('function testCode() {');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('  return "Hello World";');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('}');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // Exit code block
    await page.waitForTimeout(500);

    // Click outside to ensure we're out of code block, then click at end of editor
    await editor.first().click();
    await page.waitForTimeout(300);
    // Move to end of document
    await page.keyboard.press('End');
    await page.waitForTimeout(200);
    // Ensure we're in a paragraph by pressing Enter to create new paragraph
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Add table using slash command
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Table' }).click();
    await page.waitForTimeout(1000);

    // Fill table cells
    // First row (header)
    await page.keyboard.type('Header 1');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.type('Header 2');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.type('Header 3');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Second row
    await page.keyboard.type('Row 1 Col 1');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.type('Row 1 Col 2');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.type('Row 1 Col 3');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Third row
    await page.keyboard.type('Row 2 Col 1');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.type('Row 2 Col 2');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.type('Row 2 Col 3');

    // Exit table
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Add final paragraph
    await page.keyboard.type('This is the final paragraph after all content elements.');

    // Step 4: Save the document
    await page.waitForTimeout(500);
    await saveButton.click();

    // Wait for save to complete and redirect to edit page
    await page.waitForTimeout(3000);

    // Check for success toast or redirect
    const currentUrl = page.url();
    expect(currentUrl).toContain('/wiki/');
    expect(currentUrl).toContain('/edit');

    // Extract document ID from URL
    const urlParts = currentUrl.split('/');
    const docId = urlParts[urlParts.length - 2]; // Get ID from /wiki/[id]/edit
    console.log(`Document saved with ID: ${docId}`);

    // Step 5: Navigate to view page to read saved content
    await page.goto(`/wiki/${docId}`);
    await page.waitForTimeout(2000);

    // Wait for content to load
    const wikiContent = page.locator('.wiki-content');
    await wikiContent.waitFor({ state: 'visible', timeout: 10000 });

    // Step 6: Verify all saved content

    // Verify title
    const titleElement = page.locator('h1:has-text("Test Document - Rich Content Verification")');
    await expect(titleElement).toBeVisible();

    // Verify paragraphs
    await expect(page.locator('.wiki-content')).toContainText('This is a test paragraph with some text content.');
    await expect(page.locator('.wiki-content')).toContainText('This is the second paragraph to verify multiple paragraphs are saved correctly.');
    await expect(page.locator('.wiki-content')).toContainText('This is the final paragraph after all content elements.');

    // Verify bullet list
    const bulletList = page.locator('.wiki-content ul');
    await expect(bulletList).toBeVisible();
    await expect(bulletList).toContainText('Bullet item 1');
    await expect(bulletList).toContainText('Bullet item 2');
    await expect(bulletList).toContainText('Bullet item 3');

    // Verify ordered list
    const orderedList = page.locator('.wiki-content ol');
    await expect(orderedList).toBeVisible();
    await expect(orderedList).toContainText('Ordered item 1');
    await expect(orderedList).toContainText('Ordered item 2');
    await expect(orderedList).toContainText('Ordered item 3');

    // Verify quote block
    const quoteBlock = page.locator('.wiki-content blockquote');
    await expect(quoteBlock).toBeVisible();
    await expect(quoteBlock).toContainText('This is a quote block for testing quote saving.');

    // Verify code block
    const codeBlock = page.locator('.wiki-content pre');
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toContainText('function testCode()');
    await expect(codeBlock).toContainText('Hello World');

    // Verify table
    const table = page.locator('.wiki-content table');
    await expect(table).toBeVisible();

    // Verify table headers
    const tableHeaders = table.locator('th');
    await expect(tableHeaders.first()).toContainText('Header 1');
    await expect(tableHeaders.nth(1)).toContainText('Header 2');
    await expect(tableHeaders.nth(2)).toContainText('Header 3');

    // Verify table rows
    const tableRows = table.locator('tbody tr');
    await expect(tableRows.first()).toContainText('Row 1 Col 1');
    await expect(tableRows.first()).toContainText('Row 1 Col 2');
    await expect(tableRows.first()).toContainText('Row 1 Col 3');
    await expect(tableRows.nth(1)).toContainText('Row 2 Col 1');
    await expect(tableRows.nth(1)).toContainText('Row 2 Col 2');
    await expect(tableRows.nth(1)).toContainText('Row 2 Col 3');

    // Step 7: Navigate back to edit page and verify content can be edited
    await page.goto(`/wiki/${docId}/edit`);
    await page.waitForTimeout(2000);

    // Wait for editor to load
    const editEditor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editEditor.first().waitFor({ state: 'visible', timeout: 15000 });

    // Verify title is preserved
    const editTitleInput = page.locator('input[placeholder="Enter document title..."]');
    await expect(editTitleInput).toHaveValue('Test Document - Rich Content Verification');

    // Verify content is loaded in editor
    const editorContent = await editEditor.first().innerHTML();
    expect(editorContent).toContain('This is a test paragraph');
    expect(editorContent).toContain('Bullet item');
    expect(editorContent).toContain('Ordered item');
    expect(editorContent).toContain('quote');
    expect(editorContent).toContain('function testCode');

    // Verify table exists in editor
    const tableInEditor = editEditor.first().locator('table');
    await expect(tableInEditor).toBeVisible();

    console.log('All content verified successfully!');
  });

  test('create document with headings and inline formatting, save and verify', async ({ page }) => {
    // Navigate to new document page
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    await editor.first().click();
    await page.waitForTimeout(500);

    // Enter title
    const titleInput = page.locator('input[placeholder="Enter document title..."]');
    await titleInput.fill('Test Document - Headings and Formatting');
    await page.waitForTimeout(200);

    // Add H1 using slash command
    await editor.first().click();
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Heading 1' }).click();
    await page.waitForTimeout(500);
    await page.keyboard.type('Main Heading');
    await page.waitForTimeout(300);
    // Press Enter twice to exit heading and create new paragraph
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Add H2 using slash command
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Heading 2' }).click();
    await page.waitForTimeout(500);
    await page.keyboard.type('Sub Heading');
    await page.waitForTimeout(300);
    // Press Enter twice to exit heading
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Add paragraph with inline formatting
    await page.keyboard.type('This text has ');
    await page.waitForTimeout(200);

    // Bold text
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(200);
    await page.keyboard.type('bold');
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(200);
    await page.keyboard.type(' and ');

    // Italic text
    await page.keyboard.press('Control+i');
    await page.waitForTimeout(200);
    await page.keyboard.type('italic');
    await page.keyboard.press('Control+i');
    await page.waitForTimeout(200);
    await page.keyboard.type(' formatting.');

    // Save document
    await page.waitForTimeout(500);
    const saveButton = page.locator('button:has-text("Save Draft")');
    await saveButton.click();
    await page.waitForTimeout(3000);

    // Get document ID
    const currentUrl = page.url();
    const urlParts = currentUrl.split('/');
    const docId = urlParts[urlParts.length - 2];

    // Navigate to view page
    await page.goto(`/wiki/${docId}`);
    await page.waitForTimeout(2000);

    const wikiContent = page.locator('.wiki-content');
    await wikiContent.waitFor({ state: 'visible', timeout: 10000 });

    // Verify title
    await expect(page.locator('h1:has-text("Test Document - Headings and Formatting")')).toBeVisible();

    // Verify H1 in content (should be h1 in wiki-content)
    const h1InContent = wikiContent.locator('h1');
    await expect(h1InContent).toContainText('Main Heading');

    // Verify H2 in content
    const h2InContent = wikiContent.locator('h2');
    await expect(h2InContent).toContainText('Sub Heading');

    // Verify paragraph with formatting
    await expect(wikiContent).toContainText('This text has');
    await expect(wikiContent).toContainText('bold');
    await expect(wikiContent).toContainText('italic');
    await expect(wikiContent).toContainText('formatting');

    // Verify bold element
    const boldElement = wikiContent.locator('strong');
    await expect(boldElement).toBeVisible();
    await expect(boldElement).toContainText('bold');

    // Verify italic element
    const italicElement = wikiContent.locator('em');
    await expect(italicElement).toBeVisible();
    await expect(italicElement).toContainText('italic');

    console.log('Headings and formatting verified successfully!');
  });

  test('publish document and verify it appears in wiki list', async ({ page }) => {
    // Navigate to new document page
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    await editor.first().click();
    await page.waitForTimeout(500);

    // Enter title
    const titleInput = page.locator('input[placeholder="Enter document title..."]');
    await titleInput.fill('Published Test Document');
    await page.waitForTimeout(200);

    // Add content
    await page.keyboard.type('This is a published document for testing the publish workflow.');
    await page.waitForTimeout(200);

    // Publish document
    const publishButton = page.locator('button:has-text("Publish")');
    await publishButton.click();
    await page.waitForTimeout(3000);

    // Should redirect to view page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/wiki/');
    expect(currentUrl).not.toContain('/edit');

    // Navigate to wiki list
    await page.goto('/wiki');
    await page.waitForTimeout(2000);

    // Verify document appears in list
    const wikiList = page.locator('text=Published Test Document');
    await expect(wikiList).toBeVisible();

    // Verify it doesn't have "Draft" badge (it's published)
    const docRow = page.locator('div:has-text("Published Test Document")').first();
    const draftBadge = docRow.locator('span:has-text("Draft")');
    await expect(draftBadge).not.toBeVisible();

    console.log('Publish workflow verified successfully!');
  });

  test('view published document with full content and metadata', async ({ page }) => {
    // Navigate to new document page
    await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
    await page.click('button[title="Add to Wiki"]');
    await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
    await page.click('button:has-text("Document")');
    await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });

    const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
    await editor.first().waitFor({ state: 'visible', timeout: 15000 });
    await editor.first().click();
    await page.waitForTimeout(500);

    // Enter title
    const titleInput = page.locator('input[placeholder="Enter document title..."]');
    await titleInput.fill('Published Document - Full View Test');
    await page.waitForTimeout(200);

    // Add H1 heading
    await editor.first().click();
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    const slashMenu = page.locator('.slash-menu');
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Heading 1' }).click();
    await page.waitForTimeout(500);
    await page.keyboard.type('Introduction');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Add paragraph
    await page.keyboard.type('This is a published document that contains multiple content types for viewing.');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Add bullet list
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Bullet List' }).click();
    await page.waitForTimeout(500);
    await page.keyboard.type('First published item');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second published item');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Third published item');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Add quote
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.slash-menu-item', { hasText: 'Quote' }).click();
    await page.waitForTimeout(500);
    await page.keyboard.type('A famous quote about documentation.');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Publish the document
    const publishButton = page.locator('button:has-text("Publish")');
    await publishButton.click();
    await page.waitForTimeout(3000);

    // Verify redirect to view page (not edit page)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/wiki/');
    expect(currentUrl).not.toContain('/edit');

    // Extract document ID
    const urlParts = currentUrl.split('/');
    const docId = urlParts[urlParts.length - 1];
    console.log(`Published document ID: ${docId}`);

    // ===== Verify View Page Elements =====

    // Verify page title (h1 outside content)
    const pageTitle = page.locator('h1:has-text("Published Document - Full View Test")');
    await expect(pageTitle).toBeVisible();

    // Verify meta info: author name
    const authorInfo = page.locator('text=John Doe');
    await expect(authorInfo.first()).toBeVisible();

    // Verify meta info: last modified label
    const lastModified = page.locator('text=Last modified:');
    await expect(lastModified).toBeVisible();

    // Verify no "Draft" badge (it's published)
    const draftBadge = page.locator('span:has-text("Draft")');
    await expect(draftBadge).not.toBeVisible();

    // Verify content area is visible
    const wikiContent = page.locator('.wiki-content');
    await wikiContent.waitFor({ state: 'visible', timeout: 10000 });

    // Verify H1 in content
    const contentH1 = wikiContent.locator('h1');
    await expect(contentH1).toContainText('Introduction');

    // Verify paragraph
    await expect(wikiContent).toContainText('This is a published document that contains multiple content types for viewing.');

    // Verify bullet list
    const bulletList = wikiContent.locator('ul');
    await expect(bulletList).toBeVisible();
    await expect(bulletList).toContainText('First published item');
    await expect(bulletList).toContainText('Second published item');
    await expect(bulletList).toContainText('Third published item');

    // Verify quote block
    const quoteBlock = wikiContent.locator('blockquote');
    await expect(quoteBlock).toBeVisible();
    await expect(quoteBlock).toContainText('A famous quote about documentation.');

    // Verify Edit button exists and is clickable
    const editButton = page.locator('button:has-text("Edit")');
    await expect(editButton).toBeVisible();

    // Verify "Back to Wiki" button exists
    const backButton = page.locator('button:has-text("Back to Wiki")');
    await expect(backButton).toBeVisible();

    // Click Edit button and verify navigation
    await editButton.click();
    await page.waitForTimeout(2000);
    const editUrl = page.url();
    expect(editUrl).toContain('/wiki/');
    expect(editUrl).toContain('/edit');

    // Go back to view page
    await page.goBack();
    await page.waitForTimeout(2000);
    await expect(pageTitle).toBeVisible();

    // Click Back to Wiki and verify navigation
    await backButton.click();
    await page.waitForTimeout(2000);
    const wikiListUrl = page.url();
    expect(wikiListUrl).toContain('/wiki');

    console.log('Published document view verified successfully!');
  });
});