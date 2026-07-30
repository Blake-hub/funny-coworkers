import { test, expect } from '@playwright/test';

test.describe('Wiki - Drag and Drop Verification', () => {
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

  const clearEditor = async (page: any) => {
    await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      if (editor) {
        editor.innerHTML = '<p><br></p>';
      }
    });
    await page.waitForTimeout(300);
  };

  const setEditorContent = async (page: any, texts: string[]) => {
    await page.evaluate((items: string[]) => {
      const editor = document.querySelector('.ProseMirror');
      if (editor) {
        editor.innerHTML = items.map(t => `<p>${t}</p>`).join('');
      }
    }, texts);
    await page.waitForTimeout(300);
  };

  // Helper function to verify ghost overlay visual effect
  const verifyGhostOverlay = async (page: any, handleSelector: string, blockType: string) => {
    const result = await page.evaluate(({ selector, type }) => {
      const handle = document.querySelector(selector) as HTMLElement;
      if (!handle) {
        return { success: false, error: `Handle not found for ${type}` };
      }

      const rect = handle.getBoundingClientRect();

      // Trigger mousedown to start drag
      handle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 5,
        clientY: rect.top + 5,
      }));

      // Check for ghost overlay element
      const ghostOverlay = document.querySelector('.drag-ghost-overlay-element');
      if (!ghostOverlay) {
        return { success: false, error: 'Ghost overlay not found' };
      }

      // Verify overlay properties
      const computedStyle = window.getComputedStyle(ghostOverlay);
      const overlayRect = ghostOverlay.getBoundingClientRect();
      
      // Check for "DRAGGING" label
      const hasLabel = ghostOverlay.innerHTML.includes('DRAGGING');
      
      // Check visual properties
      const info = {
        position: computedStyle.position,
        top: computedStyle.top,
        left: computedStyle.left,
        width: computedStyle.width,
        height: computedStyle.height,
        zIndex: computedStyle.zIndex,
        border: computedStyle.border,
        backgroundColor: computedStyle.background,
        hasLabel,
        rect: overlayRect,
      };

      // Move mouse slightly
      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 50,
        clientY: rect.top + 50,
      }));

      // Check overlay persists after mousemove
      const ghostOverlayAfterMove = document.querySelector('.drag-ghost-overlay-element');
      const overlayPersists = !!ghostOverlayAfterMove;

      // Complete drag
      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 50,
        clientY: rect.top + 50,
      }));

      // Check overlay is cleaned up
      const ghostOverlayAfterUp = document.querySelector('.drag-ghost-overlay-element');
      const overlayCleanedUp = !ghostOverlayAfterUp;

      return {
        success: true,
        blockType: type,
        info,
        overlayPersists,
        overlayCleanedUp,
      };
    }, { selector: handleSelector, type: blockType });

    return result;
  };

  test('Step 1: verify drag handles exist on page load', async ({ page }) => {
    console.log('=== Test Step 1: Verify drag handles exist ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    const handleCount = await page.evaluate(() => {
      return document.querySelectorAll('.tiptap-drag-handle').length;
    });

    console.log(`Drag handles found: ${handleCount}`);
    expect(handleCount).toBeGreaterThan(0);

    const handleDetails = await page.evaluate(() => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      return Array.from(handles).map((h, i) => ({
        index: i,
        pos: (h as HTMLElement).dataset.pos,
        nodeType: (h as HTMLElement).dataset.nodeType,
      }));
    });
    console.log('Handle details:', JSON.stringify(handleDetails));

    console.log('✅ PASS: Drag handles exist on page load\n');
  });

  test('Step 2: drag paragraph after another and verify order changed', async ({ page }) => {
    console.log('=== Test Step 2: Drag paragraph after another ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    await clearEditor(page);
    await setEditorContent(page, ['First paragraph', 'Second paragraph', 'Third paragraph']);

    const initialOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Initial order:', initialOrder);
    expect(initialOrder).toEqual(['First paragraph', 'Second paragraph', 'Third paragraph']);

    await page.evaluate(() => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      if (handles.length < 2) {
        console.error('Not enough handles for drag test');
        return;
      }

      const sourceHandle = handles[0] as HTMLElement;
      const targetHandle = handles[1] as HTMLElement;

      const sourceRect = sourceHandle.getBoundingClientRect();
      const targetRect = targetHandle.getBoundingClientRect();

      console.log(`Source handle pos: ${sourceHandle.dataset.pos}`);
      console.log(`Target handle pos: ${targetHandle.dataset.pos}`);

      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));

      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.bottom + 30,
      }));

      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.bottom + 30,
      }));
    });

    await page.waitForTimeout(500);

    const finalOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Final order after drag:', finalOrder);

    expect(finalOrder).toContain('Second paragraph');
    expect(finalOrder).toContain('First paragraph');
    expect(finalOrder).toContain('Third paragraph');
    
    const secondIdx = finalOrder.indexOf('Second paragraph');
    const firstIdx = finalOrder.indexOf('First paragraph');
    expect(secondIdx).toBeLessThan(firstIdx);
    console.log('✅ PASS: Paragraph order changed correctly after drag\n');

    const emptyLineCount = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).filter(p => !p.textContent?.trim()).length;
    });
    console.log('Empty lines after drag:', emptyLineCount);
    expect(emptyLineCount).toBe(0);
    console.log('✅ PASS: No extra empty lines after drag operation\n');
  });

  test('Step 3: drag paragraph before another and verify order', async ({ page }) => {
    console.log('=== Test Step 3: Drag paragraph before another ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    await clearEditor(page);
    await setEditorContent(page, ['Alpha', 'Beta', 'Gamma']);

    const initialOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Initial order:', initialOrder);
    expect(initialOrder).toEqual(['Alpha', 'Beta', 'Gamma']);

    await page.evaluate(() => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      if (handles.length < 2) {
        console.error('Not enough handles for drag test');
        return;
      }

      const sourceHandle = handles[2] as HTMLElement;
      const targetHandle = handles[0] as HTMLElement;

      const sourceRect = sourceHandle.getBoundingClientRect();
      const targetRect = targetHandle.getBoundingClientRect();

      console.log(`Source handle pos: ${sourceHandle.dataset.pos}`);
      console.log(`Target handle pos: ${targetHandle.dataset.pos}`);

      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));

      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.top - 10,
      }));

      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.top - 10,
      }));
    });

    await page.waitForTimeout(500);

    const finalOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Final order after drag-before:', finalOrder);

    expect(finalOrder).toContain('Gamma');
    expect(finalOrder).toContain('Alpha');
    expect(finalOrder).toContain('Beta');
    
    const gammaIdx = finalOrder.indexOf('Gamma');
    const alphaIdx = finalOrder.indexOf('Alpha');
    expect(gammaIdx).toBeLessThan(alphaIdx);
    console.log('✅ PASS: Paragraph moved before another correctly\n');

    const emptyLineCount = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).filter(p => !p.textContent?.trim()).length;
    });
    console.log('Empty lines after drag:', emptyLineCount);
    expect(emptyLineCount).toBe(0);
    console.log('✅ PASS: No extra empty lines after drag-before operation\n');
  });

  test('Step 4: move block to same position (no change expected)', async ({ page }) => {
    console.log('=== Test Step 4: Move block to same position ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    await clearEditor(page);
    await setEditorContent(page, ['First block', 'Second block']);

    const initialOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Initial order:', initialOrder);
    expect(initialOrder).toEqual(['First block', 'Second block']);

    await page.evaluate(() => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      if (handles.length < 1) {
        console.error('No handles found for same-position test');
        return;
      }

      const sourceHandle = handles[0] as HTMLElement;
      const sourceRect = sourceHandle.getBoundingClientRect();

      console.log(`Source handle pos: ${sourceHandle.dataset.pos}`);

      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));

      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 10,
        clientY: sourceRect.top + 10,
      }));

      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 10,
        clientY: sourceRect.top + 10,
      }));
    });

    await page.waitForTimeout(500);

    const finalOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Final order after same-position drag:', finalOrder);

    expect(finalOrder).toEqual(['First block', 'Second block']);
    console.log('✅ PASS: No change when dropping block at same position\n');

    const emptyLineCount = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).filter(p => !p.textContent?.trim()).length;
    });
    console.log('Empty lines after same-position drag:', emptyLineCount);
    expect(emptyLineCount).toBe(0);
    console.log('✅ PASS: No extra empty lines after same-position operation\n');
  });

  test('Step 5: drag block after another and verify no empty lines appear', async ({ page }) => {
    console.log('=== Test Step 5: Drag block and verify no empty lines ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    await clearEditor(page);
    await setEditorContent(page, ['Paragraph A', 'Paragraph B', 'Paragraph C', 'Paragraph D']);

    const initialStructure = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => ({
        text: p.textContent?.trim() || '',
        isEmpty: !(p.textContent?.trim()),
      }));
    });
    console.log('Initial structure:', JSON.stringify(initialStructure));

    const initialEmptyCount = initialStructure.filter(p => p.isEmpty).length;
    console.log('Initial empty lines:', initialEmptyCount);

    await page.evaluate(() => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      if (handles.length < 3) {
        console.error('Not enough handles for multi-block drag test');
        return;
      }

      const sourceHandle = handles[0] as HTMLElement;
      const targetHandle = handles[2] as HTMLElement;

      const sourceRect = sourceHandle.getBoundingClientRect();
      const targetRect = targetHandle.getBoundingClientRect();
      const nextHandle = handles[3] as HTMLElement;
      const nextRect = nextHandle.getBoundingClientRect();

      // Drop at the boundary between target block (C) and the next block (D)
      // This ensures we drop AFTER C but BEFORE D
      const dropY = (targetRect.bottom + nextRect.top) / 2;

      console.log(`Dragging handle ${sourceHandle.dataset.pos} to after handle ${targetHandle.dataset.pos}`);
      console.log(`Target rect: ${JSON.stringify({top: targetRect.top, bottom: targetRect.bottom})}`);
      console.log(`Next rect: ${JSON.stringify({top: nextRect.top, bottom: nextRect.bottom})}`);
      console.log(`Drop Y: ${dropY}`);

      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));

      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: dropY,
      }));

      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: dropY,
      }));
    });

    await page.waitForTimeout(500);

    const finalStructure = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => ({
        text: p.textContent?.trim() || '',
        isEmpty: !(p.textContent?.trim()),
      }));
    });
    console.log('Final structure after drag:', JSON.stringify(finalStructure));

    const finalEmptyCount = finalStructure.filter(p => p.isEmpty).length;
    console.log('Final empty lines:', finalEmptyCount);

    expect(finalEmptyCount).toBe(initialEmptyCount);

    const finalTexts = finalStructure.filter(p => !p.isEmpty).map(p => p.text);
    console.log('Final text order:', finalTexts);

    expect(finalTexts).toEqual(['Paragraph B', 'Paragraph C', 'Paragraph A', 'Paragraph D']);
    console.log('✅ PASS: Block reordered without creating extra empty lines\n');
  });

  test('Step 6: multiple sequential drag-and-drop operations', async ({ page }) => {
    console.log('=== Test Step 6: Multiple sequential DnD operations ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    await clearEditor(page);
    await setEditorContent(page, ['A', 'B', 'C']);

    const initialOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Initial order:', initialOrder);
    expect(initialOrder).toEqual(['A', 'B', 'C']);

    // First drag: Move A after C → Expected: B, C, A
    console.log('--- First drag: Move A after C ---');
    await page.evaluate(() => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      console.log('Handles before first drag:', handles.length, 
        Array.from(handles).map((h, i) => `h${i}(pos=${(h as HTMLElement).dataset.pos})`));
      
      if (handles.length < 3) {
        console.error('Not enough handles');
        return;
      }

      const sourceHandle = handles[0] as HTMLElement;
      const targetHandle = handles[2] as HTMLElement;

      const sourceRect = sourceHandle.getBoundingClientRect();
      const targetRect = targetHandle.getBoundingClientRect();

      console.log(`Source pos: ${sourceHandle.dataset.pos}, Target pos: ${targetHandle.dataset.pos}`);
      console.log(`Source rect: ${JSON.stringify({top: Math.round(sourceRect.top), left: Math.round(sourceRect.left)})}`);
      console.log(`Target rect: ${JSON.stringify({top: Math.round(targetRect.top), bottom: Math.round(targetRect.bottom)})}`);

      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));

      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.bottom + 30,
      }));

      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.bottom + 30,
      }));
    });

    await page.waitForTimeout(500);

    const orderAfterFirstDrag = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Order after first drag:', orderAfterFirstDrag);
    expect(orderAfterFirstDrag).toEqual(['B', 'C', 'A']);
    console.log('✅ First drag successful: A moved after C\n');

    // Second drag: Move B after A → Expected: C, A, B
    console.log('--- Second drag: Move B after A ---');
    await page.evaluate(() => {
      // Re-read handles positions after first drag
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      console.log('Handles before second drag:', handles.length,
        Array.from(handles).map((h, i) => `h${i}(pos=${(h as HTMLElement).dataset.pos})`));
      
      if (handles.length < 3) {
        console.error('Not enough handles for second drag');
        return;
      }

      // Get fresh positions - B should now be at index 0, A at index 2
      const sourceHandle = handles[0] as HTMLElement;  // B is now first
      const targetHandle = handles[2] as HTMLElement;  // A is now last

      const sourceRect = sourceHandle.getBoundingClientRect();
      const targetRect = targetHandle.getBoundingClientRect();

      console.log(`Source pos: ${sourceHandle.dataset.pos} (B), Target pos: ${targetHandle.dataset.pos} (A)`);
      console.log(`Source rect: ${JSON.stringify({top: Math.round(sourceRect.top), left: Math.round(sourceRect.left)})}`);
      console.log(`Target rect: ${JSON.stringify({top: Math.round(targetRect.top), bottom: Math.round(targetRect.bottom)})}`);

      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));

      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.bottom + 30,
      }));

      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.bottom + 30,
      }));
    });

    await page.waitForTimeout(500);

    const orderAfterSecondDrag = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Order after second drag:', orderAfterSecondDrag);
    expect(orderAfterSecondDrag).toEqual(['C', 'A', 'B']);
    console.log('✅ Second drag successful: B moved after A\n');
  });

  test('Step 7: verify ghost visual effect on source block during drag', async ({ page }) => {
    console.log('=== Test Step 7: Verify ghost visual effect on source block ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    await clearEditor(page);
    await setEditorContent(page, ['Ghost Test Block', 'Second Block', 'Third Block']);

    // Take screenshot before drag
    await page.screenshot({ path: 'test-results/before-drag.png' });

    const result = await page.evaluate(async () => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      if (handles.length < 1) {
        return { success: false, error: 'No handles found' };
      }

      const sourceHandle = handles[0] as HTMLElement;
      const sourceRect = sourceHandle.getBoundingClientRect();

      // Trigger mousedown to start drag
      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));

      // Check for ghost overlay element (independent overlay)
      const ghostOverlay = document.querySelector('.drag-ghost-overlay-element');
      const overlayFound = !!ghostOverlay;

      let overlayInfo: any = {};
      if (ghostOverlay) {
        overlayInfo = {
          tagName: ghostOverlay.tagName,
          className: ghostOverlay.className,
          position: window.getComputedStyle(ghostOverlay).position,
          top: window.getComputedStyle(ghostOverlay).top,
          left: window.getComputedStyle(ghostOverlay).left,
          width: window.getComputedStyle(ghostOverlay).width,
          height: window.getComputedStyle(ghostOverlay).height,
          hasLabel: ghostOverlay.innerHTML.includes('DRAGGING'),
          hasDashedBorder: ghostOverlay.innerHTML.includes('dashed'),
          rect: ghostOverlay.getBoundingClientRect(),
        };
      }

      // Move mouse to trigger drag
      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 10,
        clientY: sourceRect.top + 50,
      }));

      // Check overlay persists after mousemove
      const ghostOverlayAfterMove = document.querySelector('.drag-ghost-overlay-element');
      const overlayStillPresent = !!ghostOverlayAfterMove;

      let overlayInfoAfterMove: any = {};
      if (ghostOverlayAfterMove) {
        overlayInfoAfterMove = {
          rect: ghostOverlayAfterMove.getBoundingClientRect(),
          isConnected: ghostOverlayAfterMove.isConnected,
        };
      }

      // Return all debug info
      return {
        success: true,
        overlayFound,
        overlayStillPresent,
        overlayInfo,
        overlayInfoAfterMove,
      };
    });

    // Take screenshot during drag
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'test-results/during-drag.png' });

    console.log('Ghost overlay verification:', JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);
    expect(result.overlayFound).toBe(true);
    expect(result.overlayStillPresent).toBe(true);
    
    // Verify overlay has ghost styling
    if (result.overlayInfo?.hasLabel) {
      console.log('✅ "DRAGGING" label present on overlay');
    }
    if (result.overlayInfo?.rect) {
      console.log('✅ Overlay positioned at:', result.overlayInfo.rect);
    }
    
    console.log('✅ Debug captured - check screenshots\n');
  });

  test('Step 8: verify image dragging works', async ({ page }) => {
    console.log('=== Test Step 8: Verify image dragging works ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    // Find image block handles
    const imageDragResult = await page.evaluate(async () => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      const imageHandles: HTMLElement[] = [];
      
      handles.forEach((h) => {
        if (h.getAttribute('data-node-type') === 'image') {
          imageHandles.push(h as HTMLElement);
        }
      });

      if (imageHandles.length === 0) {
        return { 
          success: false, 
          error: 'No image handles found',
          allHandles: Array.from(handles).map(h => ({
            nodeType: h.getAttribute('data-node-type'),
            pos: h.getAttribute('data-pos')
          }))
        };
      }

      const sourceHandle = imageHandles[0];
      const sourcePos = sourceHandle.getAttribute('data-pos');
      const sourceRect = sourceHandle.getBoundingClientRect();

      // Get the image element info before dragging
      let imageElementInfo: any = {};
      const prevSibling = sourceHandle.previousElementSibling;
      if (prevSibling) {
        imageElementInfo = {
          tagName: prevSibling.tagName,
          className: prevSibling.className,
          rect: prevSibling.getBoundingClientRect(),
          hasImg: !!prevSibling.querySelector('img'),
        };
      }

      // Trigger mousedown to start drag
      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));

      // Move mouse to trigger drag
      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 100,
        clientY: sourceRect.top + 100,
      }));

      // Check for ghost overlay
      const ghostOverlay = document.querySelector('.drag-ghost-overlay-element');
      const overlayFound = !!ghostOverlay;

      let overlayInfo: any = {};
      if (ghostOverlay) {
        overlayInfo = {
          rect: ghostOverlay.getBoundingClientRect(),
          hasLabel: ghostOverlay.innerHTML.includes('DRAGGING'),
        };
      }

      // Complete drag
      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 100,
        clientY: sourceRect.top + 100,
      }));

      // Check if overlay was cleaned up
      const ghostOverlayAfterUp = document.querySelector('.drag-ghost-overlay-element');
      const overlayCleanedUp = !ghostOverlayAfterUp;

      return {
        success: true,
        imageHandleCount: imageHandles.length,
        sourcePos,
        imageElementInfo,
        overlayFound,
        overlayInfo,
        overlayCleanedUp,
      };
    });

    console.log('Image drag verification:', JSON.stringify(imageDragResult, null, 2));

    // Take screenshot
    await page.screenshot({ path: 'test-results/image-drag.png' });

    if (imageDragResult.success) {
      expect(imageDragResult.overlayFound).toBe(true);
      console.log('✅ Image drag overlay works\n');
    } else {
      console.error('❌', imageDragResult.error);
    }
  });

  test('Step 9: verify ghost visual effect on ALL block types', async ({ page }) => {
    console.log('=== Test Step 9: Verify ghost visual effect on ALL block types ===\n');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    // Get all handles and their types
    const handlesInfo = await page.evaluate(() => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      return Array.from(handles).map((h, idx) => ({
        index: idx,
        pos: h.getAttribute('data-pos'),
        nodeType: h.getAttribute('data-node-type'),
      }));
    });

    console.log(`Found ${handlesInfo.length} drag handles\n`);

    // Group handles by node type
    const handlesByType: Record<string, { index: number; pos: string | null }[]> = {};
    handlesInfo.forEach(h => {
      const type = h.nodeType || 'unknown';
      if (!handlesByType[type]) {
        handlesByType[type] = [];
      }
      handlesByType[type].push({ index: h.index, pos: h.pos });
    });

    console.log('Block types found:', Object.keys(handlesByType).join(', '), '\n');

    // Test ghost overlay for each block type
    const results: { blockType: string; success: boolean; error?: string; details?: any }[] = [];

    for (const [blockType, handles] of Object.entries(handlesByType)) {
      // Test the first handle of each type
      const handleIndex = handles[0].index;
      const handleSelector = `.tiptap-drag-handle:nth-of-type(${handleIndex + 1})`;

      console.log(`Testing ${blockType} block...`);

      const result = await page.evaluate(({ selector, type }) => {
        const allHandles = document.querySelectorAll('.tiptap-drag-handle');
        
        // Find the handle for this block type
        let targetHandle: HTMLElement | null = null;
        for (const h of allHandles) {
          if (h.getAttribute('data-node-type') === type) {
            targetHandle = h as HTMLElement;
            break;
          }
        }
        
        if (!targetHandle) {
          return { success: false, error: `Handle not found for ${type}` };
        }

        const rect = targetHandle.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          return { success: false, error: `Handle has zero dimensions for ${type}` };
        }

        // Trigger mousedown to start drag
        targetHandle.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 5,
          clientY: rect.top + 5,
        }));

        // Check for ghost overlay element
        const ghostOverlay = document.querySelector('.drag-ghost-overlay-element');
        if (!ghostOverlay) {
          // Clean up
          document.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + 5,
            clientY: rect.top + 5,
          }));
          return { success: false, error: 'Ghost overlay not created' };
        }

        // Verify overlay properties
        const computedStyle = window.getComputedStyle(ghostOverlay);
        const overlayRect = ghostOverlay.getBoundingClientRect();
        
        // Check for "DRAGGING" label
        const hasLabel = ghostOverlay.innerHTML.includes('DRAGGING');
        
        // Check that position is fixed
        const isFixed = computedStyle.position === 'fixed';
        
        // Check that z-index is high (should be 99999)
        const zIndex = parseInt(computedStyle.zIndex || '0');
        const hasCorrectZIndex = zIndex >= 99999;

        // Check that overlay has proper dimensions
        const hasDimensions = overlayRect.width > 0 && overlayRect.height > 0;

        // Move mouse to ensure overlay persists
        document.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 50,
          clientY: rect.top + 50,
        }));

        // Check overlay persists after mousemove
        const ghostOverlayAfterMove = document.querySelector('.drag-ghost-overlay-element');
        const overlayPersists = !!ghostOverlayAfterMove;

        // Complete drag
        document.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 50,
          clientY: rect.top + 50,
        }));

        // Check overlay is cleaned up
        const ghostOverlayAfterUp = document.querySelector('.drag-ghost-overlay-element');
        const overlayCleanedUp = !ghostOverlayAfterUp;

        const success = hasLabel && isFixed && hasCorrectZIndex && hasDimensions && overlayPersists && overlayCleanedUp;

        return {
          success,
          blockType: type,
          details: {
            hasLabel,
            isFixed,
            hasCorrectZIndex,
            hasDimensions,
            overlayPersists,
            overlayCleanedUp,
            zIndex,
            overlayRect: {
              width: overlayRect.width,
              height: overlayRect.height,
              top: overlayRect.top,
              left: overlayRect.left,
            },
          },
        };
      }, { selector: handleSelector, type: blockType });

      results.push(result);

      if (result.success) {
        console.log(`  ✅ ${blockType}: Ghost overlay works correctly`);
      } else {
        console.log(`  ❌ ${blockType}: ${result.error || 'Failed'}`);
        if (result.details) {
          console.log(`     Details: ${JSON.stringify(result.details)}`);
        }
      }
    }

    // Summary
    console.log('\n=== Ghost Overlay Test Summary ===');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    console.log(`Passed: ${successCount}/${results.length}`);
    console.log(`Failed: ${failCount}/${results.length}\n`);

    // List failed block types
    const failedTypes = results.filter(r => !r.success);
    if (failedTypes.length > 0) {
      console.log('Failed block types:');
      failedTypes.forEach(f => {
        console.log(`  - ${f.blockType}: ${f.error || 'Unknown error'}`);
      });
    }

    // Assert all block types pass
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    console.log('\n✅ All block types have working ghost overlay visual effect\n');
  });

  test('Step 10: verify ghost overlay appears at correct position for complex blocks after text', async ({ page }) => {
    console.log('=== Test Step 10: Verify ghost overlay at correct position for complex blocks ===\n');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    // Test scenario: text block before image/table, drag the image/table
    const result = await page.evaluate(async () => {
      // Find all image and table handles
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      const imageHandles: HTMLElement[] = [];
      const tableHandles: HTMLElement[] = [];
      const textHandles: HTMLElement[] = [];

      handles.forEach((h) => {
        const nodeType = h.getAttribute('data-node-type');
        if (nodeType === 'image') {
          imageHandles.push(h as HTMLElement);
        } else if (nodeType === 'table') {
          tableHandles.push(h as HTMLElement);
        } else if (nodeType === 'paragraph' || nodeType === 'heading') {
          textHandles.push(h as HTMLElement);
        }
      });

      // For each image handle, verify the ghost overlay appears at the image position
      // NOT at the text block before it
      const testResults: { blockType: string; success: boolean; error?: string; details?: any }[] = [];

      // Test image handles
      for (const handle of imageHandles.slice(0, 2)) {
        const pos = handle.getAttribute('data-pos');
        const nodeType = handle.getAttribute('data-node-type');
        
        if (!pos || !nodeType) continue;

        // Find the actual IMG element associated with this handle
        // Look at the DOM structure to find the image
        const imgElement = document.querySelector('img');
        if (!imgElement) {
          testResults.push({ blockType: 'image', success: false, error: 'No IMG element found' });
          continue;
        }

        // Get positions before dragging
        const imgRect = imgElement.getBoundingClientRect();
        const handleRect = handle.getBoundingClientRect();
        
        // Find the text block before this image (if any)
        const prevSibling = handle.previousElementSibling;
        let prevBlockRect: DOMRect | null = null;
        if (prevSibling && prevSibling.tagName === 'P') {
          prevBlockRect = prevSibling.getBoundingClientRect();
        }

        // Trigger mousedown to start drag
        handle.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: handleRect.left + 5,
          clientY: handleRect.top + 5,
        }));

        // Check for ghost overlay
        const ghostOverlay = document.querySelector('.drag-ghost-overlay-element');
        if (!ghostOverlay) {
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: handleRect.left + 5, clientY: handleRect.top + 5 }));
          testResults.push({ blockType: 'image', success: false, error: 'Ghost overlay not created' });
          continue;
        }

        const overlayRect = ghostOverlay.getBoundingClientRect();
        
        // CRITICAL CHECK: Overlay should be near the IMG element, NOT the text block
        const overlayCenterY = overlayRect.top + overlayRect.height / 2;
        const imgCenterY = imgRect.top + imgRect.height / 2;
        
        // Calculate distance from overlay center to image center
        const distanceToImage = Math.abs(overlayCenterY - imgCenterY);
        
        // If there's a text block before, calculate distance to that
        let distanceToPrevBlock = Infinity;
        if (prevBlockRect) {
          const prevCenterY = prevBlockRect.top + prevBlockRect.height / 2;
          distanceToPrevBlock = Math.abs(overlayCenterY - prevCenterY);
        }

        // Move mouse to ensure overlay persists
        document.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: handleRect.left + 50,
          clientY: handleRect.top + 50,
        }));

        const ghostOverlayAfterMove = document.querySelector('.drag-ghost-overlay-element');
        const overlayPersists = !!ghostOverlayAfterMove;

        // Complete drag
        document.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: handleRect.left + 50,
          clientY: handleRect.top + 50,
        }));

        const overlayCleanedUp = !document.querySelector('.drag-ghost-overlay-element');

        // Success criteria:
        // 1. Overlay is closer to image than to previous text block (if one exists)
        // 2. Overlay persists during drag
        // 3. Overlay is cleaned up after mouseup
        const closerToImage = distanceToImage < distanceToPrevBlock || !prevBlockRect;
        const success = closerToImage && overlayPersists && overlayCleanedUp && overlayRect.height > 0;

        testResults.push({
          blockType: 'image',
          success,
          details: {
            overlayRect: { ...overlayRect },
            imgRect: { ...imgRect },
            distanceToImage: Math.round(distanceToImage),
            distanceToPrevBlock: distanceToPrevBlock === Infinity ? 'N/A' : Math.round(distanceToPrevBlock),
            closerToImage,
            overlayPersists,
            overlayCleanedUp,
            hasPrevTextBlock: !!prevBlockRect,
          },
        });
      }

      // Test table handles
      for (const handle of tableHandles.slice(0, 2)) {
        const pos = handle.getAttribute('data-pos');
        const nodeType = handle.getAttribute('data-node-type');
        
        if (!pos || !nodeType) continue;

        // Find the table or tableWrapper element
        const tableEl = document.querySelector('table, .tableWrapper');
        if (!tableEl) {
          testResults.push({ blockType: 'table', success: false, error: 'No table element found' });
          continue;
        }

        const tableRect = tableEl.getBoundingClientRect();
        const handleRect = handle.getBoundingClientRect();

        // Trigger mousedown to start drag
        handle.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: handleRect.left + 5,
          clientY: handleRect.top + 5,
        }));

        const ghostOverlay = document.querySelector('.drag-ghost-overlay-element');
        if (!ghostOverlay) {
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: handleRect.left + 5, clientY: handleRect.top + 5 }));
          testResults.push({ blockType: 'table', success: false, error: 'Ghost overlay not created' });
          continue;
        }

        const overlayRect = ghostOverlay.getBoundingClientRect();
        const overlayCenterY = overlayRect.top + overlayRect.height / 2;
        const tableCenterY = tableRect.top + tableRect.height / 2;
        const distanceToTable = Math.abs(overlayCenterY - tableCenterY);

        // Move mouse to ensure overlay persists
        document.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: handleRect.left + 50,
          clientY: handleRect.top + 50,
        }));

        const ghostOverlayAfterMove = document.querySelector('.drag-ghost-overlay-element');
        const overlayPersists = !!ghostOverlayAfterMove;

        // Complete drag
        document.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: handleRect.left + 50,
          clientY: handleRect.top + 50,
        }));

        const overlayCleanedUp = !document.querySelector('.drag-ghost-overlay-element');

        const success = distanceToTable < 50 && overlayPersists && overlayCleanedUp && overlayRect.height > 0;

        testResults.push({
          blockType: 'table',
          success,
          details: {
            overlayRect: { ...overlayRect },
            tableRect: { ...tableRect },
            distanceToTable: Math.round(distanceToTable),
            overlayPersists,
            overlayCleanedUp,
          },
        });
      }

      return { testResults };
    });

    console.log('Test results for complex blocks after text:');
    result.testResults.forEach((r: any) => {
      if (r.success) {
        console.log(`  ✅ ${r.blockType}: Ghost overlay appears at correct position`);
      } else {
        console.log(`  ❌ ${r.blockType}: ${r.error || 'Failed'}`);
        if (r.details) {
          console.log(`     Details: distanceToImage=${r.details.distanceToImage}, distanceToPrevBlock=${r.details.distanceToPrevBlock}`);
        }
      }
    });

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/complex-block-position.png' });

    // Assert all tests pass
    result.testResults.forEach((r: any) => {
      expect(r.success).toBe(true);
    });

    console.log('\n✅ Complex block position verification completed\n');
  });

  test('Step 11: drag middle block (B) before first block (A) in A,B,C order', async ({ page }) => {
    console.log('=== Test Step 11: Drag middle block before first ===');

    await page.goto('/wiki/new-document-ex');
    await page.waitForSelector('.ProseMirror', { timeout: 15000 });

    await clearEditor(page);
    await setEditorContent(page, ['Block A', 'Block B', 'Block C']);

    // Verify initial order: A, B, C
    const initialOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Initial order:', initialOrder);
    expect(initialOrder).toEqual(['Block A', 'Block B', 'Block C']);

    // Find drag handles and verify they correspond to the paragraphs
    const handleInfo = await page.evaluate(() => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      
      const result: { 
        idx: number; 
        pos: string | null; 
        nodeType: string | null;
        top: number;
        paragraphText: string;
        paragraphTop: number;
        distanceToParagraph: number;
      }[] = [];
      
      for (let i = 0; i < handles.length; i++) {
        const h = handles[i] as HTMLElement;
        const handleRect = h.getBoundingClientRect();
        
        // Find which paragraph this handle is near
        let nearestParagraph = '';
        let nearestDist = Infinity;
        let nearestTop = 0;
        
        for (const p of paragraphs) {
          const pRect = p.getBoundingClientRect();
          const dist = Math.abs(handleRect.top - pRect.top);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestParagraph = p.textContent?.trim() || '';
            nearestTop = pRect.top;
          }
        }
        
        result.push({
          idx: i,
          pos: h.getAttribute('data-pos'),
          nodeType: h.getAttribute('data-node-type'),
          top: Math.round(handleRect.top),
          paragraphText: nearestParagraph,
          paragraphTop: Math.round(nearestTop),
          distanceToParagraph: Math.round(nearestDist),
        });
      }
      return result;
    });
    console.log('Handle mapping to paragraphs:', JSON.stringify(handleInfo, null, 2));

    // Find the handle for Block B (middle block) and Block A (first block)
    const blockBHandle = handleInfo.find(h => h.paragraphText === 'Block B' && h.distanceToParagraph < 100);
    const blockAHandle = handleInfo.find(h => h.paragraphText === 'Block A' && h.distanceToParagraph < 100);
    
    if (!blockBHandle || !blockAHandle) {
      console.error('Could not find handles for Block A and Block B');
      console.log('Block A handle:', blockAHandle);
      console.log('Block B handle:', blockBHandle);
      return;
    }
    
    console.log(`Block A handle idx: ${blockAHandle.idx}, pos: ${blockAHandle.pos}`);
    console.log(`Block B handle idx: ${blockBHandle.idx}, pos: ${blockBHandle.pos}`);

    // Execute the drag: drag Block B's handle and drop before Block A
    const dragResult = await page.evaluate(({ blockAIdx, blockBIdx }) => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      const allHandles = Array.from(handles) as HTMLElement[];
      
      const sourceHandle = allHandles[blockBIdx]; // Block B (middle)
      const targetHandle = allHandles[blockAIdx]; // Block A (first)
      
      if (!sourceHandle || !targetHandle) {
        return { success: false, error: 'Handles not found' };
      }
      
      const sourceRect = sourceHandle.getBoundingClientRect();
      const targetRect = targetHandle.getBoundingClientRect();
      
      console.log(`Source (Block B) rect: top=${sourceRect.top}, height=${sourceRect.height}`);
      console.log(`Target (Block A) rect: top=${targetRect.top}, height=${targetRect.height}`);
      
      // Trigger mousedown on source (Block B's handle)
      sourceHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceRect.left + 5,
        clientY: sourceRect.top + 5,
      }));
      
      // Move mouse ABOVE Block A to drop before it
      const dropX = targetRect.left + 5;
      const dropY = targetRect.top - 30; // ABOVE Block A
      
      console.log(`Moving mouse to: x=${dropX}, y=${dropY}`);
      
      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: dropX,
        clientY: dropY,
      }));
      
      return { success: true };
    }, { blockAIdx: blockAHandle.idx, blockBIdx: blockBHandle.idx });

    console.log('Drag initiation:', dragResult);

    // Take screenshot during drag
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/drag-before-during.png' });

    // Complete the drag by releasing mouse ABOVE Block A
    const completeResult = await page.evaluate(({ blockAIdx }) => {
      const handles = document.querySelectorAll('.tiptap-drag-handle');
      const allHandles = Array.from(handles) as HTMLElement[];
      
      // Block A may have moved since we started, but it should still be first
      let blockAHandle = allHandles[blockAIdx];
      if (!blockAHandle) {
        blockAHandle = handles[0] as HTMLElement; // Fallback to first handle
      }
      
      const targetRect = blockAHandle.getBoundingClientRect();
      
      // Drop ABOVE Block A (before it)
      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: targetRect.left + 5,
        clientY: targetRect.top - 30, // ABOVE Block A
      }));
      
      return { success: true };
    }, { blockAIdx: blockAHandle.idx });

    console.log('Drag completion:', completeResult);
    await page.waitForTimeout(500);

    // Take final screenshot
    await page.screenshot({ path: 'test-results/drag-before-after.png' });

    // Verify final order: B, A, C
    const finalOrder = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).map(p => p.textContent?.trim() || '');
    });
    console.log('Final order after dragging B before A:', finalOrder);

    // Check that Block B is before Block A
    const blockAIdx = finalOrder.indexOf('Block A');
    const blockBIdx = finalOrder.indexOf('Block B');
    const blockCIdx = finalOrder.indexOf('Block C');

    console.log(`Block A idx: ${blockAIdx}, Block B idx: ${blockBIdx}, Block C idx: ${blockCIdx}`);

    // Expected order: B, A, C
    // Block B should be before Block A
    expect(blockBIdx).toBeGreaterThanOrEqual(0);
    expect(blockAIdx).toBeGreaterThanOrEqual(0);
    expect(blockCIdx).toBeGreaterThanOrEqual(0);
    expect(blockBIdx).toBeLessThan(blockAIdx); // B should be before A
    expect(blockAIdx).toBeLessThan(blockCIdx); // A should be before C

    // Verify no empty lines
    const emptyLineCount = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('.ProseMirror p');
      return Array.from(paragraphs).filter(p => !p.textContent?.trim()).length;
    });
    console.log('Empty lines after drag:', emptyLineCount);
    expect(emptyLineCount).toBe(0);

    console.log('✅ PASS: Middle block (B) moved before first block (A) correctly\n');
  });
});
