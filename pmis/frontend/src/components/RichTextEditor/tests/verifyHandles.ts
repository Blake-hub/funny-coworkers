import type { Editor } from '@tiptap/core'
// In browser DevTools Console
// window.__VERIFY_HANDLES__(window.__EDITOR__)
export type CheckStatus = 'ok' | 'warn' | 'err' | 'n/a'
export interface CheckResult {
  id: string
  label: string
  status: CheckStatus
  detail?: string
}

const NODE_TYPE_TAG_MAP: Record<string, (tagName: string, el: HTMLElement) => boolean> = {
  heading: (t) => /^h[1-6]$/i.test(t),
  paragraph: (t) => t.toLowerCase() === 'p',
  listItem: (t) => t.toLowerCase() === 'li',
  blockquote: (t) => t.toLowerCase() === 'blockquote',
  codeBlock: (t) => t.toLowerCase() === 'pre',
  table: (t, el) => t.toLowerCase() === 'table' || (t.toLowerCase() === 'div' && el.classList.contains('tableWrapper')),
  image: (t) => t.toLowerCase() === 'img',
  horizontalRule: (t) => t.toLowerCase() === 'hr',
}

const ALLOWED_NODE_TYPES = Object.keys(NODE_TYPE_TAG_MAP)

function statusOf(cond: boolean, ok = 'ok' as CheckStatus, fail = 'err' as CheckStatus): CheckStatus {
  return cond ? ok : fail
}

