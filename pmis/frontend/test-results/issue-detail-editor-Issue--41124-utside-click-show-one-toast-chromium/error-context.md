# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: issue-detail-editor.spec.ts >> Issue Detail - Description Editor >> should enter edit mode with single click, save on outside click, show one toast
- Location: e2e\issue-detail-editor.spec.ts:15:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 3000ms exceeded.
Call log:
  - waiting for locator('text=Changes saved') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e7]:
          - generic [ref=e8]:
            - generic [ref=e9]: J
            - generic [ref=e10]:
              - paragraph [ref=e11]: John Doe
              - paragraph [ref=e12]: Project Manager
          - generic [ref=e13]:
            - button "Search" [ref=e14] [cursor=pointer]:
              - img [ref=e15]
            - button "3" [ref=e19] [cursor=pointer]:
              - img [ref=e20]
              - generic [ref=e23]: "3"
        - navigation [ref=e24]:
          - link "Dashboard" [ref=e25] [cursor=pointer]:
            - /url: /
            - img [ref=e26]
            - generic [ref=e31]: Dashboard
          - link "My Issues 4" [ref=e32] [cursor=pointer]:
            - /url: /issues
            - img [ref=e33]
            - generic [ref=e41]: My Issues
            - generic [ref=e42]: "4"
          - link "My Projects 3" [ref=e43] [cursor=pointer]:
            - /url: /projects
            - img [ref=e44]
            - generic [ref=e46]: My Projects
            - generic [ref=e47]: "3"
          - generic [ref=e49] [cursor=pointer]:
            - img [ref=e50]
            - generic [ref=e55]:
              - generic [ref=e56]:
                - generic [ref=e57]: My Teams
                - img [ref=e58]
              - generic [ref=e60]:
                - generic [ref=e61]: "4"
                - button "Add Team" [ref=e62]:
                  - img [ref=e63]
          - link "Wiki" [ref=e64] [cursor=pointer]:
            - /url: /wiki
            - img [ref=e65]
            - generic [ref=e68]: Wiki
          - link "Reports" [ref=e69] [cursor=pointer]:
            - /url: /reports
            - img [ref=e70]
            - generic [ref=e72]: Reports
        - generic [ref=e73]:
          - button "Settings" [ref=e74] [cursor=pointer]:
            - img [ref=e75]
            - generic [ref=e78]: Settings
          - button "Logout" [ref=e79] [cursor=pointer]:
            - img [ref=e80]
            - generic [ref=e83]: Logout
        - button "Collapse sidebar" [ref=e84] [cursor=pointer]:
          - img [ref=e85]
    - main [ref=e88]:
      - generic [ref=e90]:
        - generic [ref=e91]:
          - button "Back to Issues" [ref=e93] [cursor=pointer]:
            - img [ref=e94]
            - generic [ref=e96]: Back to Issues
          - button [ref=e97] [cursor=pointer]:
            - img [ref=e98]
        - generic [ref=e100]:
          - generic [ref=e102]:
            - generic [ref=e103]:
              - generic [ref=e104]: "#6"
              - heading "这是标题" [level=2] [ref=e105] [cursor=pointer]
            - generic [ref=e106]:
              - text: Description
              - paragraph [ref=e109] [cursor=pointer]: Write a description for this issue...
              - generic [ref=e110]:
                - button "Add reaction" [ref=e111] [cursor=pointer]:
                  - img [ref=e112]
                  - generic [ref=e115]: Add reaction
                - button "Attach files" [ref=e116] [cursor=pointer]:
                  - img [ref=e117]
                  - generic [ref=e119]: Attach files
            - button "Add sub-issues" [ref=e120] [cursor=pointer]:
              - img [ref=e121]
              - generic [ref=e122]: Add sub-issues
            - generic [ref=e123]:
              - combobox [ref=e124]:
                - option "Related to" [selected]
                - option "Blocked by"
                - option "Belong to"
              - combobox [ref=e125]:
                - option "Search issues..." [selected]
                - option "#1 - Issue One"
                - option "#2 - Issue Two"
                - option "#3 - Issue Three"
            - generic [ref=e126]:
              - text: Activity
              - generic [ref=e128]:
                - img [ref=e130]
                - generic [ref=e133]:
                  - generic [ref=e134]:
                    - generic [ref=e135]: John Doe
                    - generic [ref=e136]: created this issue
                  - generic [ref=e137]: May 21, 2026, 06:50 PM
              - generic [ref=e139]:
                - img [ref=e141]
                - generic [ref=e145]:
                  - textbox [ref=e148]:
                    - paragraph [ref=e149]: extra text
                  - generic [ref=e150]:
                    - button [ref=e151] [cursor=pointer]:
                      - img [ref=e152]
                    - button [ref=e154] [cursor=pointer]:
                      - img [ref=e155]
          - generic [ref=e159]:
            - generic [ref=e160]:
              - button "Properties" [ref=e161] [cursor=pointer]:
                - generic [ref=e162]: Properties
                - img [ref=e163]
              - generic [ref=e165]:
                - generic [ref=e166]:
                  - generic [ref=e167]: Status
                  - combobox [ref=e168] [cursor=pointer]:
                    - option "In Progress"
                    - option "Todo"
                    - option "Backlog" [selected]
                    - option "Done"
                    - option "Canceled"
                    - option "Duplicated"
                - generic [ref=e169]:
                  - generic [ref=e170]: Priority
                  - combobox [ref=e171] [cursor=pointer]:
                    - option "No Priority" [selected]
                    - option "Urgent"
                    - option "High"
                    - option "Medium"
                    - option "Low"
                - generic [ref=e172]:
                  - generic [ref=e173]: Project
                  - combobox [ref=e174] [cursor=pointer]:
                    - option "None" [selected]
                    - option "曼哈顿计划"
                - generic [ref=e175]:
                  - generic [ref=e176]: Assignee
                  - combobox [ref=e177] [cursor=pointer]:
                    - option "Unassigned" [selected]
                    - option "Test User"
                    - option "John Doe"
                    - option "Mike Johnson"
                    - option "Lisa Anderson"
                    - option "Emily Davis"
                - generic [ref=e178]:
                  - generic [ref=e179]: Reporter
                  - generic [ref=e180]: John Doe
                - generic [ref=e181]:
                  - generic [ref=e182]: Labels
                  - button "Add label" [ref=e184] [cursor=pointer]:
                    - img [ref=e185]
                    - text: Add label
            - generic [ref=e186]:
              - button "Updates" [ref=e187] [cursor=pointer]:
                - generic [ref=e188]: Updates
                - img [ref=e189]
              - generic [ref=e192]: No updates yet
  - alert [ref=e193]
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | test.describe('Issue Detail - Description Editor', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/login');
  6   | 
  7   |     await page.fill('input[type="email"]', 'admin@pmis.com');
  8   |     await page.fill('input[type="password"]', 'password');
  9   |     await page.click('button[type="submit"]');
  10  | 
  11  |     await page.waitForNavigation();
  12  |     await page.waitForURL(/\/(dashboard|issues)$/);
  13  |   });
  14  | 
  15  |   test('should enter edit mode with single click, save on outside click, show one toast', async ({ page }) => {
  16  |     await page.goto('/issues');
  17  |     await page.waitForTimeout(1000);
  18  |     await page.goto('/issues/6');
  19  |     await page.waitForSelector('text=DESCRIPTION', { timeout: 10000 });
  20  | 
  21  |     const descriptionEditor = page.locator('.tiptap-editor').nth(0);
  22  |     const descriptionProseMirror = page.locator('.tiptap-editor .ProseMirror').nth(0);
  23  | 
  24  |     const focusedBefore = await page.evaluate(() => document.activeElement?.tagName);
  25  |     console.log('Focused element before click:', focusedBefore);
  26  | 
  27  |     const editorCount = await page.locator('.tiptap-editor').count();
  28  |     console.log('Number of tiptap editors on page:', editorCount);
  29  | 
  30  |     await descriptionEditor.click({ force: true });
  31  |     
  32  |     await page.waitForTimeout(500);
  33  |     
  34  |     const focusedAfter = await page.evaluate(() => document.activeElement?.tagName);
  35  |     console.log('Focused element after click:', focusedAfter);
  36  |     const focusedClass = await page.evaluate(() => (document.activeElement as HTMLElement)?.className);
  37  |     console.log('Focused element class after click:', focusedClass);
  38  | 
  39  |     await expect(descriptionProseMirror).toBeFocused();
  40  | 
  41  |     await page.keyboard.type('extra text');
  42  | 
  43  |     const editorBoundingBox = await descriptionEditor.boundingBox();
  44  |     if (editorBoundingBox) {
  45  |       await page.mouse.click(editorBoundingBox.x - 10, editorBoundingBox.y + editorBoundingBox.height / 2);
  46  |     }
  47  | 
  48  |     const toast = page.locator('text=Changes saved');
> 49  |     await toast.waitFor({ timeout: 3000 });
      |                 ^ TimeoutError: locator.waitFor: Timeout 3000ms exceeded.
  50  | 
  51  |     await page.waitForTimeout(1000);
  52  |     const toastCount = await toast.count();
  53  |     expect(toastCount).toBe(1);
  54  |   });
  55  | 
  56  |   test('should save on Enter key press', async ({ page }) => {
  57  |     await page.goto('/issues');
  58  |     await page.waitForTimeout(1000);
  59  |     await page.goto('/issues/6');
  60  |     await page.waitForSelector('text=DESCRIPTION', { timeout: 10000 });
  61  | 
  62  |     await page.click('div:has-text("Write a description for this issue...")', { force: true });
  63  |     await page.keyboard.type('test content');
  64  |     await page.keyboard.press('Enter');
  65  |     await page.waitForSelector('text=Changes saved', { timeout: 3000 });
  66  |   });
  67  | 
  68  |   test('should abort changes on ESC key press', async ({ page }) => {
  69  |     await page.goto('/issues');
  70  |     await page.waitForTimeout(1000);
  71  |     await page.goto('/issues/6');
  72  |     await page.waitForSelector('text=DESCRIPTION', { timeout: 10000 });
  73  | 
  74  |     await page.click('div:has-text("Write a description for this issue...")', { force: true });
  75  |     await page.keyboard.type('discarded text');
  76  |     await page.keyboard.press('Escape');
  77  | 
  78  |     await page.waitForTimeout(1000);
  79  |     const toast = page.locator('text=Changes saved');
  80  |     expect(await toast.count()).toBe(0);
  81  | 
  82  |     const descriptionText = await page.textContent('div:has-text("Write a description for this issue...")');
  83  |     expect(descriptionText).not.toContain('discarded text');
  84  |   });
  85  | 
  86  |   test('should exit edit mode without saving when clicking outside left edge', async ({ page }) => {
  87  |     const editor = page.locator('.tiptap-editor');
  88  | 
  89  |     await page.goto('/issues');
  90  |     await page.waitForTimeout(1000);
  91  |     await page.goto('/issues/6');
  92  |     await page.waitForSelector('text=DESCRIPTION', { timeout: 10000 });
  93  | 
  94  |     // Click to enter edit mode
  95  |     await page.click('div:has-text("Write a description for this issue...")', { force: true });
  96  |     // Verify editor IS focused (edit mode)
  97  |     expect(await editor.evaluate(e => document.activeElement === e)).toBe(true);
  98  | 
  99  |     // Click outside (10px left of editor midline)
  100 |     const editorBoundingBox = await descriptionEditor.boundingBox();
  101 |     if (editorBoundingBox) {
  102 |       await page.mouse.click(editorBoundingBox.x - 10, editorBoundingBox.y + editorBoundingBox.height / 2);
  103 |     }
  104 | 
  105 |     await page.waitForTimeout(1000);
  106 | 
  107 |     // Verify no toast (no database save)
  108 |     const toast = page.locator('text=Changes saved');
  109 |     expect(await toast.count()).toBe(0);
  110 | 
  111 |     // Verify editor is NOT focused (exited edit mode)
  112 |     expect(await editor.evaluate(e => document.activeElement === e)).toBe(false);
  113 |   });
  114 | 
  115 |   test('should exit edit mode without saving when clicking outside top edge', async ({ page }) => {
  116 |     const editor = page.locator('.tiptap-editor');
  117 | 
  118 |     await page.goto('/issues');
  119 |     await page.waitForTimeout(1000);
  120 |     await page.goto('/issues/6');
  121 |     await page.waitForSelector('text=DESCRIPTION', { timeout: 10000 });
  122 | 
  123 |     // Click to enter edit mode
  124 |     await page.click('div:has-text("Write a description for this issue...")', { force: true });
  125 |     // Verify editor IS focused (edit mode)
  126 |     expect(await editor.evaluate(e => document.activeElement === e)).toBe(true);
  127 | 
  128 |     // Click outside (10px above editor midline)
  129 |     const editorBoundingBox = await editor.boundingBox();
  130 |     if (editorBoundingBox) {
  131 |       await page.mouse.click(editorBoundingBox.x + editorBoundingBox.width / 2, editorBoundingBox.y - 10);
  132 |     }
  133 | 
  134 |     await page.waitForTimeout(1000);
  135 | 
  136 |     // Verify no toast (no database save)
  137 |     const toast = page.locator('text=Changes saved');
  138 |     expect(await toast.count()).toBe(0);
  139 | 
  140 |     // Verify editor is NOT focused (exited edit mode)
  141 |     expect(await editor.evaluate(e => document.activeElement === e)).toBe(false);
  142 |   });
  143 | 
  144 |   test('should exit edit mode without saving when clicking outside bottom edge', async ({ page }) => {
  145 |     const editor = page.locator('.tiptap-editor');
  146 | 
  147 |     await page.goto('/issues');
  148 |     await page.waitForTimeout(1000);
  149 |     await page.goto('/issues/6');
```