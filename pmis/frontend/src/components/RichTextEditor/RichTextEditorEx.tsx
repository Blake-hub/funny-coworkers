'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { common, createLowlight } from 'lowlight';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Link } from '@tiptap/extension-link';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';

import { DragHandleEx } from './DragHandleEx';
import { runChecksInBrowser } from './tests/verifyHandles';

import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Type, Link2, ImageIcon, FileText,
  Undo, Redo, Highlighter, Table, ChevronDown,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, Eye, EyeOff,
} from 'lucide-react';

interface SlashMenuItem {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  action: () => void;
}

interface SlashCommandOptions {
  onOpen?: (position: { left: number; top: number }, editor: any) => void;
  onClose?: () => void;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      onOpen: () => {},
      onClose: () => {},
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('slashCommand'),

        props: {
          handleKeyDown: (view, event) => {
            if (event.key === '/') {
              const { state } = view;
              const { selection } = state;

              if (!selection.empty) return false;

              const $from = selection.$from;
              if (state.schema.marks.code?.isInSet(state.storedMarks || $from.marks())) {
                return false;
              }

              const pos = $from.pos;
              const isAtBlockStart = $from.parentOffset === 0;
              const charBefore = pos > 0 ? state.doc.textBetween(pos - 1, pos, '') : '';

              if (isAtBlockStart || charBefore === ' ' || charBefore === '' || charBefore === '\n') {
                event.preventDefault();

                const coords = view.coordsAtPos(pos);
                const menuWidth = 256;
                const menuHeight = 400;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const safeMargin = 32;

                let menuX = coords.left;
                let menuY = coords.bottom;

                if (menuX + menuWidth > viewportWidth - safeMargin) {
                  menuX = viewportWidth - menuWidth - safeMargin;
                }
                if (menuX < safeMargin) {
                  menuX = safeMargin;
                }

                const spaceBelow = viewportHeight - coords.bottom - safeMargin;
                if (spaceBelow < menuHeight) {
                  const spaceAbove = coords.top - safeMargin;
                  if (spaceAbove > menuHeight) {
                    menuY = coords.top - menuHeight;
                  } else if (spaceAbove > 0) {
                    menuY = safeMargin;
                  } else {
                    menuY = Math.max(safeMargin, viewportHeight - menuHeight - safeMargin);
                  }
                }

                if (menuY < safeMargin) {
                  menuY = safeMargin;
                }

                this.options.onOpen?.({ left: menuX, top: menuY }, view);
                return true;
              }
            }

            if (event.key === 'Escape') {
              this.options.onClose?.();
            }

            return false;
          },
        },
      }),
    ];
  },
});

const lowlight = createLowlight(common);

const SAMPLE_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 280"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><rect width="600" height="280" fill="url(#g)" rx="16"/><g fill="#fff" font-family="Segoe UI,Arial" font-weight="700" text-anchor="middle"><text x="300" y="140" font-size="40">Sample Image</text><text x="300" y="180" font-size="20" opacity="0.8">600 x 280</text></g></svg>`,
  );

