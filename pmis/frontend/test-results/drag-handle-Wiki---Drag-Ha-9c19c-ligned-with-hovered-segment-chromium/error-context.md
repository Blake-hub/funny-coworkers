# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: drag-handle.spec.ts >> Wiki - Drag Handle Feature >> drag handle position should be correctly aligned with hovered segment
- Location: e2e\drag-handle.spec.ts:93:7

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 10
Received:   30
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]:
          - generic [ref=e9]:
            - generic [ref=e10]: J
            - generic [ref=e11]:
              - paragraph [ref=e12]: John Doe
              - paragraph [ref=e13]: ADMIN
          - generic [ref=e14]:
            - button "Search" [ref=e15] [cursor=pointer]:
              - img [ref=e16]
            - button "3" [ref=e20] [cursor=pointer]:
              - img [ref=e21]
              - generic [ref=e24]: "3"
        - navigation [ref=e25]:
          - link "Dashboard" [ref=e26] [cursor=pointer]:
            - /url: /
            - img [ref=e27]
            - generic [ref=e32]: Dashboard
          - link "My Issues 4" [ref=e33] [cursor=pointer]:
            - /url: /issues
            - img [ref=e34]
            - generic [ref=e42]: My Issues
            - generic [ref=e43]: "4"
          - link "My Projects 3" [ref=e44] [cursor=pointer]:
            - /url: /projects
            - img [ref=e45]
            - generic [ref=e47]: My Projects
            - generic [ref=e48]: "3"
          - generic [ref=e50] [cursor=pointer]:
            - img [ref=e51]
            - generic [ref=e56]:
              - generic [ref=e57]:
                - generic [ref=e58]: My Teams
                - img [ref=e59]
              - generic [ref=e61]:
                - generic [ref=e62]: "2"
                - button "Add Team" [ref=e63]:
                  - img [ref=e64]
          - generic [ref=e66] [cursor=pointer]:
            - img [ref=e67]
            - generic [ref=e70]:
              - generic [ref=e71]: Wiki
              - button "Add to Wiki" [ref=e73]:
                - img [ref=e74]
          - link "Reports" [ref=e75] [cursor=pointer]:
            - /url: /reports
            - img [ref=e76]
            - generic [ref=e78]: Reports
        - generic [ref=e79]:
          - button "Settings" [ref=e80] [cursor=pointer]:
            - img [ref=e81]
            - generic [ref=e84]: Settings
          - button "Logout" [ref=e85] [cursor=pointer]:
            - img [ref=e86]
            - generic [ref=e89]: Logout
    - main [ref=e93]:
      - generic [ref=e95]:
        - generic [ref=e96]:
          - button "Back to Wiki" [ref=e97] [cursor=pointer]:
            - img [ref=e98]
            - generic [ref=e100]: Back to Wiki
          - button [ref=e101] [cursor=pointer]:
            - img [ref=e102]
        - generic [ref=e104]:
          - generic [ref=e106]:
            - textbox "Enter document title..." [ref=e107]
            - generic [ref=e108]: "Author: John Doe"
            - separator [ref=e109]
            - generic [ref=e111]:
              - generic [ref=e112]:
                - generic [ref=e113]:
                  - button "Bold (Ctrl+B)" [ref=e114] [cursor=pointer]:
                    - img [ref=e115]
                  - button "Italic (Ctrl+I)" [ref=e118] [cursor=pointer]:
                    - img [ref=e119]
                  - button "Underline (Ctrl+U)" [ref=e121] [cursor=pointer]:
                    - img [ref=e122]
                  - button "Strikethrough" [ref=e124] [cursor=pointer]:
                    - img [ref=e125]
                  - button "Highlight" [ref=e128] [cursor=pointer]:
                    - img [ref=e129]
                - button "Headings" [ref=e135] [cursor=pointer]:
                  - img [ref=e136]
                  - img [ref=e138]
                - generic [ref=e141]:
                  - button "Bullet List" [ref=e142] [cursor=pointer]:
                    - img [ref=e143]
                  - button "Ordered List" [ref=e144] [cursor=pointer]:
                    - img [ref=e145]
                  - button "Quote" [ref=e148] [cursor=pointer]:
                    - img [ref=e149]
                - generic [ref=e153]:
                  - button "Inline Code" [ref=e154] [cursor=pointer]:
                    - img [ref=e155]
                  - button "Code Block" [ref=e158] [cursor=pointer]:
                    - img [ref=e159]
                - generic [ref=e162]:
                  - button "Insert Link" [ref=e163] [cursor=pointer]:
                    - img [ref=e164]
                  - button "Insert Image" [ref=e167] [cursor=pointer]:
                    - img [ref=e168]
                  - button "Attach File" [ref=e172] [cursor=pointer]:
                    - img [ref=e173]
                  - button "Insert Table (3x3)" [ref=e176] [cursor=pointer]:
                    - img [ref=e177]
                - button "Text Alignment" [ref=e181] [cursor=pointer]:
                  - img [ref=e182]
                  - img [ref=e183]
                - generic [ref=e186]:
                  - button "Undo (Ctrl+Z)" [ref=e187] [cursor=pointer]:
                    - img [ref=e188]
                  - button "Redo (Ctrl+Shift+Z)" [ref=e191] [cursor=pointer]:
                    - img [ref=e192]
              - button "Plain Text" [ref=e195] [cursor=pointer]:
                - generic [ref=e196]: Plain Text
              - textbox [active] [ref=e198]:
                - img [ref=e200]
                - generic [ref=e207]:
                  - code
                - img [ref=e209]
                - paragraph [ref=e216]
              - generic: Start writing your document... You can add text, create tables, insert images, and more.
          - generic [ref=e219]:
            - heading "Document Outline" [level=3] [ref=e220]
            - paragraph [ref=e221]: No headings found
  - alert [ref=e222]: /wiki/new-document
