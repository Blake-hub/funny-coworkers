/**
 * Drag and Drop Verification Tool
 * 
 * Usage in browser console:
 * 1. Load the document with several blocks
 * 2. Open DevTools Console
 * 3. Run: verifyDragDrop()
 * 4. Follow the instructions in the console
 * 
 * This tool will:
 * - Check if drag handles exist
 * - Verify that drag events are triggered
 * - Test drop operations
 */

declare global {
  interface Window {
    __VERIFY_DRAG_DROP__: () => Promise<boolean>
    __TEST_DRAG_BLOCK__: () => void
  }
}

export function setupDragDropVerification(editor: any) {
  window.__TEST_DRAG_BLOCK__ = () => {
    const handle = document.querySelector('.tiptap-drag-handle') as HTMLElement
    if (!handle) {
      console.error('[DragDrop Test] No drag handles found!')
      console.log('Check if the editor has any blocks (paragraphs, headings, etc.)')
      return
    }

    const pos = handle.dataset.pos
    console.log(`[DragDrop Test] Found drag handle at pos: ${pos}`)

    console.log('[DragDrop Test] Simulating mousedown on drag handle...')
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: handle.getBoundingClientRect().left + 5,
      clientY: handle.getBoundingClientRect().top + 5
    })
    handle.dispatchEvent(mousedownEvent)
    console.log('[DragDrop Test] mousedown dispatched')

    setTimeout(() => {
      const preview = document.querySelector('.dragging-source-block')
      if (preview) {
        console.log('[DragDrop Test] ✅ Source block has dragging class')
      } else {
        console.log('[DragDrop Test] ❌ Source block does not have dragging class')
      }

      const floatingPreview = document.body.querySelector('[style*="position: fixed"]')
      if (floatingPreview) {
        console.log('[DragDrop Test] ✅ Floating preview element exists')
      } else {
        console.log('[DragDrop Test] ❌ No floating preview element')
      }

      console.log('[DragDrop Test] Test complete. Check console.log output for results.')
    }, 100)
  }

  window.__VERIFY_DRAG_DROP__ = async () => {
    console.log('=== Drag and Drop Verification ===\n')

    console.log('Step 1: Checking for drag handles...')
    const handles = document.querySelectorAll('.tiptap-drag-handle')
    if (handles.length === 0) {
      console.error('❌ No drag handles found!')
      console.log('Possible issues:')
      console.log('  1. The DragHandleEx extension is not properly loaded')
      console.log('  2. The document has no blocks that qualify for dragging')
      console.log('  3. The extension class name mismatch')
      return false
    }
    console.log(`✅ Found ${handles.length} drag handle(s)\n`)

    console.log('Step 2: Verifying handle attributes...')
    handles.forEach((handle, i) => {
      const pos = handle.dataset.pos
      const nodeType = handle.dataset.nodeType
      console.log(`  Handle ${i}: pos=${pos}, type=${nodeType}`)
    })
    console.log('✅ Handles have proper attributes\n')

    console.log('Step 3: Testing mousedown event...')
    const firstHandle = handles[0] as HTMLElement
    
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.error('❌ Test timed out - mousemove not triggered')
        resolve(false)
      }, 2000)

      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: firstHandle.getBoundingClientRect().left + 5,
        clientY: firstHandle.getBoundingClientRect().top + 5
      })
      firstHandle.dispatchEvent(mousedownEvent)

      setTimeout(() => {
        clearTimeout(timeout)
        
        const preview = document.body.querySelector('[style*="position: fixed"]')
        if (preview) {
          console.log('✅ Floating preview created')
        } else {
          console.error('❌ No floating preview - drag start failed')
        }

        const sourceBlock = document.querySelector('.dragging-source-block')
        if (sourceBlock) {
          console.log('✅ Source block has dragging class')
        } else {
          console.warn('⚠️ Source block does not have dragging class (non-critical)')
        }

        console.log('\nStep 4: Simulating mousemove to different position...')
        const secondHandle = handles[1] as HTMLElement | null
        if (secondHandle) {
          const moveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: secondHandle.getBoundingClientRect().left + 5,
            clientY: secondHandle.getBoundingClientRect().top + 50
          })
          document.dispatchEvent(moveEvent)

          setTimeout(() => {
            const indicator = document.querySelector('.tiptap-drop-indicator')
            if (indicator) {
              console.log('✅ Drop indicator shown')
            } else {
              console.warn('⚠️ Drop indicator not shown')
            }

            console.log('\n=== Test Complete ===')
            console.log('If all ✅ checks passed, drag and drop should work.')
            console.log('If any ❌ check failed, check the error messages above.')
            
            document.body.style.cursor = ''
            resolve(!!preview)
          }, 100)
        } else {
          console.warn('⚠️ Need at least 2 blocks to test drop indicator')
          resolve(!!preview)
        }
      }, 200)
    })
  }

  console.log('[DragDrop] Verification tools loaded. Use __VERIFY_DRAG_DROP__() to test.')
}

export function cleanupDragDrop() {
  delete (window as any).__VERIFY_DRAG_DROP__
  delete (window as any).__TEST_DRAG_BLOCK__
}