import { useEffect, useState, useRef, useCallback, memo, forwardRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
  style?: React.CSSProperties;
  'data-testid'?: string;
  showToolbar?: boolean;
}

const slashCommands = [
  { id: 'bold', label: 'Bold', command: 'toggleBold', group: 'text' },
  { id: 'italic', label: 'Italic', command: 'toggleItalic', group: 'text' },
  { id: 'underline', label: 'Underline', command: 'toggleUnderline', group: 'text' },
  { id: 'strike', label: 'Strikethrough', command: 'toggleStrike', group: 'text' },
  { id: 'h1', label: 'Heading 1', command: 'toggleHeading', params: { level: 1 }, group: 'heading' },
  { id: 'h2', label: 'Heading 2', command: 'toggleHeading', params: { level: 2 }, group: 'heading' },
  { id: 'bulletList', label: 'Bullet List', command: 'toggleBulletList', group: 'list' },
  { id: 'orderedList', label: 'Ordered List', command: 'toggleOrderedList', group: 'list' },
  { id: 'code', label: 'Inline Code', command: 'toggleCode', group: 'code' },
  { id: 'codeBlock', label: 'Code Block', command: 'toggleCodeBlock', group: 'code' },
  { id: 'link', label: 'Insert Link', command: 'insertLink', group: 'insert' },
  { id: 'image', label: 'Insert Image', command: 'insertImage', group: 'insert' },
  { id: 'file', label: 'Attach File', command: 'attachFile', group: 'insert' },
  { id: 'table', label: 'Insert Table', command: 'insertTable', group: 'insert' },
];

interface SlashMenuProps {
  show: boolean;
  position: { x: number; y: number; maxHeight: number };
  onSelectCommand: (command: string, params?: any) => void;
  selectedIndex: number;
  onClose: () => void;
}

