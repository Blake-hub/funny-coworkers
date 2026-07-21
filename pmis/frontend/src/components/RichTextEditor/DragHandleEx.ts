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
      indicatorEl: HTMLElement | null
      targetPos: number | null
    } = {
      dragging: false,
      sourceFrom: -1,
      sourceTo: -1,
      indicatorEl: null,
      targetPos: null,
    }

    const removeIndicator = () => {
      if (dragState.indicatorEl?.parentNode) {
        dragState.indicatorEl.parentNode.removeChild(dragState.indicatorEl)
      }
      dragState.indicatorEl = null
    }

    const buildIndicator = () => {
      const el = document.createElement('div')
      el.className = 'tiptap-drop-indicator'
      return el
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

              const $pos = view.state.doc.resolve(pos)
              const depth = $pos.depth
              let foundFrom = -1
              let foundTo = -1
              for (let d = depth; d >= 0; d--) {
                const nd = $pos.node(d)
                const parent = d === 0 ? null : $pos.node(d - 1)
                if (isTargetBlock(nd, parent, blockTypes)) {
                  const start = $pos.before(d)
                  const end = start + nd.nodeSize
                  foundFrom = start
                  foundTo = end
                  break
                }
              }
              if (foundFrom < 0) return false

              event.preventDefault()
              event.stopPropagation()
              dragState.dragging = true
              dragState.sourceFrom = foundFrom
              dragState.sourceTo = foundTo
              return true
            },

            mousemove: (view, event) => {
              if (!dragState.dragging) return false
              const coords = { left: event.clientX, top: event.clientY }
              const dropPos = view.posAtCoords(coords)
              if (!dropPos) {
                removeIndicator()
                dragState.targetPos = null
                return true
              }

              event.preventDefault()
              const $pos = view.state.doc.resolve(dropPos.pos)

              let blockFrom = -1
              let blockTo = -1
              for (let d = $pos.depth; d >= 0; d--) {
                const nd = $pos.node(d)
                const parent = d === 0 ? null : $pos.node(d - 1)
                if (isTargetBlock(nd, parent, blockTypes)) {
                  blockFrom = $pos.before(d)
                  blockTo = $pos.after(d)
                  break
                }
              }
              if (blockFrom < 0) {
                blockFrom = dropPos.pos
                blockTo = dropPos.pos
              }

              const $block = view.state.doc.resolve(blockFrom)
              let blockDom: HTMLElement | null = null
              try {
                const desc = view.domAtPos($block.pos)
                let n: Node | null = desc.node
                if (n && n.nodeType !== 1) n = n.parentNode as Node | null
                blockDom = n as HTMLElement | null
              } catch {}

              if (!blockDom || !blockDom.getBoundingClientRect) {
                removeIndicator()
                return true
              }
              const rect = blockDom.getBoundingClientRect()
              const editorEl = view.dom as HTMLElement
              const wrapEl =
                (editorEl.closest('.editor-wrap') as HTMLElement | null) ||
                editorEl.parentElement!
              const wrapRect = wrapEl.getBoundingClientRect()
              const isAfter = event.clientY > rect.top + rect.height / 2

              if (!dragState.indicatorEl) {
                dragState.indicatorEl = buildIndicator()
                wrapEl.appendChild(dragState.indicatorEl)
              }
              const indicator = dragState.indicatorEl
              indicator.style.position = 'absolute'
              indicator.style.width = rect.width + 'px'
              indicator.style.left = rect.left - wrapRect.left + 'px'
              indicator.style.top =
                (isAfter ? rect.bottom : rect.top) - wrapRect.top - 1 + 'px'

              dragState.targetPos = isAfter ? blockTo : blockFrom
              return true
            },

            mouseup: (view) => {
              if (!dragState.dragging) return false
              const { sourceFrom, sourceTo, targetPos } = dragState
              const s = dragState.sourceFrom
              dragState.dragging = false
              dragState.sourceFrom = -1
              dragState.sourceTo = -1
              dragState.targetPos = null
              removeIndicator()

              if (s < 0 || sourceTo < 0 || targetPos == null) return true
              if (targetPos >= sourceFrom && targetPos <= sourceTo) return true

              const { state, dispatch } = view
              const tr = state.tr
              try {
                const slice = state.doc.slice(sourceFrom, sourceTo)
                let t = tr.delete(sourceFrom, sourceTo)
                const adjustedTarget = targetPos > sourceFrom ? targetPos - (sourceTo - sourceFrom) : targetPos
                t = t.insert(adjustedTarget, slice.content)
                dispatch(t.scrollIntoView())
              } catch {}
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

          return {
            update() {
              requestAnimationFrame(alignHandles)
            },
            destroy() {
              ro.disconnect()
              mo.disconnect()
              window.removeEventListener('scroll', alignHandles, true)
              removeIndicator()
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
        stopEvent: () => true,
        ignoreSelection: true,
      }),
    )
  })

  return DecorationSet.create(doc, decorations)
}