const INITIAL_HTML = `
<h1>欢迎使用 Tiptap 拖拽手柄 Demo（方案 A：Decoration）</h1>
<p>鼠标<strong>移动到任意块级元素上方</strong>，左外侧就会出现 ⋮⋮ 拖拽手柄。请尝试如下操作：</p>
<ul>
  <li>移动鼠标到这段文字上方 → 出现 listItem 级手柄（每 li 一个，内部的 p 不会额外出现）</li>
  <li>按住手柄上下拖动 → 拖动过程中显示蓝色插入指示线，松开后重排</li>
  <li>鼠标在内容块和手柄之间来回移动 → 手柄不会闪烁（相邻兄弟 hover 驱动）</li>
</ul>
<h2>各类元素覆盖测试</h2>
<h3>引用块</h3>
<blockquote>
  <p>这是一段引用。Hover 引用区域，整块只出现一个手柄。内部段落不会出现重复手柄。</p>
</blockquote>
<h3>代码块</h3>
<pre><code class="language-typescript">function greet(name: string) {
  return \`Hello, \${name}!\`;
}
console.log(greet('Tiptap'));</code></pre>
<h3>有序列表</h3>
<ol>
  <li>第一步：想好要写什么</li>
  <li>第二步：拿起手柄拖动</li>
  <li>第三步：看到蓝色指示线就松手</li>
</ol>
<h3>表格</h3>
<table>
  <thead>
    <tr><th>元素类型</th><th>应出现手柄数量</th><th>说明</th></tr>
  </thead>
  <tbody>
    <tr><td>table</td><td>1 个（整表）</td><td>td/th 不出现</td></tr>
    <tr><td>listItem</td><td>每 li 1 个</td><td>li 内 p 不出现</td></tr>
    <tr><td>img</td><td>1 个（图片顶部对齐）</td><td>不跟随 inline baseline</td></tr>
  </tbody>
</table>
<h3>图片</h3>
<p>下面是一张图片，hover 其上下左右任意位置都应显示手柄：</p>
<img src="${SAMPLE_IMAGE}" alt="示例图片" />
<p>图片上方和下方段落的手柄，分别对齐各自段落顶部。</p>
<h3>水平分隔线</h3>
<hr />
<p>分隔线以上和以下各有一个段落，hover 时各自出现独立的手柄。</p>
`;

interface RichTextEditorExProps {
  value?: string;
  onChange?: (content: string, json: string) => void;
  onReady?: (editor: unknown) => void;
  uploadImage?: (file: File) => Promise<string>;
  dataTestid?: string;
  placeholder?: string;
}