```

# Test source

```ts
  50  |     await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
  51  |     await page.click('button:has-text("Document")');
  52  |     await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
  53  |     
  54  |     const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
  55  |     await editor.first().waitFor({ state: 'visible', timeout: 15000 });
  56  |     
  57  |     await editor.first().click();
  58  |     await page.waitForTimeout(500);
  59  | 
  60  |     await page.keyboard.type('/');
  61  |     await page.waitForTimeout(1000);
  62  | 
  63  |     const slashMenu = page.locator('.slash-menu');
  64  |     await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
  65  | 
  66  |     const codeBlockCommand = page.locator('.slash-menu-item', { hasText: 'Code Block' });
  67  |     await codeBlockCommand.click();
  68  |     await page.waitForTimeout(1000);
  69  | 
  70  |     await page.waitForSelector('pre', { timeout: 5000 });
  71  |     await page.waitForTimeout(1000);
  72  | 
  73  |     const preElement = page.locator('pre');
  74  |     const preBoundingBox = await preElement.first().boundingBox();
  75  |     
  76  |     if (preBoundingBox) {
  77  |       await page.mouse.move(preBoundingBox.x + preBoundingBox.width / 2, preBoundingBox.y + preBoundingBox.height / 2);
  78  |     }
  79  |     await page.waitForTimeout(500);
  80  | 
  81  |     const dragHandle = page.locator('.drag-handle');
  82  |     
  83  |     const isVisible = await dragHandle.first().evaluate((el) => {
  84  |       const style = window.getComputedStyle(el);
  85  |       return style.opacity === '1';
  86  |     });
  87  |     expect(isVisible).toBe(true);
  88  | 
  89  |     const svgExists = await dragHandle.locator('svg').count();
  90  |     expect(svgExists).toBeGreaterThanOrEqual(1);
  91  |   });
  92  | 
  93  |   test('drag handle position should be correctly aligned with hovered segment', async ({ page }) => {
  94  |     await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
  95  |     await page.click('button[title="Add to Wiki"]');
  96  |     await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
  97  |     await page.click('button:has-text("Document")');
  98  |     await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
  99  |     
  100 |     const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
  101 |     await editor.first().waitFor({ state: 'visible', timeout: 15000 });
  102 |     
  103 |     await editor.first().click();
  104 |     await page.keyboard.type('/');
  105 |     await page.waitForTimeout(500);
  106 |     
  107 |     const slashMenu = page.locator('.slash-menu');
  108 |     await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
  109 |     
  110 |     const codeBlockCommand = page.locator('.slash-menu-item', { hasText: 'Code Block' });
  111 |     await codeBlockCommand.click();
  112 |     await page.waitForTimeout(1000);
  113 |     
  114 |     const preElement = page.locator('pre');
  115 |     await preElement.first().waitFor({ state: 'visible' });
  116 |     
  117 |     const preBoundingBox = await preElement.first().boundingBox();
  118 |     if (preBoundingBox) {
  119 |       await page.mouse.move(preBoundingBox.x + preBoundingBox.width / 2, preBoundingBox.y + preBoundingBox.height / 2);
  120 |     }
  121 |     await page.waitForTimeout(500);
  122 |     
  123 |     const positions = await page.evaluate(() => {
  124 |       const handle = document.querySelector('.drag-handle') as HTMLElement;
  125 |       const pre = document.querySelector('pre') as HTMLElement;
  126 |       
  127 |       if (!handle || !pre) {
  128 |         return null;
  129 |       }
  130 |       
  131 |       const handleRect = handle.getBoundingClientRect();
  132 |       const preRect = pre.getBoundingClientRect();
  133 |       
  134 |       const spaceBetween = 4;
  135 |       const expectedHandleX = preRect.left - handleRect.width - spaceBetween;
  136 |       
  137 |       return {
  138 |         handleX: handleRect.left,
  139 |         handleY: handleRect.top,
  140 |         segmentX: preRect.left,
  141 |         segmentY: preRect.top,
  142 |         handleWidth: handleRect.width,
  143 |         handleHeight: handleRect.height,
  144 |         expectedHandleX: expectedHandleX,
  145 |       };
  146 |     });
  147 |     
  148 |     expect(positions).not.toBeNull();
  149 |     const yDifference = Math.abs(positions!.handleY - positions!.segmentY);
> 150 |     expect(yDifference).toBeLessThan(10);
      |                         ^ Error: expect(received).toBeLessThan(expected)
  151 |     const xDifference = Math.abs(positions!.handleX - positions!.expectedHandleX);
  152 |     expect(xDifference).toBeLessThan(30);
  153 |   });
  154 | 
  155 |   test('should show only one grip-vertical icon when hovering over a segment', async ({ page }) => {
  156 |     await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
  157 |     await page.click('button[title="Add to Wiki"]');
  158 |     await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
  159 |     await page.click('button:has-text("Document")');
  160 |     await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
  161 |     
  162 |     const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
  163 |     await editor.first().waitFor({ state: 'visible', timeout: 15000 });
  164 |     
  165 |     await editor.first().click();
  166 |     
  167 |     await page.keyboard.type('/');
  168 |     await page.waitForTimeout(500);
  169 |     await page.locator('.slash-menu').waitFor({ state: 'visible', timeout: 5000 });
  170 |     await page.locator('.slash-menu-item', { hasText: 'Code Block' }).click();
  171 |     await page.waitForTimeout(1000);
  172 |     
  173 |     await page.keyboard.press('Enter');
  174 |     await page.waitForTimeout(500);
  175 |     
  176 |     await page.keyboard.type('Second code');
  177 |     await page.waitForTimeout(500);
  178 |     
  179 |     const preElements = page.locator('pre');
  180 |     const preCount = await preElements.count();
  181 |     console.log('Number of code blocks:', preCount);
  182 |     
  183 |     await preElements.first().waitFor({ state: 'visible' });
  184 |     const firstPreBoundingBox = await preElements.first().boundingBox();
  185 |     if (firstPreBoundingBox) {
  186 |       await page.mouse.move(firstPreBoundingBox.x + firstPreBoundingBox.width / 2, firstPreBoundingBox.y + firstPreBoundingBox.height / 2);
  187 |     }
  188 |     await page.waitForTimeout(500);
  189 |     
  190 |     const visibleDragHandles = await page.locator('.drag-handle').evaluateAll((handles) => {
  191 |       return handles.filter((handle: HTMLElement) => {
  192 |         const style = window.getComputedStyle(handle);
  193 |         return style.opacity === '1';
  194 |       }).length;
  195 |     });
  196 |     
  197 |     console.log('Visible drag handles:', visibleDragHandles);
  198 |     expect(visibleDragHandles).toBe(1);
  199 |   });
  200 | 
  201 |   test('should hide all grip-vertical icons when not hovering over any segment', async ({ page }) => {
  202 |     await page.waitForSelector('button[title="Add to Wiki"]', { timeout: 5000 });
  203 |     await page.click('button[title="Add to Wiki"]');
  204 |     await page.waitForSelector('button:has-text("Document")', { timeout: 5000 });
  205 |     await page.click('button:has-text("Document")');
  206 |     await page.waitForNavigation({ timeout: 30000, waitUntil: 'networkidle' });
  207 |     
  208 |     const editor = page.locator('.tiptap, .ProseMirror, [contenteditable="true"]');
  209 |     await editor.first().waitFor({ state: 'visible', timeout: 15000 });
  210 |     
  211 |     await editor.first().click();
  212 |     
  213 |     await page.keyboard.type('/');
  214 |     await page.waitForTimeout(500);
  215 |     const slashMenu = page.locator('.slash-menu');
  216 |     await slashMenu.waitFor({ state: 'visible', timeout: 5000 });
  217 |     
  218 |     const codeBlockCommand = page.locator('.slash-menu-item', { hasText: 'Code Block' });
  219 |     await codeBlockCommand.click();
  220 |     await page.waitForTimeout(1000);
  221 |     
  222 |     const preElement = page.locator('pre');
  223 |     const preBoundingBox = await preElement.first().boundingBox();
  224 |     if (preBoundingBox) {
  225 |       await page.mouse.move(preBoundingBox.x + preBoundingBox.width / 2, preBoundingBox.y + preBoundingBox.height / 2);
  226 |     }
  227 |     await page.waitForTimeout(500);
  228 |     
  229 |     const visibleDuringHover = await page.locator('.drag-handle').evaluateAll((handles) => {
  230 |       return handles.filter((handle: HTMLElement) => {
  231 |         const style = window.getComputedStyle(handle);
  232 |         return style.opacity === '1';
  233 |       }).length;
  234 |     });
  235 |     expect(visibleDuringHover).toBe(1);
  236 |     
  237 |     await page.mouse.move(10, 10);
  238 |     await page.waitForTimeout(500);
  239 |     
  240 |     const visibleAfterHover = await page.locator('.drag-handle').evaluateAll((handles) => {
  241 |       return handles.filter((handle: HTMLElement) => {
  242 |         const style = window.getComputedStyle(handle);
  243 |         return style.opacity === '1';
  244 |       }).length;
  245 |     });
  246 |     
  247 |     console.log('Visible drag handles after moving away:', visibleAfterHover);
  248 |     expect(visibleAfterHover).toBe(0);
  249 |   });
  250 | });
```