export function runAllChecks(
  html: string,
  editor: Editor,
): CheckResult[] {
  const results: CheckResult[] = []
  const push = (id: string, label: string, status: CheckStatus, detail?: string) =>
    results.push({ id, label, status, detail })

  const t1 = /tiptap-drag-handle|tiptap-drop-indicator/.test(html)
  push('V3-a', 'HTML 不含 .tiptap-drag-handle / drop-indicator class', t1 ? 'err' : 'ok')

  const t2 = /viewBox="0 0 10 16"|data-nodeType=/.test(html)
  push('V3-b', 'HTML 不含 拖拽 SVG 或 data-nodeType 属性', t2 ? 'err' : 'ok')

  const t3 = /data-pos=/.test(html)
  push('V3-c', 'HTML 不含 data-pos 装饰属性', t3 ? 'err' : 'ok')

  try {
    const json = editor.getJSON()
    const str = JSON.stringify(json)
    const t4 = /dragHandle|tiptap-drag-handle/.test(str)
    push('V3-d', 'JSON 文档不包含拖拽节点 / Decoration 残留', t4 ? 'err' : 'ok')
  } catch {
    push('V3-d', 'JSON 文档不包含拖拽节点 / Decoration 残留', 'warn', 'editor.getJSON() 抛错')
  }

  push('E2E-a', '文档中存在列表 (ul/ol)', /<ul|<ol/i.test(html) ? 'ok' : 'warn')
  push('E2E-b', '文档中存在表格 (table)', /<table/i.test(html) ? 'ok' : 'warn')
  push('E2E-c', '文档中存在图片 (img)', /<img/i.test(html) ? 'ok' : 'warn')

  const root = editor.view.dom as HTMLElement | null
  if (!root) {
    push('DOM-0', 'Editor view DOM 已挂载', 'err', 'editor.view.dom is null')
    return results
  }
  push('DOM-0', 'Editor view DOM 已挂载', 'ok')

  const handles = Array.from(root.querySelectorAll<HTMLElement>('.tiptap-drag-handle'))
  push('P0-a', `已渲染 ${handles.length} 个拖拽手柄`, handles.length > 0 ? 'ok' : 'warn')

  if (handles.length === 0) return results

  let pairErrors = 0
  let stacked = 0
  const byType: Record<string, number> = {}
  handles.forEach((h) => {
    const htype = h.dataset.nodeType ?? '?'
    byType[htype] = (byType[htype] || 0) + 1
    const prev = h.previousElementSibling as HTMLElement | null
    if (prev && prev.classList && prev.classList.contains('tiptap-drag-handle')) {
      stacked++
    }
    if (!ALLOWED_NODE_TYPES.includes(htype)) {
      pairErrors++
      return
    }
    const tagName = prev ? prev.tagName : '__NULL__'
    const match = NODE_TYPE_TAG_MAP[htype]
    if (!match || !prev || !match(tagName, prev)) pairErrors++
  })
  push('P2-b', `handle.data-nodeType 与其 previousElementSibling 标签 100% 匹配 (${handles.length - pairErrors}/${handles.length})`, statusOf(pairErrors === 0), `mismatch=${pairErrors}`)
  push('P2-c', '手柄之间不堆叠 (previous sibling 绝不是另一个手柄)', statusOf(stacked === 0), `stacked=${stacked}`)

  const lis = root.querySelectorAll('li').length
  const lisH = byType.listItem ?? 0
  push('P2-a', `listItem 手柄数 (${lisH}) ≤ 实际 <li> 数 (${lis})`, statusOf(lis === 0 || lisH <= lis))

  const tables = root.querySelectorAll('table').length
  const tablesH = byType.table ?? 0
  push('P2-e', `table 手柄数 (${tablesH}) = 实际 <table> 数 (${tables})`, statusOf(tablesH === tables))

  const imgs = root.querySelectorAll('img').length
  const imgsH = byType.image ?? 0
  push('P2-f', `image 手柄数 (${imgsH}) = 实际 <img> 数 (${imgs})`, statusOf(imgsH === imgs))

  const hrs = root.querySelectorAll('hr').length
  const hrsH = byType.horizontalRule ?? 0
  push('P2-g', `hr 手柄数 (${hrsH}) = 实际 <hr> 数 (${hrs})`, statusOf(hrsH === hrs))

  const bqs = root.querySelectorAll('blockquote').length
  const bqsH = byType.blockquote ?? 0
  push('P2-h', `blockquote 手柄数 (${bqsH}) = 实际 <blockquote> 数 (${bqs})`, statusOf(bqsH === bqs))

  const headings = root.querySelectorAll('h1,h2,h3,h4,h5,h6').length
  const headH = byType.heading ?? 0
  push('P2-i', `heading 手柄数 (${headH}) = 实际 H1..H6 数 (${headings})`, statusOf(headH === headings))

  const pres = root.querySelectorAll('pre').length
  const presH = byType.codeBlock ?? 0
  push('P2-j', `codeBlock 手柄数 (${presH}) = 实际 <pre> 数 (${pres})`, statusOf(presH === pres))

  const uniqLefts = Array.from(new Set(handles.map((h) => Math.round(h.getBoundingClientRect().left))))
  push('P1-b', `手柄全部左对齐成一条竖线 (unique lefts=${uniqLefts.length})`, statusOf(uniqLefts.length === 1), `leftValues=[${uniqLefts.join(', ')}]`)

  const TEXT_TAGS = new Set(['P', 'BLOCKQUOTE'])
  const COMPLEX_P1 = ['UL', 'OL', 'TABLE', 'PRE', 'IMG', 'BLOCKQUOTE']
  const firstTextRectP1 = (dom: HTMLElement): DOMRect | null => {
    const w = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT, null)
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
  type AlignMode = 'center' | 'hrLine' | 'boxTop2'
  const getMode = (el: HTMLElement): AlignMode => {
    if (el.tagName === 'HR') return 'hrLine'
    if (/^H[1-6]$/.test(el.tagName)) return 'center'
    if (TEXT_TAGS.has(el.tagName)) return 'center'
    if (el.tagName === 'LI') {
      for (const t of COMPLEX_P1) if (el.querySelector(t)) return 'boxTop2'
      return 'center'
    }
    return 'boxTop2'
  }
  let topErr = 0
  let worst = 0
  let topChecked = 0
  handles.forEach((h) => {
    const prev = h.previousElementSibling as HTMLElement | null
    if (!prev) return
    topChecked++
    const mode = getMode(prev)
    const box = prev.getBoundingClientRect()
    let expected = box.top + 2
    if (mode === 'hrLine') {
      const bTop = parseFloat(window.getComputedStyle(prev).borderTopWidth) || 0
      expected = box.top + bTop / 2 - h.offsetHeight / 2
    } else if (mode === 'center') {
      const g = firstTextRectP1(prev)
      if (g) expected = g.top + g.height / 2 - h.offsetHeight / 2
    }
    const err = Math.abs(h.getBoundingClientRect().top - expected)
    if (err > 0.8) topErr++
    if (err > worst) worst = err
  })
  push('P1-a', `手柄顶对齐（文本/HR 中心 / 块类盒+2）异常 ${topErr}/${topChecked}`, statusOf(topErr === 0), `worstOffBy=${worst.toFixed(2)}px`)

  const pe = window.getComputedStyle(handles[0]).pointerEvents
  push('P3-a', `手柄基础 pointer-events 为 auto（当前 '${pe}'）`, statusOf(pe === 'auto'))

  const w = Math.round(handles[0].getBoundingClientRect().width)
  push('P3-b', `手柄宽度 === 40px（消除 8px 悬停死区）（当前 ${w}px）`, statusOf(w === 40))

  const firstContent =
    root.querySelector('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, table, img, hr') as HTMLElement | null
  if (firstContent) {
    const hRight = Math.round(handles[0].getBoundingClientRect().right)
    const cLeft = Math.round(firstContent.getBoundingClientRect().left)
    const gap = Math.abs(hRight - cLeft)
    push('P3-c', `手柄右边缘 与 正文首元素左边缘 贴合无缝（|hRight - cLeft| ≤ 1px，当前 ${gap}）`, statusOf(gap <= 1), `hRight=${hRight}, cLeft=${cLeft}`)
  } else {
    push('P3-c', '手柄右边缘 与 正文首元素左边缘 贴合无缝', 'warn', '正文没有可对比的首元素')
  }

  const styleHits = Array.from(document.styleSheets).reduce((acc, s) => {
    try {
      const rules = (s as CSSStyleSheet).cssRules || []
      for (let i = 0; i < rules.length; i++) {
        const r = rules[i] as CSSStyleRule
        if (!r.selectorText || !/opacity.*!important/.test(r.cssText)) continue
        const selectors = r.selectorText.split(',').map((x) => x.trim())
        selectors.forEach((sel) => {
          if (/^\.tiptap-drag-handle:(hover|active)$/.test(sel)) acc++
        })
      }
      return acc
    } catch {
      return acc
    }
  }, 0)
  push('P3-d', `.handle:hover/active 有 opacity:1 !important 兜底（命中 ${styleHits}/2 条伪类）`, statusOf(styleHits >= 2), `rules=${styleHits}`)

  let headingBad = 0
  let headingWorst = 0
  let headingN = 0
  const firstRect = (dom: HTMLElement): DOMRect | null => {
    const w = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT, null)
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
  handles.forEach((h) => {
    const prev = h.previousElementSibling as HTMLElement | null
    if (!prev || !/^H[1-6]$/.test(prev.tagName)) return
    headingN++
    const g = firstRect(prev)
    if (!g) { headingBad++; return }
    const expected = g.top + g.height / 2 - h.offsetHeight / 2
    const err = Math.abs(h.getBoundingClientRect().top - expected)
    if (err > 0.8) headingBad++
    if (err > headingWorst) headingWorst = err
  })
  push('REG-a', `🔖 H系列手柄＝字形中心（heading 回归）异常 ${headingBad}/${headingN}`, headingN === 0 ? 'warn' : statusOf(headingBad === 0), `worstOffBy=${headingWorst.toFixed(2)}px`)

  let pBad = 0, pWorst = 0, pN = 0
  handles.forEach((h) => {
    const prev = h.previousElementSibling as HTMLElement | null
    if (!prev || prev.tagName !== 'P') return
    pN++
    const g = firstRect(prev)
    if (!g) { pBad++; return }
    const expected = g.top + g.height / 2 - h.offsetHeight / 2
    const err = Math.abs(h.getBoundingClientRect().top - expected)
    if (err > 0.8) pBad++
    if (err > pWorst) pWorst = err
  })
  push('REG-b', `🔖 P手柄＝字形中心（段落回归）异常 ${pBad}/${pN}`, pN === 0 ? 'warn' : statusOf(pBad === 0), `worstOffBy=${pWorst.toFixed(2)}px`)

  let hrBad = 0, hrWorst = 0, hrN = 0
  handles.forEach((h) => {
    const prev = h.previousElementSibling as HTMLElement | null
    if (!prev || prev.tagName !== 'HR') return
    hrN++
    const cs = window.getComputedStyle(prev)
    const bTop = parseFloat(cs.borderTopWidth) || 0
    const box = prev.getBoundingClientRect()
    const expected = box.top + bTop / 2 - h.offsetHeight / 2
    const err = Math.abs(h.getBoundingClientRect().top - expected)
    if (err > 0.8) hrBad++
    if (err > hrWorst) hrWorst = err
  })
  push('REG-c', `🔖 HR手柄＝虚线中心（水平分割线回归）异常 ${hrBad}/${hrN}`, hrN === 0 ? 'warn' : statusOf(hrBad === 0), `worstOffBy=${hrWorst.toFixed(2)}px`)

  let adjRule = 0
  Array.from(document.styleSheets).forEach((s) => {
    try {
      const rules = (s as CSSStyleSheet).cssRules || []
      for (let i = 0; i < rules.length; i++) {
        const r = rules[i] as CSSStyleRule
        if (!r.selectorText) continue
        const parts = r.selectorText.split(',').map((x) => x.trim())
        parts.forEach((sel) => {
          if (/:hover\s*\+\s*\.tiptap-drag-handle$/.test(sel) && /opacity\s*:\s*1/.test(r.cssText)) adjRule++
        })
      }
    } catch { /* ignore cross-origin */ }
  })
  push('REG-d', `🔖 防闪烁 CSS：存在 .ProseMirror *:hover + .handle opacity:1（命中 ${adjRule}）`, statusOf(adjRule >= 1), `hits=${adjRule}`)

  let dirBad = 0
  handles.forEach((h, idx) => {
    const prev = h.previousElementSibling as HTMLElement | null
    if (!prev) { dirBad++; return }
    if (prev.classList && prev.classList.contains('tiptap-drag-handle')) { dirBad++; return }
    if (prev.nextElementSibling !== h) dirBad++
    if (idx === 0) return
    const handleTag = h.dataset.nodeType ? NODE_TYPE_TAG_MAP[h.dataset.nodeType] : null
    if (handleTag && handleTag(prev.tagName, prev!) === false) return
  })
  push('REG-e', `🔖 方向正确：所有手柄都是对应块的 nextSibling（side=-1）异常 ${dirBad}/${handles.length}`, statusOf(dirBad === 0), `misplaced=${dirBad}`)

  let tdHandles = 0
  handles.forEach((h) => {
    let p: HTMLElement | null = h.parentElement
    while (p && p !== root) {
      if (p.tagName === 'TD' || p.tagName === 'TH') { tdHandles++; break }
      p = p.parentElement
    }
  })
  push('REG-f', `🔖 无手柄出现在 td/th 内部（防表格每格多手柄）当前 ${tdHandles} 个`, statusOf(tdHandles === 0), `handlesInsideCell=${tdHandles}`)

  return results
}

