import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Node as PMNode } from '@tiptap/pm/model'

export interface DragHandleOptions {
  blockTypes: string[]
  handleClass: string
}

function isTargetBlock(node: PMNode, parent: PMNode | null, blockTypes: string[]): boolean {
  if (!node.type.isBlock) return false
  if (!blockTypes.includes(node.type.name)) return false
  const parentName = parent?.type.name
  if (
    node.type.name === 'paragraph' &&
    (parentName === 'listItem' ||
      parentName === 'tableCell' ||
      parentName === 'tableHeader' ||
      parentName === 'blockquote')
  ) {
    return false
  }
  if (node.type.name === 'tableRow' || node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
    return false
  }
  return true
}

export const DragHandleEx = Extension.create<DragHandleOptions>({
  name: 'dragHandle',

  addOptions() {
    return {
      blockTypes: [
        'paragraph',
        'heading',
        'blockquote',
        'codeBlock',
        'listItem',
        'table',
        'horizontalRule',
        'image',
      ],
      handleClass: 'tiptap-drag-handle',
    }
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('dragHandle')
    const { blockTypes, handleClass } = this.options

    const dragState: {
      dragging: boolean
      sourceFrom: number
      sourceTo: number
      sourceNodeType: string | null
      sourceBlockEl: HTMLElement | null
      indicatorEl: HTMLElement | null
      previewEl: HTMLElement | null
      overlayEl: HTMLElement | null
      previewStartX: number
      previewStartY: number
      targetPos: number | null
    } = {
      dragging: false,
      sourceFrom: -1,
      sourceTo: -1,
      sourceNodeType: null,
      sourceBlockEl: null,
      indicatorEl: null,
      previewEl: null,
      overlayEl: null,
      previewStartX: 0,
      previewStartY: 0,
      targetPos: null,
    }

    const removeIndicator = () => {
      if (dragState.indicatorEl?.parentNode) {
        dragState.indicatorEl.parentNode.removeChild(dragState.indicatorEl)
      }
      dragState.indicatorEl = null
    }

    const removePreview = () => {
      if (dragState.previewEl?.parentNode) {
        dragState.previewEl.parentNode.removeChild(dragState.previewEl)
      }
      dragState.previewEl = null
    }

    const applyGhostEffect = (blockDom: HTMLElement) => {
      // Get the exact position and size of the source block
      const rect = blockDom.getBoundingClientRect()
      
      // Remove any existing ghost overlay
      removeGhostOverlay()
      
      // Create a completely independent ghost overlay at the original position
      const overlay = document.createElement('div')
      overlay.className = 'drag-ghost-overlay-element'
      overlay.style.cssText = `
        position: fixed !important;
        top: ${rect.top}px !important;
        left: ${rect.left}px !important;
        width: ${rect.width}px !important;
        height: ${rect.height}px !important;
        z-index: 99999 !important;
        pointer-events: none !important;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(59, 130, 246, 0.1) 10px,
          rgba(59, 130, 246, 0.1) 20px
        ), rgba(59, 130, 246, 0.15) !important;
        border: 2px dashed #3b82f6 !important;
        border-radius: 6px !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1) !important;
        animation: drag-ghost-pulse 1.2s ease-in-out infinite !important;
      `
      
      // Add a visual label
      const label = document.createElement('div')
      label.style.cssText = `
        position: absolute !important;
        top: -24px !important;
        left: 0 !important;
        background: #3b82f6 !important;
        color: white !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        padding: 3px 10px !important;
        border-radius: 4px !important;
        white-space: nowrap !important;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4) !important;
        letter-spacing: 0.5px !important;
      `
      label.textContent = '📌 DRAGGING'
      overlay.appendChild(label)
      
      document.body.appendChild(overlay)
      dragState.overlayEl = overlay
    }

    const removeGhostOverlay = () => {
      if (dragState.overlayEl?.parentNode) {
        dragState.overlayEl.parentNode.removeChild(dragState.overlayEl)
      }
      dragState.overlayEl = null
    }

    const findBlockDomByPos = (view: any, pos: number, nodeType?: string | null): HTMLElement | null => {
      try {
        const $block = view.state.doc.resolve(pos + 1)
        const desc = view.domAtPos($block.pos)
        let n: Node | null = desc.node
        
        // For specific node types like images, try to find the actual DOM element
        if (nodeType === 'image') {
          if (n.nodeType === 1 && (n as HTMLElement).tagName === 'IMG') {
            return n as HTMLElement
          }
          const imgEl = (n as HTMLElement).querySelector?.('img')
          if (imgEl) return imgEl as HTMLElement
          if (n.parentNode) {
            const parentImg = (n.parentNode as HTMLElement).querySelector?.('img')
            if (parentImg) return parentImg as HTMLElement
          }
        } else if (nodeType === 'horizontalRule') {
          if (n.nodeType === 1 && (n as HTMLElement).tagName === 'HR') {
            return n as HTMLElement
          }
          const hrEl = (n as HTMLElement).querySelector?.('hr')
          if (hrEl) return hrEl as HTMLElement
        } else if (nodeType === 'table') {
          if (n.nodeType === 1) {
            const el = n as HTMLElement
            if (el.tagName === 'TABLE' || el.classList?.contains('tableWrapper')) {
              return el
            }
            const tableEl = el.querySelector?.('table, .tableWrapper')
            if (tableEl) return tableEl as HTMLElement
          }
        }
        
        // Default: use the element node
        if (n && n.nodeType !== 1) n = n.parentNode as Node | null
        return n as HTMLElement | null
      } catch {
        return null
      }
    }

    const removeGhostEffect = (blockDom: HTMLElement | null) => {
      // Remove the independent ghost overlay
      removeGhostOverlay()
      
      // Remove any styles we added to the original element
      if (blockDom) {
        blockDom.style.removeProperty('opacity')
      }
    }

    const buildIndicator = (width: number) => {
      const el = document.createElement('div')
      el.className = 'tiptap-drop-indicator'
      el.style.width = width + 'px'
      return el
    }

    const createDraggedBlockPreview = (blockDom: HTMLElement, mouseX: number, mouseY: number) => {
      const rect = blockDom.getBoundingClientRect()
      const clone = blockDom.cloneNode(true) as HTMLElement
      clone.style.position = 'fixed'
      clone.style.left = mouseX - 10 + 'px'
      clone.style.top = mouseY - 10 + 'px'
      clone.style.width = rect.width + 'px'
      clone.style.pointerEvents = 'none'
      clone.style.zIndex = '9999'
      clone.style.opacity = '0.5'
      clone.style.transform = 'rotate(2deg)'
      clone.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)'
      clone.style.transition = 'none'
      document.body.appendChild(clone)
      return clone
    }

    const updateDraggedBlockPreview = (mouseX: number, mouseY: number) => {
      if (dragState.previewEl) {
        dragState.previewEl.style.left = mouseX - 10 + 'px'
        dragState.previewEl.style.top = mouseY - 10 + 'px'
      }
    }

    const handleMouseMove = (view: any, event: MouseEvent) => {
      if (!dragState.dragging) return

      document.body.style.cursor = 'grabbing'
      updateDraggedBlockPreview(event.clientX, event.clientY)

      // Re-apply ghost effect to source block (Tiptap may re-render DOM during drag)
      // Re-find the block if the reference becomes stale (detached from DOM)
      if (dragState.sourceBlockEl && !dragState.sourceBlockEl.isConnected) {
        const freshBlock = findBlockDomByPos(view, dragState.sourceFrom, dragState.sourceNodeType)
        if (freshBlock) {
          dragState.sourceBlockEl = freshBlock
        }
      }
      if (dragState.sourceBlockEl) {
        applyGhostEffect(dragState.sourceBlockEl)
      }

      const editorEl = view.dom as HTMLElement
      const editorRect = editorEl.getBoundingClientRect()
      
      const clampedX = Math.max(editorRect.left + 1, Math.min(event.clientX, editorRect.right - 1))
      const clampedY = Math.max(editorRect.top + 1, Math.min(event.clientY, editorRect.bottom - 1))
      
      const coords = { left: clampedX, top: clampedY }
      const dropPos = view.posAtCoords(coords)
      if (!dropPos) {
        removeIndicator()
        dragState.targetPos = null
        return
      }
      event.preventDefault()

      const findBlockAtPos = (pos: number): { from: number; to: number } | null => {
        const maxPos = view.state.doc.content.size
        const tryPos = Math.min(pos, maxPos)
        const $p = view.state.doc.resolve(tryPos)
        for (let d = $p.depth; d >= 0; d--) {
          const nd = $p.node(d)
          const parent = d === 0 ? null : $p.node(d - 1)
          if (isTargetBlock(nd, parent, blockTypes)) {
            const from = $p.before(d)
            const to = from + nd.nodeSize
            return { from, to }
          }
        }
        return null
      }

      let blockInfo = findBlockAtPos(dropPos.pos)
      
      if (!blockInfo) {
        blockInfo = findBlockAtPos(Math.min(dropPos.pos + 1, view.state.doc.content.size))
      }
      if (!blockInfo && dropPos.pos > 0) {
        blockInfo = findBlockAtPos(dropPos.pos - 1)
      }
      if (!blockInfo) {
        blockInfo = findBlockAtPos(Math.min(dropPos.pos + 2, view.state.doc.content.size))
      }

      let blockFrom: number
      let blockTo: number
      if (blockInfo) {
        blockFrom = blockInfo.from
        blockTo = blockInfo.to
      } else {
        blockFrom = dropPos.pos
        blockTo = dropPos.pos
      }

      const resolvePos = Math.min(blockFrom + 1, view.state.doc.content.size)
      const $block = view.state.doc.resolve(resolvePos)
      let blockDom: HTMLElement | null = null
      try {
        const desc = view.domAtPos($block.pos)
        let n: Node | null = desc.node
        if (n && n.nodeType !== 1) n = n.parentNode as Node | null
        blockDom = n as HTMLElement | null
      } catch {}

      if (!blockDom || !blockDom.getBoundingClientRect) {
        removeIndicator()
        return
      }
      const rect = blockDom.getBoundingClientRect()
      const wrapEl =
        (editorEl.closest('.tiptap-editor') as HTMLElement | null) ||
        (editorEl.closest('.editor-wrap') as HTMLElement | null) ||
        editorEl.parentElement!
      const wrapRect = wrapEl.getBoundingClientRect()
      const isAfter = event.clientY > rect.top + rect.height / 2
      
      console.log(`[DragDrop] MouseMove: clientY=${Math.round(event.clientY)}, rect.top=${Math.round(rect.top)}, rect.height=${Math.round(rect.height)}, midY=${Math.round(rect.top + rect.height / 2)}, isAfter=${isAfter}, blockFrom=${blockFrom}, blockTo=${blockTo}`);

      if (!dragState.indicatorEl) {
        dragState.indicatorEl = buildIndicator(rect.width)
        wrapEl.appendChild(dragState.indicatorEl)
      }
      const indicator = dragState.indicatorEl
      indicator.style.position = 'absolute'
      indicator.style.width = rect.width + 'px'
      indicator.style.left = rect.left - wrapRect.left + 'px'
      indicator.style.top =
        (isAfter ? rect.bottom : rect.top) - wrapRect.top + 'px'

      dragState.targetPos = isAfter ? blockTo : blockFrom
    }

    const handleMouseUp = (view: any) => {
      if (!dragState.dragging) return
      const { sourceFrom, sourceTo, targetPos } = dragState
      const s = dragState.sourceFrom
      
      // Use stored block reference if available, otherwise find it
      let blockDom = dragState.sourceBlockEl
      if (!blockDom || !blockDom.isConnected) {
        blockDom = findBlockDomByPos(view, sourceFrom, dragState.sourceNodeType)
      }
      
      // Remove ghost effect from source block
      removeGhostEffect(blockDom)
      dragState.sourceBlockEl = null
      dragState.sourceNodeType = null
      dragState.dragging = false
      dragState.sourceFrom = -1
      dragState.sourceTo = -1
      dragState.targetPos = null
      document.body.style.cursor = ''
      removeIndicator()
      removePreview()

      console.log(`[DragDrop] handleMouseUp: sourceFrom=${sourceFrom}, sourceTo=${sourceTo}, targetPos=${targetPos}`);
      
      if (s < 0 || sourceTo < 0 || targetPos == null) {
        console.log('[DragDrop] Aborting: invalid positions');
        return
      }
      if (targetPos >= sourceFrom && targetPos <= sourceTo) {
        console.log(`[DragDrop] Aborting: targetPos ${targetPos} is within source block ${sourceFrom}-${sourceTo}`);
        return
      }

      const { state, dispatch } = view
      try {
        const sourceSize = sourceTo - sourceFrom
        const slice = state.doc.slice(sourceFrom, sourceTo)

        let adjustedTarget = targetPos
        if (targetPos > sourceFrom) {
          adjustedTarget = targetPos - sourceSize
        }

        console.log(`[DragDrop] Moving block from ${sourceFrom}-${sourceTo} to position ${adjustedTarget}`)

        let t = state.tr.delete(sourceFrom, sourceTo)
        t = t.insert(adjustedTarget, slice.content)
        dispatch(t.scrollIntoView())

        console.log('[DragDrop] Drop completed successfully')
      } catch (err) {
        console.error('[DragDrop] Error during drop:', err)
      }
    }

    return [
      new Plugin({
        key: pluginKey,

        state: {
          init(_, state) {
            return buildDecorations(state.doc, blockTypes, handleClass)
          },
          apply(tr, oldSet, _oldState, newState) {
            if (!tr.docChanged && !tr.selectionSet) return oldSet
            return buildDecorations(newState.doc, blockTypes, handleClass)
          },
        },

        props: {
          decorations(state) {
            return pluginKey.getState(state)
          },

          handleDOMEvents: {
            mousedown: (view, event) => {
              const target = event.target as HTMLElement
              const btn = target.closest(`.${handleClass}`) as HTMLElement | null
              if (!btn) return false

              const pos = Number(btn.dataset.pos ?? '-1')
              if (!Number.isFinite(pos) || pos < 0) return false

              const nodeType = btn.dataset.nodeType

              // The handle's data-pos stores the position of the specific node
              // For leaf nodes (like images), this is the exact node position
              // For block nodes, this is the block's position
              
              let foundFrom = -1
              let foundTo = -1
              
              const tryResolve = (resolvePos: number, targetType?: string): boolean => {
                if (resolvePos < 0 || resolvePos > view.state.doc.content.size) return false
                const $pos = view.state.doc.resolve(resolvePos)
                const depth = $pos.depth
                
                // First pass: look for node matching the specific targetType
                if (targetType) {
                  for (let d = depth; d >= 0; d--) {
                    const nd = $pos.node(d)
                    const parent = d === 0 ? null : $pos.node(d - 1)
                    if (nd.type.name === targetType) {
                      foundFrom = $pos.before(d)
                      foundTo = foundFrom + nd.nodeSize
                      return true
                    }
                  }
                }
                
                // Second pass: generic block type search (skip if we already tried specific type)
                if (!targetType) {
                  for (let d = depth; d >= 0; d--) {
                    const nd = $pos.node(d)
                    const parent = d === 0 ? null : $pos.node(d - 1)
                    if (isTargetBlock(nd, parent, blockTypes)) {
                      foundFrom = $pos.before(d)
                      foundTo = foundFrom + nd.nodeSize
                      return true
                    }
                  }
                }
                return false
              }
              
              // Strategy: Use pos + 1 first to be INSIDE the target block
              // pos is the block's start position, and resolve(pos) may find the PREVIOUS block at boundary
              // Using pos + 1 ensures we're inside the target block
              if (nodeType) {
                if (
                  tryResolve(pos + 1, nodeType) ||
                  tryResolve(pos, nodeType) ||
                  tryResolve(pos - 1, nodeType)
                ) {
                  // Found the specific node type
                } else {
                  // Fall back to generic search
                  if (!tryResolve(pos + 1) && !tryResolve(pos) && !tryResolve(pos - 1)) {
                    console.warn('[DragDrop] Could not find target block at pos', pos, 'nodeType:', nodeType)
                    return false
                  }
                }
              } else {
                // No specific node type, use generic search
                if (!tryResolve(pos + 1) && !tryResolve(pos) && !tryResolve(pos - 1)) {
                  console.warn('[DragDrop] Could not find target block at pos', pos)
                  return false
                }
              }

              console.log(`[DragDrop] Drag started on block ${foundFrom}-${foundTo}`)

              event.preventDefault()
              event.stopPropagation()
              dragState.dragging = true
              dragState.sourceFrom = foundFrom
              dragState.sourceTo = foundTo
              dragState.sourceNodeType = nodeType
              dragState.previewStartX = event.clientX
              dragState.previewStartY = event.clientY

              const $block = view.state.doc.resolve(foundFrom + 1)
              let blockDom: HTMLElement | null = null
              try {
                const desc = view.domAtPos($block.pos)
                let n: Node | null = desc.node
                
                // For specific node types like images, try to find the actual DOM element
                if (nodeType === 'image') {
                  // For images, find the IMG element directly
                  if (n.nodeType === 1 && (n as HTMLElement).tagName === 'IMG') {
                    blockDom = n as HTMLElement
                  } else {
                    // Look for IMG in children
                    const imgEl = (n as HTMLElement).querySelector?.('img')
                    if (imgEl) {
                      blockDom = imgEl as HTMLElement
                    } else if (n.parentNode) {
                      // Try parent's querySelector
                      const parentImg = (n.parentNode as HTMLElement).querySelector?.('img')
                      if (parentImg) blockDom = parentImg as HTMLElement
                    }
                  }
                } else if (nodeType === 'horizontalRule') {
                  // For horizontal rules, find HR element
                  if (n.nodeType === 1 && (n as HTMLElement).tagName === 'HR') {
                    blockDom = n as HTMLElement
                  } else {
                    const hrEl = (n as HTMLElement).querySelector?.('hr')
                    if (hrEl) blockDom = hrEl as HTMLElement
                  }
                } else if (nodeType === 'table') {
                  // For tables, find the table or tableWrapper
                  if (n.nodeType === 1) {
                    const el = n as HTMLElement
                    if (el.tagName === 'TABLE' || el.classList?.contains('tableWrapper')) {
                      blockDom = el
                    } else {
                      const tableEl = el.querySelector?.('table, .tableWrapper')
                      if (tableEl) blockDom = tableEl as HTMLElement
                    }
                  }
                } else {
                  // Default: use the element node
                  if (n && n.nodeType !== 1) n = n.parentNode as Node | null
                  blockDom = n as HTMLElement | null
                }
                
                // Fallback
                if (!blockDom) {
                  if (n && n.nodeType !== 1) n = n.parentNode as Node | null
                  blockDom = n as HTMLElement | null
                }
              } catch {}

              if (blockDom) {
                dragState.sourceBlockEl = blockDom
                applyGhostEffect(blockDom)
                dragState.previewEl = createDraggedBlockPreview(blockDom, event.clientX, event.clientY)
                console.log('[DragDrop] Preview created, ghost effect applied')
              } else {
                console.warn('[DragDrop] Could not create preview - blockDom not found')
              }

              return true
            },

            dragstart: (view, event) => {
              const target = event.target as HTMLElement
              if (target.classList?.contains(handleClass)) {
                event.preventDefault()
                return true
              }
              return false
            },
          },
        },

        view(view) {
          const root = view.dom as HTMLElement
          const GUTTER_PAD = 40
          const GLYPH_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'BLOCKQUOTE'])
          const COMPLEX_TAGS = ['UL', 'OL', 'TABLE', 'PRE', 'IMG', 'HR', 'BLOCKQUOTE']

          const getFirstTextRect = (dom: HTMLElement): DOMRect | null => {
            const w = document.createTreeWalker(dom, 4, null)
            let n: Node | null
            while ((n = w.nextNode())) {
              if (!n.nodeValue || !n.nodeValue.trim()) continue
              const r = document.createRange()
              r.selectNodeContents(n)
              const rr = r.getClientRects()
              if (rr && rr.length) return rr[0] as DOMRect
            }
            return null
          }

          const shouldUseGlyph = (el: HTMLElement): boolean => {
            if (GLYPH_TAGS.has(el.tagName)) return true
            if (/^H[1-6]$/.test(el.tagName)) return true
            if (el.tagName === 'LI') {
              for (const t of COMPLEX_TAGS) if (el.querySelector(t)) return false
              return true
            }
            return false
          }

          const alignHandles = () => {
            const pRect = root.getBoundingClientRect()
            const rootStyle = window.getComputedStyle(root)
            const paddingLeft = parseFloat(rootStyle.paddingLeft) || 0
            const nodes = root.querySelectorAll(`.${handleClass}`)
            nodes.forEach((el) => {
              const btn = el as HTMLButtonElement
              let blockDom = btn.previousElementSibling as HTMLElement | null
              if (!blockDom) {
                let p: HTMLElement | null = btn.parentElement
                while (p && p !== root) {
                  const prev = p.previousElementSibling as HTMLElement | null
                  if (prev) { blockDom = prev; break }
                  p = p.parentElement
                }
              }
              if (!blockDom) return

              let actualDom = blockDom
              if (blockDom.classList.contains('tableWrapper')) {
                const innerTable = blockDom.querySelector('table')
                if (innerTable) actualDom = innerTable as HTMLElement
              }

              const boxRect = actualDom.getBoundingClientRect()
              let desiredTop = boxRect.top + 2
              const tag = actualDom.tagName
              if (tag === 'HR') {
                const cs = window.getComputedStyle(actualDom)
                const bTop = parseFloat(cs.borderTopWidth) || 0
                desiredTop = boxRect.top + bTop / 2 - btn.offsetHeight / 2
              } else if (shouldUseGlyph(actualDom)) {
                const g = getFirstTextRect(actualDom)
                if (g) {
                  desiredTop = g.top + g.height / 2 - btn.offsetHeight / 2
                }
              }
              const topInContainer = Math.max(0, desiredTop - pRect.top)
              const leftFixedInContainer = paddingLeft - GUTTER_PAD
              btn.style.top = topInContainer + 'px'
              btn.style.left = leftFixedInContainer + 'px'
            })
          }

          const ro = new ResizeObserver(() => alignHandles())
          ro.observe(root)
          requestAnimationFrame(alignHandles)

          const mo = new MutationObserver(() => alignHandles())
          mo.observe(root, { childList: true, subtree: true, attributes: true })

          window.addEventListener('scroll', alignHandles, true)

          const handleDocumentMouseMove = (e: MouseEvent) => {
            if (!dragState.dragging) return
            handleMouseMove(view, e)
          }

          const handleDocumentMouseUp = (e: MouseEvent) => {
            if (!dragState.dragging) return
            handleMouseUp(view)
          }

          document.addEventListener('mousemove', handleDocumentMouseMove)
          document.addEventListener('mouseup', handleDocumentMouseUp)

          return {
            update() {
              requestAnimationFrame(alignHandles)
            },
            destroy() {
              ro.disconnect()
              mo.disconnect()
              window.removeEventListener('scroll', alignHandles, true)
              document.removeEventListener('mousemove', handleDocumentMouseMove)
              document.removeEventListener('mouseup', handleDocumentMouseUp)
              removeIndicator()
              removePreview()
              // Clean up ghost overlay
              removeGhostOverlay()
              dragState.sourceBlockEl = null
              dragState.sourceNodeType = null
            },
          }
        },
      }),
    ]
  },
})

function buildDecorations(
  doc: PMNode,
  blockTypes: string[],
  className: string,
): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node, pos, parent) => {
    if (!isTargetBlock(node, parent || null, blockTypes)) return

    const handle = document.createElement('button')
    handle.className = className
    handle.type = 'button'
    handle.dataset.pos = String(pos)
    handle.dataset.nodeType = node.type.name
    handle.title = `拖动移动 (${node.type.name})`
    handle.innerHTML =
      '<svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor" aria-hidden="true"><circle cx="2" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/><circle cx="2" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="2" cy="14" r="1.2"/><circle cx="8" cy="14" r="1.2"/></svg>'

    const widgetPos = pos + node.nodeSize
    decorations.push(
      Decoration.widget(widgetPos, handle, {
        key: `drag-handle-${pos}`,
        raw: true,
        side: -1,
        stopEvent: false,
        ignoreSelection: true,
      }),
    )
  })

  return DecorationSet.create(doc, decorations)
}