const SlashMenuComponent = forwardRef<HTMLDivElement, SlashMenuProps>(({
  show,
  position,
  onSelectCommand,
  selectedIndex,
  onClose
}, ref) => {
  const { Bold, Italic, Underline, Strikethrough, Heading1, Heading2, List, ListOrdered, Code, Type, Link2, ImageIcon, FileText, Search } = require('lucide-react');

  const iconMap: Record<string, any> = {
    bold: Bold,
    italic: Italic,
    underline: Underline,
    strike: Strikethrough,
    h1: Heading1,
    h2: Heading2,
    bulletList: List,
    orderedList: ListOrdered,
    code: Code,
    codeBlock: Type,
    link: Link2,
    image: ImageIcon,
    file: FileText,
  };

  if (!show) return null;

  return (
    <div
      ref={ref}
      className="slash-menu"
      style={{
        left: position.x,
        top: position.y,
        maxHeight: position.maxHeight,
        overflowY: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 mb-2">
        <Search className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Search commands...</span>
      </div>
      {slashCommands.map((cmd, index) => {
        const Icon = iconMap[cmd.id] || Type;
        return (
          <button
            key={cmd.id}
            data-command-index={index}
            className={`slash-menu-item ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => onSelectCommand(cmd.command, cmd.params)}
          >
            <div className="slash-menu-item-icon">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <span className="slash-menu-item-label">{cmd.label}</span>
          </button>
        );
      })}
    </div>
  );
});

const SlashMenu = memo(SlashMenuComponent);

const FloatingToolbar = memo(({
  show,
  position,
  editor
}: {
  show: boolean;
  position: { x: number; y: number };
  editor: any;
}) => {
  if (!show || !editor) return null;

  const { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Code, Link2 } = require('lucide-react');

  return (
    <div
      className="floating-toolbar"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <button
        className={editor.isActive('bold') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        className={editor.isActive('italic') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        className={editor.isActive('underline') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <Underline className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      <button
        className={editor.isActive('bulletList') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        className={editor.isActive('orderedList') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1"></div>
      <button
        className={editor.isActive('code') ? 'active' : ''}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().extendMarkRange('link').toggleLink().run()}
        title="Insert Link"
      >
        <Link2 className="w-4 h-4" />
      </button>
    </div>
  );
});

const TextAlignDropdown = memo(({ editor }: { editor: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { AlignLeft, AlignCenter, AlignRight, AlignJustify, ChevronDown } = require('lucide-react');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        left: rect.left,
        top: rect.bottom + 4,
      });
    }
    setIsOpen(true);
  };

  const alignmentOptions = [
    { align: 'left', icon: AlignLeft, label: 'Align Left' },
    { align: 'center', icon: AlignCenter, label: 'Align Center' },
    { align: 'right', icon: AlignRight, label: 'Align Right' },
    { align: 'justify', icon: AlignJustify, label: 'Justify' },
  ];

  const getCurrentAlignment = () => {
    for (const option of alignmentOptions) {
      if (editor.isActive({ textAlign: option.align })) {
        return option;
      }
    }
    return alignmentOptions[0];
  };

  const currentAlignment = getCurrentAlignment();

  return (
    <div ref={dropdownRef} className="toolbar-dropdown">
      <button
        ref={triggerRef}
        className="toolbar-dropdown-trigger"
        onClick={handleOpen}
        title="Text Alignment"
      >
        <currentAlignment.icon className="w-4 h-4" />
        <ChevronDown className="w-3 h-3" />
      </button>
      {isOpen && (
        <div 
          className="toolbar-dropdown-menu"
          style={{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }}
        >
          {alignmentOptions.map((option) => (
            <button
              key={option.align}
              className={`toolbar-dropdown-item ${editor.isActive({ textAlign: option.align }) ? 'active' : ''}`}
              onClick={() => {
                editor.chain().focus().setTextAlign(option.align).run();
                setIsOpen(false);
              }}
              title={option.label}
            >
              <span>
                <option.icon style={{ width: '16px', height: '16px' }} />
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const TableToolbar = memo(({ editor, show }: { editor: any; show: boolean }) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!show || !editor) return;

    // Find the table element in the editor
    const tableElement = document.querySelector('.tiptap-editor table') as HTMLElement;
    if (tableElement) {
      const rect = tableElement.getBoundingClientRect();
      const editorContainer = document.querySelector('.relative.rounded-lg') as HTMLElement;
      const containerRect = editorContainer?.getBoundingClientRect();
      
      setPosition({
        top: rect.top - (containerRect?.top || 0) - 50,
        left: rect.left - (containerRect?.left || 0)
      });
    }
  }, [show, editor]);

  if (!show || !editor) return null;

  const {
    ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, LayoutGrid, Square, Layout, Minus
  } = require('lucide-react');

  return (
    <div 
      ref={toolbarRef}
      className="table-toolbar"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 100
      }}
    >
      <div className="table-toolbar-group">
        <span className="table-toolbar-label">Rows:</span>
        <button
          onClick={() => editor.chain().focus().addRowBefore().run()}
          title="Insert Row Before"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          title="Insert Row After"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          title="Delete Row"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="table-toolbar-divider"></div>

      <div className="table-toolbar-group">
        <span className="table-toolbar-label">Columns:</span>
        <button
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          title="Insert Column Before"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          title="Insert Column After"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          title="Delete Column"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="table-toolbar-divider"></div>

      <div className="table-toolbar-group">
        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          title="Delete Table"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive('tableHeader') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          title="Toggle Header Row"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().mergeCells().run()}
          title="Merge Cells"
        >
          <Square className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().splitCell().run()}
          title="Split Cell"
        >
          <Layout className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

const Toolbar = memo(({ editor, insertTable }: { editor: any; insertTable: () => void }) => {
  if (!editor) return null;

  const {
    Bold, Italic, Underline, Strikethrough, Heading1, Heading2,
    List, ListOrdered, Quote, Code, Type, Link2, ImageIcon, FileText,
    Undo, Redo, Highlighter, Table
  } = require('lucide-react');

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          className={editor.isActive('bold') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive('italic') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive('underline') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive('strike') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive('highlight') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          className={editor.isActive('bulletList') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive('orderedList') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive('blockquote') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          className={editor.isActive('code') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive('codeBlock') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <Type className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().extendMarkRange('link').toggleLink().run()}
          title="Insert Link"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event: any) => {
                  editor?.chain().focus().setImage({ src: event.target?.result }).run();
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.click();
          }}
          title="Attach File"
        >
          <FileText className="w-4 h-4" />
        </button>
        <button
          onClick={insertTable}
          title="Insert Table (3x3)"
        >
          <Table className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <TextAlignDropdown editor={editor} />

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

const LinkModal = memo(({
  show,
  onInsert,
  onCancel
}: {
  show: boolean;
  onInsert: (url: string) => void;
  onCancel: () => void;
}) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (show) {
      setUrl('');
    }
  }, [show]);

  const handleInsert = () => {
    if (url) {
      onInsert(url);
      setUrl('');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96">
        <h3 className="text-sm font-medium text-gray-800 mb-3">Insert Link</h3>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleInsert();
            }
          }}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => {
              onCancel();
              setUrl('');
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
});

function RichTextEditorClient({
  value,
  onChange,
  placeholder,
  className,
  onBlur,
  style,
  'data-testid': dataTestId,
  showToolbar = true
}: RichTextEditorProps) {
  const { useEditor, EditorContent } = require('@tiptap/react');
  const StarterKit = require('@tiptap/starter-kit').default;
  const Image = require('@tiptap/extension-image').default;
  const CodeBlock = require('@tiptap/extension-code-block').default;
  const { Color } = require('@tiptap/extension-color');
  const { TextStyle } = require('@tiptap/extension-text-style');
  const Link = require('@tiptap/extension-link').default;
  const UnderlineExtension = require('@tiptap/extension-underline').default;
  const { Highlight } = require('@tiptap/extension-highlight');
  const { TextAlign } = require('@tiptap/extension-text-align');
  const { Table } = require('@tiptap/extension-table');
  const { TableRow } = require('@tiptap/extension-table-row');
  const { TableCell } = require('@tiptap/extension-table-cell');
  const { TableHeader } = require('@tiptap/extension-table-header');

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0, maxHeight: 520 });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 0, y: 0 });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isTableSelected, setIsTableSelected] = useState(false);

  const selectedIndexRef = useRef(0);
  const menuVisibleRef = useRef(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  const handleUpdate = useCallback(({ editor }: { editor: any }) => {
    onChange(editor.getHTML());
    setHasContent(editor.getText().trim().length > 0);
  }, [onChange]);

  const handleSelectionUpdate = useCallback(({ editor }: { editor: any }) => {
    const selection = editor.state.selection;
    const isTableActive = editor.isActive('table');
    setIsTableSelected(isTableActive);
    
    if (selection && !selection.empty) {
      const domSelection = window.getSelection();
      if (domSelection && domSelection.rangeCount > 0) {
        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setFloatingToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 50,
        });
        setShowFloatingToolbar(true);
      }
    } else {
      setShowFloatingToolbar(false);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: true }),
      CodeBlock,
      Color,
      TextStyle.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({ openOnClick: false }),
      UnderlineExtension,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: handleUpdate,
    onSelectionUpdate: handleSelectionUpdate,
  });

  const insertTable = useCallback(() => {
    if (!editor) return;

    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run();
  }, [editor]);

  useEffect(() => {
    if (!editor || !onBlur) return;

    const handleBlur = () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      blurTimeoutRef.current = window.setTimeout(() => {
        onBlur();
      }, 50);
    };

    editor.on('blur', handleBlur);

    return () => {
      editor.off('blur', handleBlur);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [editor, onBlur]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        const selection = editor.state.selection;
        const $from = selection.$from;
        const textBeforeCursor = $from.nodeBefore?.textContent || '';
        const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
        const textAfterLastSpace = textBeforeCursor.substring(lastSpaceIndex + 1);

        if (textAfterLastSpace === '') {
          e.preventDefault();
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            let rect = range.getBoundingClientRect();

            if (rect.width === 0 && rect.height === 0) {
              const selectionNode = range.commonAncestorContainer;
              const parentElement = selectionNode.nodeType === Node.TEXT_NODE
                ? selectionNode.parentElement
                : selectionNode as HTMLElement;

              if (parentElement) {
                const parentRect = parentElement.getBoundingClientRect();
                const editorElement = parentElement.closest('.tiptap-editor');

                if (editorElement) {
                  const editorRect = editorElement.getBoundingClientRect();
                  rect = {
                    x: editorRect.left + 16,
                    y: parentRect.top,
                    width: 0,
                    height: 20,
                    top: parentRect.top,
                    bottom: parentRect.bottom,
                    left: editorRect.left + 16,
                    right: editorRect.left + 16,
                    toJSON: () => ({})
                  };
                }
              }
            }

            const menuWidth = 256;
            const menuHeight = 520;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const safeMargin = 32;

            let menuX = rect.left;
            let menuY = rect.bottom;
            let maxMenuHeight = menuHeight;

            if (menuX + menuWidth > viewportWidth - safeMargin) {
              menuX = viewportWidth - menuWidth - safeMargin;
            }

            if (menuX < safeMargin) {
              menuX = safeMargin;
            }

            const spaceBelow = viewportHeight - rect.bottom - safeMargin;
            const spaceAbove = rect.top - safeMargin;

            let shouldFlip = false;
            let targetHeight = menuHeight;

            if (spaceBelow < targetHeight && spaceAbove > spaceBelow) {
              shouldFlip = true;
              targetHeight = Math.min(targetHeight, spaceAbove);
            } else if (spaceBelow < targetHeight) {
              targetHeight = Math.max(100, spaceBelow);
            }

            maxMenuHeight = targetHeight;

            if (shouldFlip) {
              menuY = rect.top - maxMenuHeight;
            }

            if (menuY < safeMargin) {
              menuY = safeMargin;
              maxMenuHeight = Math.max(100, Math.min(maxMenuHeight, viewportHeight - safeMargin * 2));
            }

            setSlashMenuPosition({ x: menuX, y: menuY, maxHeight: maxMenuHeight });
            selectedIndexRef.current = 0;
            menuVisibleRef.current = true;
            setSelectedCommandIndex(0);
            setShowSlashMenu(true);
          }
        }
      }

      if (e.key === 'Escape') {
        menuVisibleRef.current = false;
        setShowSlashMenu(false);
        return;
      }

      if (menuVisibleRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          const nextIndex = selectedIndexRef.current < slashCommands.length - 1
            ? selectedIndexRef.current + 1
            : 0;
          selectedIndexRef.current = nextIndex;
          setSelectedCommandIndex(nextIndex);

          setTimeout(() => {
            const menu = slashMenuRef.current;
            if (menu) {
              const selectedButton = menu.querySelector(`button[data-command-index="${nextIndex}"]`);
              if (selectedButton) {
                selectedButton.scrollIntoView({ block: 'nearest' });
              }
            }
          }, 0);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          const nextIndex = selectedIndexRef.current > 0
            ? selectedIndexRef.current - 1
            : slashCommands.length - 1;
          selectedIndexRef.current = nextIndex;
          setSelectedCommandIndex(nextIndex);

          setTimeout(() => {
            const menu = slashMenuRef.current;
            if (menu) {
              const selectedButton = menu.querySelector(`button[data-command-index="${nextIndex}"]`);
              if (selectedButton) {
                selectedButton.scrollIntoView({ block: 'nearest' });
              }
            }
          }, 0);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const cmd = slashCommands[selectedIndexRef.current];
          if (cmd) {
            executeCommand(cmd.command, cmd.params);
          }
          menuVisibleRef.current = false;
          setShowSlashMenu(false);
          return;
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.slash-menu') && !target.closest('.tiptap-editor')) {
        menuVisibleRef.current = false;
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor]);

  const executeCommand = useCallback((command: string, params?: any) => {
    if (!editor) return;
    editor.view.focus();

    switch (command) {
      case 'toggleBold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'toggleItalic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'toggleUnderline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'toggleStrike':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'toggleHeading':
        editor.chain().focus().setHeading(params).insertContent(' ').run();
        break;
      case 'toggleBulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'toggleOrderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'toggleCode':
        editor.chain().focus().toggleCode().run();
        break;
      case 'toggleCodeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'insertLink':
        setShowLinkModal(true);
        break;
      case 'insertImage':
        handleImageUpload();
        break;
      case 'attachFile':
        const input = document.createElement('input');
        input.type = 'file';
        input.click();
        break;
      case 'insertTable':
        insertTable();
        break;
    }
    setShowSlashMenu(false);
  }, [editor, insertTable]);

  const handleImageUpload = useCallback(() => {
    if (!editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          editor?.chain().focus().setImage({ src: event.target?.result }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  const handleLinkInsert = useCallback((linkUrl: string) => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setShowLinkModal(false);
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      ref={editorContainerRef}
      className={`relative rounded-lg focus:outline-none focus:border-transparent focus:ring-0 ${className} ${showToolbar ? 'with-toolbar' : ''}`}
      style={{ outline: 'none !important', boxShadow: 'none !important', border: 'none !important', cursor: 'text', ...style }}
    >
      <style>{`
        .toolbar {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 8px 12px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 8px 8px 0 0;
          flex-wrap: wrap;
        }
        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 1px;
        }
        .toolbar-divider {
          width: 1px;
          height: 24px;
          background: #e5e7eb;
          margin: 0 4px;
        }
        .toolbar > .toolbar-group > button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 8px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: #4b5563;
          transition: all 0.15s;
        }
        .toolbar > .toolbar-group > button:hover {
          background: #e5e7eb;
          color: #1f2937;
        }
        .toolbar > .toolbar-group > button.active {
          background: #d1d5db;
          color: #1f2937;
        }
        .toolbar > .toolbar-group > button:active {
          background: #9ca3af;
        }
        .tiptap-editor [contenteditable="true"]:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .tiptap-editor:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .tiptap-editor *:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .tiptap-editor .ProseMirror {
          outline: none;
          min-height: 40px;
          padding: 8px;
        }
        .editor-placeholder {
          position: absolute;
          top: 16px;
          left: 16px;
          color: #9ca3af;
          pointer-events: none;
          user-select: none;
          line-height: 1.5;
          font-size: 14px;
        }
        .with-toolbar .editor-placeholder {
          top: 64px;
        }
        .with-toolbar .tiptap-editor .ProseMirror {
          padding-top: 16px;
        }
        .tiptap-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.2;
        }
        .tiptap-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.2;
        }
        .tiptap-editor ul, .tiptap-editor ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
          list-style-type: initial;
        }
        .tiptap-editor ul {
          list-style-type: disc;
        }
        .tiptap-editor ol {
          list-style-type: decimal;
        }
        .tiptap-editor li {
          margin: 0.25em 0;
        }
        .tiptap-editor li p {
          margin: 0;
          display: inline;
        }
        .tiptap-editor code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: monospace;
          font-size: 0.85em;
        }
        .tiptap-editor pre {
          background-color: #1f2937;
          color: #e5e7eb;
          padding: 1em;
          border-radius: 0.25em;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .tiptap-editor pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          font-size: 0.85em;
        }
        .tiptap-editor blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1em;
          margin: 0.5em 0;
          color: #6b7280;
          font-style: italic;
        }
        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.25em;
        }
        .tiptap-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .tiptap-editor hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1em 0;
        }
        .tiptap-editor p {
          margin: 0.5em 0;
          line-height: 1.5;
        }
        .tiptap-editor strong {
          font-weight: bold;
        }
        .tiptap-editor em {
          font-style: italic;
        }
        .tiptap-editor br {
          line-height: 1.5;
        }
        .tiptap-editor .hard-break {
          line-height: 1.5;
        }
        .tiptap-editor mark {
          background-color: #fef08a;
          border-radius: 2px;
          padding: 0 2px;
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
        .tiptap-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
          border: 1px solid #e5e7eb;
          table-layout: auto;
        }
        .tiptap-editor th,
        .tiptap-editor td {
          border: 1px solid #e5e7eb;
          padding: 12px 16px;
          text-align: left;
          min-width: 80px;
          vertical-align: top;
          position: relative;
        }
        .tiptap-editor th {
          background-color: #1f2937;
          font-weight: 600;
          color: #ffffff;
          border-color: #374151;
        }
        .tiptap-editor th:first-child {
          border-left-color: #1f2937;
        }
        .tiptap-editor th:last-child {
          border-right-color: #1f2937;
        }
        .tiptap-editor tr:first-child th {
          border-top-color: #1f2937;
        }
        .tiptap-editor tr:hover td {
          background-color: #f9fafb;
        }
        .tiptap-editor table .selectedCell {
          background-color: #dbeafe;
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
        }
        .tiptap-editor table .column-resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          cursor: col-resize;
          background-color: transparent;
          z-index: 10;
        }
        .tiptap-editor table .column-resize-handle:hover {
          background-color: #3b82f6;
        }
        .toolbar > .toolbar-group > button.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .toolbar > .toolbar-group > button.disabled:hover {
          background: transparent;
          color: #4b5563;
        }
        .tiptap-editor table-wrapper {
          overflow-x: auto;
        }
        .slash-menu {
          position: fixed;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          padding: 8px;
          min-width: 256px;
          z-index: 1000;
        }
        .slash-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s;
        }
        .slash-menu-item:hover,
        .slash-menu-item.selected {
          background-color: #f3f4f6;
        }
        .slash-menu-item-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .slash-menu-item-label {
          flex: 1;
          font-size: 14px;
          color: #374151;
        }
        .slash-menu-item-group {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 12px;
          margin-top: 8px;
        }
        .floating-toolbar {
          position: fixed;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 4px;
          display: flex;
          gap: 2px;
          z-index: 1000;
          transform: translateX(-50%);
        }
        .floating-toolbar button {
          padding: 6px 10px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: #374151;
          transition: background-color 0.15s;
        }
        .floating-toolbar button:hover {
          background-color: #f3f4f6;
        }
        .floating-toolbar button.active {
          background-color: #e5e7eb;
        }
        .toolbar-dropdown {
          position: relative;
          display: inline-block;
          z-index: 100;
        }
        .toolbar-dropdown-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 8px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: #4b5563;
          transition: all 0.15s;
        }
        .toolbar-dropdown-trigger:hover {
          background: #e5e7eb;
          color: #1f2937;
        }
        .toolbar-dropdown-menu {
          position: fixed;
          background: white;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 4px;
          min-width: 160px;
          z-index: 2000;
          margin-top: 4px;
        }
        .toolbar-dropdown-item {
          display: grid;
          grid-template-columns: 24px 1fr;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: #4b5563;
          transition: all 0.15s;
          width: 100%;
          text-align: left;
        }
        .toolbar-dropdown-item:hover {
          background: #f3f4f6;
          color: #1f2937;
        }
        .toolbar-dropdown-item.active {
          background: #e5e7eb;
          color: #1f2937;
        }
        .toolbar-dropdown-item span {
          font-size: 13px;
          flex-shrink: 0;
        }
        .toolbar-dropdown-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 24px;
          flex-shrink: 0;
        }
        .toolbar-dropdown-item svg {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }
        .table-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          flex-wrap: wrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          width: auto;
        }
        .table-toolbar-group {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .table-toolbar-label {
          font-size: 12px;
          color: #92400e;
          font-weight: 500;
          margin-right: 4px;
        }
        .table-toolbar-divider {
          width: 1px;
          height: 24px;
          background: #fcd34d;
          margin: 0 4px;
        }
        .table-toolbar button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 8px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          color: #92400e;
          transition: all 0.15s;
        }
        .table-toolbar button:hover {
          background: #fcd34d;
          color: #78350f;
        }
        .table-toolbar button.active {
          background: #fcd34d;
          color: #78350f;
        }
      `}</style>

      {showToolbar && <Toolbar editor={editor} insertTable={insertTable} />}
      <TableToolbar editor={editor} show={isTableSelected} />
      <EditorContent editor={editor} className="tiptap-editor" data-testid={dataTestId} />

      {!hasContent && !editor.getText().trim() && (
        <div className="editor-placeholder">{placeholder || 'Start typing...'}</div>
      )}

      <SlashMenu
        show={showSlashMenu}
        position={slashMenuPosition}
        onSelectCommand={executeCommand}
        selectedIndex={selectedCommandIndex}
        onClose={() => setShowSlashMenu(false)}
        ref={slashMenuRef}
      />

      <FloatingToolbar
        show={showFloatingToolbar}
        position={floatingToolbarPosition}
        editor={editor}
      />

      <LinkModal
        show={showLinkModal}
        onInsert={handleLinkInsert}
        onCancel={() => setShowLinkModal(false)}
      />
    </div>
  );
}

export default memo(RichTextEditorClient);