function RichTextEditorEx({
  value,
  onChange,
  onReady,
  uploadImage,
  dataTestid,
  placeholder,
}: RichTextEditorExProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ left: 0, top: 0 });
  const [slashMenuItems, setSlashMenuItems] = useState<SlashMenuItem[]>([]);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState('');

  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);
  const [headingDropdownPosition, setHeadingDropdownPosition] = useState({ left: 0, top: 0 });
  const headingDropdownRef = useRef<HTMLDivElement>(null);
  const headingTriggerRef = useRef<HTMLButtonElement>(null);

  const [alignDropdownOpen, setAlignDropdownOpen] = useState(false);
  const [alignDropdownPosition, setAlignDropdownPosition] = useState({ left: 0, top: 0 });
  const alignDropdownRef = useRef<HTMLDivElement>(null);
  const alignTriggerRef = useRef<HTMLButtonElement>(null);

  const [codeLangDropdownOpen, setCodeLangDropdownOpen] = useState(false);
  const [codeLangDropdownPosition, setCodeLangDropdownPosition] = useState({ top: 0, right: 0 });
  const [codeLangMenuPosition, setCodeLangMenuPosition] = useState({ left: 0, top: 0 });
  const [isCursorInCodeBlock, setIsCursorInCodeBlock] = useState(false);
  const codeLangDropdownRef = useRef<HTMLDivElement>(null);
  const codeLangTriggerRef = useRef<HTMLButtonElement>(null);

  const showSlashMenuRef = useRef(false);
  useEffect(() => {
    showSlashMenuRef.current = showSlashMenu;
  }, [showSlashMenu]);

  const selectedSlashIndexRef = useRef(0);
  useEffect(() => { selectedSlashIndexRef.current = selectedSlashIndex; }, [selectedSlashIndex]);

  const slashMenuItemsRef = useRef<SlashMenuItem[]>([]);
  useEffect(() => { slashMenuItemsRef.current = slashMenuItems; }, [slashMenuItems]);

  const slashQueryRef = useRef('');
  useEffect(() => { slashQueryRef.current = slashQuery; }, [slashQuery]);

  const slashMenuRef = useRef<HTMLDivElement>(null);

  const closeSlashMenu = useCallback(() => {
    setShowSlashMenu(false);
    showSlashMenuRef.current = false;
    setSlashQuery('');
    setSelectedSlashIndex(0);
  }, []);

  const getAllSlashMenuItems = (): SlashMenuItem[] => [
    { icon: Heading1, label: 'Heading 1', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleHeading({ level: 1 }).run(); } },
    { icon: Heading2, label: 'Heading 2', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleHeading({ level: 2 }).run(); } },
    { icon: Heading3, label: 'Heading 3', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleHeading({ level: 3 }).run(); } },
    { icon: Heading4, label: 'Heading 4', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleHeading({ level: 4 }).run(); } },
    { icon: Heading5, label: 'Heading 5', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleHeading({ level: 5 }).run(); } },
    { icon: Heading6, label: 'Heading 6', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleHeading({ level: 6 }).run(); } },
    { icon: Bold, label: 'Bold', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleBold().run(); } },
    { icon: Italic, label: 'Italic', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleItalic().run(); } },
    { icon: Strikethrough, label: 'Strikethrough', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleStrike().run(); } },
    { icon: List, label: 'Unordered List', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleBulletList().run(); } },
    { icon: ListOrdered, label: 'Ordered List', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleOrderedList().run(); } },
    { icon: Quote, label: 'Quote', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleBlockquote().run(); } },
    { icon: Code, label: 'Inline Code', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleCode().run(); } },
    { icon: Type, label: 'Code Block', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().toggleCodeBlock().run(); } },
    { icon: Table, label: 'Table', action: () => insertTableRef.current() },
    { icon: Minus, label: 'Horizontal Rule', action: () => { const e = (window as any).__EDITOR__; e?.chain().focus().setHorizontalRule().run(); } },
  ];

  const insertTableRef = useRef<() => void>(() => {});
  const editorRef = useRef<any>(null);

  const languageOptions = [
    { lang: '', label: 'Plain Text' },
    { lang: 'javascript', label: 'JavaScript' },
    { lang: 'typescript', label: 'TypeScript' },
    { lang: 'python', label: 'Python' },
    { lang: 'java', label: 'Java' },
    { lang: 'cpp', label: 'C++' },
    { lang: 'c', label: 'C' },
    { lang: 'csharp', label: 'C#' },
    { lang: 'go', label: 'Go' },
    { lang: 'ruby', label: 'Ruby' },
    { lang: 'php', label: 'PHP' },
    { lang: 'html', label: 'HTML' },
    { lang: 'css', label: 'CSS' },
    { lang: 'json', label: 'JSON' },
    { lang: 'sql', label: 'SQL' },
    { lang: 'bash', label: 'Bash' },
    { lang: 'markdown', label: 'Markdown' },
  ];

  const getCurrentCodeLanguage = () => {
    if (!editor) return languageOptions[0];
    const language = editor.getAttributes('codeBlock').language;
    return languageOptions.find(opt => opt.lang === language) || languageOptions[0];
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, link: false }),
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      DragHandleEx.configure({
        blockTypes: ['paragraph', 'heading', 'blockquote', 'codeBlock', 'listItem', 'table', 'horizontalRule', 'image'],
        handleClass: 'tiptap-drag-handle',
      }),
      SlashCommand.configure({
        onOpen: (position) => {
          const items = getAllSlashMenuItems();
          setSlashMenuPosition(position);
          setSlashMenuItems(items);
          slashMenuItemsRef.current = items;
          setSlashQuery('');
          setSelectedSlashIndex(0);
          setShowSlashMenu(true);
          showSlashMenuRef.current = true;
        },
        onClose: closeSlashMenu,
      }),
    ],
    content: typeof value === 'string' && value.trim() !== '' ? value : INITIAL_HTML,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) onChange(editor.getHTML() as string, JSON.stringify(editor.getJSON()));
    },
    onCreate: ({ editor }) => {
      if (onReady) onReady(editor);
      const w = window as unknown as {
        __EDITOR__?: unknown;
        __VERIFY_HANDLES__?: (editor: unknown) => void;
        __TEST_SLASH_ACTION__?: (index: number) => void;
      };
      w.__EDITOR__ = editor;
      w.__VERIFY_HANDLES__ = runChecksInBrowser;
      w.__TEST_SLASH_ACTION__ = (index: number) => {
        const items = slashMenuItemsRef.current;
        if (items[index]) {
          console.log('Testing action:', items[index].label);
          items[index].action();
        }
      };
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (!showSlashMenuRef.current) return false;

        const items = slashMenuItemsRef.current;
        const maxIndex = items.length - 1;

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          event.stopPropagation();
          setSelectedSlashIndex((prev) => Math.min(prev + 1, maxIndex));
          return true;
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          event.stopPropagation();
          setSelectedSlashIndex((prev) => Math.max(prev - 1, 0));
          return true;
        } else if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          console.log('Enter pressed, items length:', items.length, 'selected index:', selectedSlashIndexRef.current);
          const item = items[selectedSlashIndexRef.current];
          if (item) {
            console.log('Executing action:', item.label);
            item.action();
          } else {
            console.log('No item found at index:', selectedSlashIndexRef.current);
          }
          closeSlashMenu();
          return true;
        } else if (event.key === 'Backspace') {
          event.preventDefault();
          event.stopPropagation();
          const newQuery = slashQueryRef.current.slice(0, -1);
          setSlashQuery(newQuery);
          const allItems = getAllSlashMenuItems();
          const filtered = allItems.filter(item =>
            item.label.toLowerCase().includes(newQuery.toLowerCase())
          );
          setSlashMenuItems(filtered);
          slashMenuItemsRef.current = filtered;
          setSelectedSlashIndex(0);
          return true;
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          event.stopPropagation();
          const newQuery = slashQueryRef.current + event.key;
          setSlashQuery(newQuery);
          slashQueryRef.current = newQuery;
          const allItems = getAllSlashMenuItems();
          const filtered = allItems.filter(item =>
            item.label.toLowerCase().includes(newQuery.toLowerCase())
          );
          setSlashMenuItems(filtered);
          slashMenuItemsRef.current = filtered;
          setSelectedSlashIndex(0);
          return true;
        }

        return false;
      },
    },
  });

  const insertTable = useCallback(() => {
    if (!editor) return;
    const { state, view } = editor;
    const { schema } = state;
    const table = schema.nodes.table;
    const tableRow = schema.nodes.tableRow;
    const tableHeader = schema.nodes.tableHeader;
    const tableCell = schema.nodes.tableCell;
    const paragraph = schema.nodes.paragraph;

    const headerRow = tableRow.create(null, [
      tableHeader.create(null, paragraph.create(null)),
      tableHeader.create(null, paragraph.create(null)),
      tableHeader.create(null, paragraph.create(null)),
    ]);

    const bodyRow = tableRow.create(null, [
      tableCell.create(null, paragraph.create(null)),
      tableCell.create(null, paragraph.create(null)),
      tableCell.create(null, paragraph.create(null)),
    ]);

    const tableContent = table.create(null, [headerRow, bodyRow, bodyRow]);
    const transaction = state.tr.insert(state.selection.from, tableContent);
    view.dispatch(transaction);
  }, [editor]);

  useEffect(() => {
    insertTableRef.current = insertTable;
  }, [insertTable]);

  useEffect(() => {
    editorRef.current = editor;
    if (editor) {
      (window as any).__EDITOR__ = editor;
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const updatePosition = () => {
      const codeBlocks = document.querySelectorAll('.tiptap-editor pre') as NodeListOf<HTMLElement>;
      let activeCodeBlock: HTMLElement | null = null;
      let isCursorInCode = false;

      for (const codeBlock of codeBlocks) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (codeBlock.contains(range.commonAncestorContainer)) {
            activeCodeBlock = codeBlock;
            isCursorInCode = true;
            break;
          }
        }
      }

      setIsCursorInCodeBlock(isCursorInCode);

      if (activeCodeBlock && isCursorInCode) {
        const rect = activeCodeBlock.getBoundingClientRect();

        setCodeLangDropdownPosition({
          top: rect.top - 2,
          right: window.innerWidth - rect.right - 2
        });
      }
    };

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    const handleSelectionChange = () => {
      setTimeout(updatePosition, 10);
    };
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (codeLangDropdownRef.current && !codeLangDropdownRef.current.contains(event.target as Node)) {
        setCodeLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCodeLangOpen = () => {
    if (codeLangTriggerRef.current) {
      const rect = codeLangTriggerRef.current.getBoundingClientRect();
      setCodeLangMenuPosition({
        left: rect.left,
        top: rect.bottom + 4,
      });
    }
    setCodeLangDropdownOpen(true);
  };

  const handleCodeLangSelect = (lang: string) => {
    editor.chain().focus().setCodeBlock({ language: lang }).run();
    setCodeLangDropdownOpen(false);
  };

  const handleImageUpload = useCallback(() => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (uploadImage) {
        uploadImage(file).then((url) => {
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        });
      }
    };
    input.click();
  }, [editor, uploadImage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(event.target as Node)) {
        setShowSlashMenu(false);
      }
      if (headingDropdownRef.current && !headingDropdownRef.current.contains(event.target as Node)) {
        setHeadingDropdownOpen(false);
      }
      if (alignDropdownRef.current && !alignDropdownRef.current.contains(event.target as Node)) {
        setAlignDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const headingOptions = [
    { level: 1, icon: Heading1, label: 'H1' },
    { level: 2, icon: Heading2, label: 'H2' },
    { level: 3, icon: Heading3, label: 'H3' },
    { level: 4, icon: Heading4, label: 'H4' },
    { level: 5, icon: Heading5, label: 'H5' },
    { level: 6, icon: Heading6, label: 'H6' },
  ];

  const alignmentOptions = [
    { align: 'left', icon: AlignLeft, label: 'Left' },
    { align: 'center', icon: AlignCenter, label: 'Center' },
    { align: 'right', icon: AlignRight, label: 'Right' },
    { align: 'justify', icon: AlignJustify, label: 'Justify' },
  ];

  const handleHeadingOpen = () => {
    if (headingTriggerRef.current) {
      const rect = headingTriggerRef.current.getBoundingClientRect();
      const parentRect = headingTriggerRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setHeadingDropdownPosition({ left: rect.left - parentRect.left, top: rect.bottom - parentRect.top + 4 });
      } else {
        setHeadingDropdownPosition({ left: 0, top: rect.height + 4 });
      }
    }
    setHeadingDropdownOpen(true);
  };

  const handleAlignOpen = () => {
    if (alignTriggerRef.current) {
      const rect = alignTriggerRef.current.getBoundingClientRect();
      const parentRect = alignTriggerRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setAlignDropdownPosition({ left: rect.left - parentRect.left, top: rect.bottom - parentRect.top + 4 });
      } else {
        setAlignDropdownPosition({ left: 0, top: rect.height + 4 });
      }
    }
    setAlignDropdownOpen(true);
  };

  const testSlashMenu = () => {
    const view = editor.view;
    const { state } = view;
    const { selection } = state;
    const $from = selection.$from;
    const pos = $from.pos;
    const coords = view.coordsAtPos(pos);

    const menuWidth = 256;
    const menuHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeMargin = 32;

    let menuX = coords.left;
    let menuY = coords.bottom;

    if (menuX + menuWidth > viewportWidth - safeMargin) {
      menuX = viewportWidth - menuWidth - safeMargin;
    }
    if (menuX < safeMargin) {
      menuX = safeMargin;
    }

    const spaceBelow = viewportHeight - coords.bottom - safeMargin;
    if (spaceBelow < menuHeight) {
      const spaceAbove = coords.top - safeMargin;
      if (spaceAbove > menuHeight) {
        menuY = coords.top - menuHeight;
      } else if (spaceAbove > 0) {
        menuY = safeMargin;
      } else {
        menuY = Math.max(safeMargin, viewportHeight - menuHeight - safeMargin);
      }
    }

    if (menuY < safeMargin) {
      menuY = safeMargin;
    }

    setSlashMenuPosition({ left: menuX, top: menuY });
    setSlashMenuItems(getAllSlashMenuItems());
    setSlashQuery('');
    setSelectedSlashIndex(0);
    setShowSlashMenu(true);
  };

  return (
    <div className="relative w-full">
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-1">
            <button
              onClick={testSlashMenu}
              className="p-2 rounded hover:bg-gray-200 transition-colors"
              title="Test Slash Menu"
            >
              /
            </button>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('underline') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Underline"
          >
            <Underline size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <button
            ref={headingTriggerRef}
            onClick={handleHeadingOpen}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Heading"
          >
            <Heading1 size={16} />
            <ChevronDown size={14} />
          </button>
          {headingDropdownOpen && (
            <div
              ref={headingDropdownRef}
              className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50"
              style={{ left: headingDropdownPosition.left, top: headingDropdownPosition.top }}
            >
              {headingOptions.map((option) => (
                <button
                  key={option.level}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: option.level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                    setHeadingDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Quote"
          >
            <Quote size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('code') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Code"
          >
            <Code size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('codeBlock') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Code Block"
          >
            <Type size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('highlight') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Highlight"
          >
            <Highlighter size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <button
            ref={alignTriggerRef}
            onClick={handleAlignOpen}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Align"
          >
            <AlignLeft size={16} />
            <ChevronDown size={14} />
          </button>
          {alignDropdownOpen && (
            <div
              ref={alignDropdownRef}
              className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50"
              style={{ left: alignDropdownPosition.left, top: alignDropdownPosition.top }}
            >
              {alignmentOptions.map((option) => (
                <button
                  key={option.align}
                  onClick={() => {
                    editor.chain().focus().setTextAlign(option.align).run();
                    setAlignDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    <option.icon size={16} />
                  </span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().setLink({ href: '' }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('link') ? 'bg-gray-200 text-blue-600' : ''}`}
            title="Link"
          >
            <Link2 size={18} />
          </button>
          <button
            onClick={insertTable}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Table"
          >
            <Table size={18} />
          </button>
          <button
            onClick={handleImageUpload}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Image"
          >
            <ImageIcon size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Horizontal Rule"
          >
            <Minus size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => setShowToolbar(!showToolbar)}
          className="p-2 rounded hover:bg-gray-200 transition-colors ml-auto"
          title="Hide Toolbar"
        >
          <EyeOff size={18} />
        </button>
      </div>
      )}

      {!showToolbar && (
        <button
          onClick={() => setShowToolbar(!showToolbar)}
          className="absolute top-2 right-2 p-2 rounded hover:bg-gray-200 transition-colors z-10 bg-white border border-gray-200"
          title="Show Toolbar"
        >
          <Eye size={18} />
        </button>
      )}

      <div className="flex-1 overflow-y-auto bg-white">
        <div className="tiptap-editor">
          <EditorContent
            editor={editor}
            data-testid={dataTestid}
            className="editor-content"
          />
        </div>
      </div>

      {isCursorInCodeBlock && (
        <div
          className="code-block-language-dropdown"
          style={{
            position: 'fixed',
            top: `${codeLangDropdownPosition.top}px`,
            right: `${codeLangDropdownPosition.right}px`,
            zIndex: 100
          }}
        >
          <div ref={codeLangDropdownRef} className="toolbar-dropdown">
            <button
              ref={codeLangTriggerRef}
              onClick={handleCodeLangOpen}
              className="toolbar-dropdown-trigger"
              title="Select Language"
            >
              <span className="text-xs font-medium">{getCurrentCodeLanguage().label}</span>
            </button>
            {codeLangDropdownOpen && (
              <div
                className="toolbar-dropdown-menu"
                style={{ left: `${codeLangMenuPosition.left}px`, top: `${codeLangMenuPosition.top}px` }}
              >
                {languageOptions.map((option) => (
                  <button
                    key={option.lang}
                    className={`toolbar-dropdown-item ${getCurrentCodeLanguage().lang === option.lang ? 'active' : ''}`}
                    onClick={() => handleCodeLangSelect(option.lang)}
                    title={option.label}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSlashMenu && (
        <div
          ref={slashMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 min-w-[240px] max-h-[400px] flex flex-col"
          style={{ left: slashMenuPosition.left, top: slashMenuPosition.top }}
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <input
              type="text"
              value={slashQuery}
              onChange={(e) => {
                const query = e.target.value;
                setSlashQuery(query);
                slashQueryRef.current = query;
                const allItems = getAllSlashMenuItems();
                const filtered = allItems.filter(item =>
                  item.label.toLowerCase().includes(query.toLowerCase())
                );
                setSlashMenuItems(filtered);
                slashMenuItemsRef.current = filtered;
                setSelectedSlashIndex(0);
              }}
              onKeyDown={(e) => {
                const items = slashMenuItemsRef.current;
                const maxIndex = items.length - 1;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedSlashIndex((prev) => Math.min(prev + 1, maxIndex));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedSlashIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const item = items[selectedSlashIndexRef.current];
                  if (item) {
                    item.action();
                  }
                  closeSlashMenu();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  closeSlashMenu();
                }
              }}
              placeholder="Search commands..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-[340px]">
            {slashMenuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={() => {
                  item.action();
                  closeSlashMenu();
                }}
                className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 transition-colors ${
                  index === selectedSlashIndex ? 'bg-gray-100' : ''
                }`}
              >
                <item.icon size={18} className="text-gray-500" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .tiptap-editor {
          padding-left: 30px !important;
        }
        .tiptap-editor .ProseMirror {
          padding: 12px !important;
          min-height: 500px;
        }
        .tiptap-drag-handle {
          position: absolute;
          width: 20px;
          height: 28px;
          opacity: 0;
          pointer-events: auto;
          transition: opacity 0.12s ease;
          background: transparent;
          color: #94a3b8;
          border: 1px solid transparent;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          z-index: 20;
          user-select: none;
        }
        .tiptap-drag-handle:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #e2e8f0;
        }
        .tiptap-drag-handle:active {
          cursor: grabbing;
        }
        .ProseMirror *:hover + .tiptap-drag-handle {
          opacity: 1;
          pointer-events: auto;
        }
        .tiptap-drag-handle:hover,
        .tiptap-drag-handle:active {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .editor-content {
          min-height: 500px;
        }
        .editor-content :deep(p.is-editor-empty:first-child::before) {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap-editor .text-left {
          text-align: left;
        }
        .tiptap-editor .text-center {
          text-align: center;
        }
        .tiptap-editor .text-right {
          text-align: right;
        }
        .tiptap-editor .text-justify {
          text-align: justify;
        }
        .tiptap-editor pre {
          background-color: #1e293b;
          color: #e2e8f0;
          padding: 1em;
          border-radius: 0.25em;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .tiptap-editor .hljs-keyword,
        .tiptap-editor .hljs-selector-tag,
        .tiptap-editor .hljs-built_in,
        .tiptap-editor .hljs-name,
        .tiptap-editor .hljs-tag {
          color: #f59e0b;
        }
        .tiptap-editor .hljs-string,
        .tiptap-editor .hljs-title,
        .tiptap-editor .hljs-section,
        .tiptap-editor .hljs-attribute,
        .tiptap-editor .hljs-literal,
        .tiptap-editor .hljs-template-tag,
        .tiptap-editor .hljs-template-variable,
        .tiptap-editor .hljs-type,
        .tiptap-editor .hljs-addition {
          color: #10b981;
        }
        .tiptap-editor .hljs-comment,
        .tiptap-editor .hljs-quote,
        .tiptap-editor .hljs-deletion,
        .tiptap-editor .hljs-meta {
          color: #6b7280;
        }
        .tiptap-editor .hljs-number,
        .tiptap-editor .hljs-regexp,
        .tiptap-editor .hljs-selector-attr,
        .tiptap-editor .hljs-selector-pseudo,
        .tiptap-editor .hljs-variable {
          color: #f87171;
        }
        .tiptap-editor .hljs-function,
        .tiptap-editor .hljs-class .hljs-title {
          color: #3b82f6;
        }
        .code-block-language-dropdown {
          position: absolute;
          z-index: 100;
        }
        .toolbar-dropdown {
          position: relative;
        }
        .toolbar-dropdown-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 12px;
          background-color: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .toolbar-dropdown-trigger:hover {
          background-color: #4b5563;
        }
        .toolbar-dropdown-menu {
          position: fixed;
          top: 0;
          left: 0;
          min-width: 160px;
          max-height: 300px;
          overflow-y: auto;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 200;
        }
        .toolbar-dropdown-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          text-align: left;
          font-size: 13px;
          color: #374151;
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.15s;
        }
        .toolbar-dropdown-item:hover {
          background-color: #f3f4f6;
        }
        .toolbar-dropdown-item.active {
          background-color: #eff6ff;
          color: #1d4ed8;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default RichTextEditorEx;