export function runChecksInBrowser(editor: any): { results: CheckResult[]; ok: number; err: number; warn: number } {
  const html = editor.getHTML()
  const results = runAllChecks(html, editor)
  const ok = results.filter((r) => r.status === 'ok').length
  const err = results.filter((r) => r.status === 'err').length
  const warn = results.filter((r) => r.status === 'warn').length
  
  console.log('=== Drag Handle Verification Results ===')
  console.log(`Total: ${results.length} | OK: ${ok} | ERR: ${err} | WARN: ${warn}`)
  console.log('----------------------------------------')
  
  CHECK_DISPLAY_ORDER.forEach(({ id, group }) => {
    const result = results.find((r) => r.id === id)
    if (result) {
      const statusIcon = result.status === 'ok' ? '✅' : result.status === 'err' ? '❌' : '⚠️'
      console.log(`${statusIcon} [${group}] ${result.id}: ${result.label}` + (result.detail ? ` (${result.detail})` : ''))
    }
  })
  
  console.log('----------------------------------------')
  if (err > 0) {
    console.error(`❌ FAILED: ${err} test(s) failed`)
  } else {
    console.log('✅ ALL TESTS PASSED!')
  }
  
  return { results, ok, err, warn }
}

export const CHECK_DISPLAY_ORDER: Array<{ id: string; group: string }> = [
  { id: 'V3-a', group: '干净性' },
  { id: 'V3-b', group: '干净性' },
  { id: 'V3-c', group: '干净性' },
  { id: 'V3-d', group: '干净性' },
  { id: 'E2E-a', group: '元素覆盖' },
  { id: 'E2E-b', group: '元素覆盖' },
  { id: 'E2E-c', group: '元素覆盖' },
  { id: 'P0-a', group: 'DOM 渲染' },
  { id: 'P2-b', group: 'DOM 渲染' },
  { id: 'P2-c', group: 'DOM 渲染' },
  { id: 'P2-a', group: 'DOM 渲染' },
  { id: 'P2-e', group: 'DOM 渲染' },
  { id: 'P2-f', group: 'DOM 渲染' },
  { id: 'P2-g', group: 'DOM 渲染' },
  { id: 'P2-h', group: 'DOM 渲染' },
  { id: 'P2-i', group: 'DOM 渲染' },
  { id: 'P2-j', group: 'DOM 渲染' },
  { id: 'REG-e', group: 'DOM 渲染' },
  { id: 'REG-f', group: 'DOM 渲染' },
  { id: 'P1-a', group: '位置对齐' },
  { id: 'P1-b', group: '位置对齐' },
  { id: 'REG-a', group: '位置对齐' },
  { id: 'REG-b', group: '位置对齐' },
  { id: 'REG-c', group: '位置对齐' },
  { id: 'P3-a', group: 'Hover 稳定性' },
  { id: 'P3-b', group: 'Hover 稳定性' },
  { id: 'P3-c', group: 'Hover 稳定性' },
  { id: 'P3-d', group: 'Hover 稳定性' },
  { id: 'REG-d', group: 'Hover 稳定性' },
]