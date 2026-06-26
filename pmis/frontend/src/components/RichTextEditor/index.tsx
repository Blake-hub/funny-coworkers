import { useEffect, useState, useRef, useCallback, memo, forwardRef, useMemo } from 'react';
import { common, createLowlight } from 'lowlight';
import { EditorContent } from '@tiptap/react';

const lowlight = createLowlight(common);

// Content type - can be HTML string or ProseMirror JSON
export type Content = string | object;

interface RichTextEditorProps {
  value: string;
  onChange: (content: string, json: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
  style?: React.CSSProperties;
  'data-testid'?: string;
  showToolbar?: boolean;
  onReady?: (editor: any) => void;
}

const slashCommands = [
  { id: 'bold', label: 'Bold', command: 'toggleBold', group: 'text' },
  { id: 'italic', label: 'Italic', command: 'toggleItalic', group: 'text' },
  { id: 'underline', label: 'Underline', command: 'toggleUnderline', group: 'text' },
  { id: 'strike', label: 'Strikethrough', command: 'toggleStrike', group: 'text' },
  { id: 'h1', label: 'Heading 1', command: 'toggleHeading', params: { level: 1 }, group: 'heading' },
  { id: 'h2', label: 'Heading 2', command: 'toggleHeading', params: { level: 2 }, group: 'heading' },
  { id: 'blockquote', label: 'Quote', command: 'toggleBlockquote', group: 'format' },
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
  const { Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Quote, List, ListOrdered, Code, Type, Link2, ImageIcon, FileText, Search } = require('lucide-react');

  const iconMap: Record<string, any> = {
    bold: Bold,
    italic: Italic,
    underline: Underline,
    strike: Strikethrough,
    h1: Heading1,
    h2: Heading2,
    blockquote: Quote,
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

const DocumentOutline = memo(({ editor }: { editor: any }) => {
  const [headings, setHeadings] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const newHeadings: any[] = [];
      let idCounter = 0;

      editor.state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level;
          const text = node.textContent || `Heading ${level}`;
          newHeadings.push({
            id: `heading-${idCounter++}`,
            level,
            text,
            pos,
          });
        }
        return true;
      });

      setHeadings(newHeadings);
    };

    updateHeadings();
    editor.on('update', updateHeadings);

    return () => {
      editor.off('update', updateHeadings);
    };
  }, [editor]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    
    editor.commands.setTextSelection(pos);
    editor.chain().focus().run();
    
    const domAtPos = editor.view.domAtPos(pos);
    const headingElement = domAtPos.node.parentElement;
    
    if (headingElement) {
      const findScrollContainer = (element: HTMLElement): HTMLElement | null => {
        let parent = element.parentElement;
        while (parent) {
          const style = window.getComputedStyle(parent);
          const overflowY = style.overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') {
            return parent;
          }
          parent = parent.parentElement;
        }
        return null;
      };
      
      const scrollContainer = findScrollContainer(headingElement);
      
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = headingElement.getBoundingClientRect();
        
        const targetScrollTop = scrollContainer.scrollTop + 
          (elementRect.top - containerRect.top) - 
          (containerRect.height / 2) + 
          (elementRect.height / 2);
        
        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
      } else {
        headingElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }
  };

  const buildTree = () => {
    const tree: any[] = [];
    const stack: any[] = [];

    for (const heading of headings) {
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }

      const node = {
        ...heading,
        children: [],
      };

      if (stack.length === 0) {
        tree.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }

      stack.push(node);
    }

    return tree;
  };

  const TreeItem = ({ item, depth = 0 }: { item: any; depth?: number }) => (
    <div key={item.id}>
      <button
        onClick={() => {
          if (item.children.length > 0) {
            toggleExpand(item.id);
          }
          scrollToHeading(item.pos);
        }}
        className="outline-item"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="w-3 h-3 flex items-center justify-center flex-shrink-0">
          {item.children.length > 0 ? (
            expandedItems.has(item.id) ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )
          ) : (
            <span className="w-3" />
          )}
        </span>
        <span className="flex-1 truncate" style={{ fontWeight: item.level <= 2 ? '600' : '400' }}>
          {item.text}
        </span>
        <span className="text-xs">H{item.level}</span>
      </button>
      {item.children.length > 0 && expandedItems.has(item.id) && (
        <div>
          {item.children.map((child: any) => (
            <TreeItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  const tree = buildTree();

  if (headings.length === 0) {
    return (
      <div className="document-outline">
        <h3>Document Outline</h3>
        <p className="text-xs text-gray-400 mt-2">No headings found</p>
      </div>
    );
  }

  return (
    <div className="document-outline">
      <h3>Document Outline</h3>
      <div className="mt-4 space-y-0">
        {tree.map((item) => (
          <TreeItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
});

const HeadingDropdown = memo(({ editor }: { editor: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, ChevronDown } = require('lucide-react');

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

  const headingOptions = [
    { level: 1, icon: Heading1, label: 'Heading 1' },
    { level: 2, icon: Heading2, label: 'Heading 2' },
    { level: 3, icon: Heading3, label: 'Heading 3' },
    { level: 4, icon: Heading4, label: 'Heading 4' },
    { level: 5, icon: Heading5, label: 'Heading 5' },
    { level: 6, icon: Heading6, label: 'Heading 6' },
  ];

  const getCurrentHeading = () => {
    for (let i = 0; i < headingOptions.length; i++) {
      const option = headingOptions[i];
      if (editor.isActive('heading', { level: option.level })) {
        return option;
      }
    }
    return null;
  };

  const currentHeading = getCurrentHeading();

  return (
    <div ref={dropdownRef} className="toolbar-dropdown">
      <button
        ref={triggerRef}
        className="toolbar-dropdown-trigger"
        onClick={handleOpen}
        title={currentHeading ? currentHeading.label : 'Headings'}
      >
        {currentHeading ? (
          <currentHeading.icon className="w-4 h-4" />
        ) : (
          <Heading1 className="w-4 h-4" />
        )}
        <ChevronDown className="w-3 h-3" />
      </button>
      {isOpen && (
        <div 
          className="toolbar-dropdown-menu"
          style={{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }}
        >
          {headingOptions.map((option) => (
            <button
              key={option.level}
              className={`toolbar-dropdown-item ${editor.isActive('heading', { level: option.level }) ? 'active' : ''}`}
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: option.level }).run();
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

const CodeBlockLanguageDropdown = memo(({ editor, hasCodeBlock }: { editor: any; hasCodeBlock: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [isCursorInCodeBlock, setIsCursorInCodeBlock] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { ChevronDown } = require('lucide-react');

  useEffect(() => {
    if (!hasCodeBlock || !editor) return;

    const updatePosition = () => {
      const codeBlockElements = document.querySelectorAll('.tiptap-editor pre');
      const codeBlocks = Array.from(codeBlockElements) as HTMLElement[];
      
      let activeCodeBlock = null;
      let isCursorInCodeBlock = false;
      
      // Try to find the code block that contains the cursor
      for (const codeBlock of codeBlocks) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (codeBlock.contains(range.commonAncestorContainer)) {
            activeCodeBlock = codeBlock;
            isCursorInCodeBlock = true;
            break;
          }
        }
      }
      
      // Update visibility state based on whether cursor is in code block
      setIsCursorInCodeBlock(isCursorInCodeBlock);
      
      if (activeCodeBlock && isCursorInCodeBlock) {
        const rect = activeCodeBlock.getBoundingClientRect();
        const editorContainer = document.querySelector('.relative.rounded-lg') as HTMLElement;
        const containerRect = editorContainer?.getBoundingClientRect();
        
        setDropdownPosition({
          top: rect.top - (containerRect?.top || 0) - 2,
          right: (containerRect?.right || 0) - rect.right - 2
        });
      }
    };

    updatePosition();

    // Add scroll and resize listeners to update position
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    // Also update when selection changes
    const handleSelectionChange = () => {
      setTimeout(updatePosition, 10);
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [hasCodeBlock, editor]);

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

  const getCurrentLanguage = () => {
    const language = editor.getAttributes('codeBlock').language;
    return languageOptions.find(opt => opt.lang === language) || languageOptions[0];
  };

  const currentLanguage = getCurrentLanguage();

  if (!hasCodeBlock || !isCursorInCodeBlock) {
    return null;
  }

  return (
    <div 
      className="code-block-language-dropdown"
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
        zIndex: 100
      }}
    >
      <div ref={dropdownRef} className="toolbar-dropdown">
        <button
          ref={triggerRef}
          className="toolbar-dropdown-trigger"
          onClick={handleOpen}
          title="Select Language"
        >
          <span className="text-xs font-medium">{currentLanguage.label}</span>
        </button>
        {isOpen && (
          <div 
            className="toolbar-dropdown-menu"
            style={{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }}
          >
            {languageOptions.map((option) => (
              <button
                key={option.lang}
                className={`toolbar-dropdown-item ${currentLanguage.lang === option.lang ? 'active' : ''}`}
                onClick={() => {
                  editor.chain().focus().setCodeBlock({ language: option.lang }).run();
                  setIsOpen(false);
                }}
                title={option.label}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
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
    Bold, Italic, Underline, Strikethrough,
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
        <HeadingDropdown editor={editor} />
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

const DropIndicator = ({ editor, targetBlock, position }: { 
  editor: any; 
  targetBlock: HTMLElement | null; 
  position: 'before' | 'after' | null; 
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    if (!editor || targetBlock === null || position === null) {
      setIndicatorStyle({ top: 0, left: 0, width: 0, opacity: 0 });
      return;
    }

    const updatePosition = () => {
      try {
        // Use the targetBlock directly instead of trying to find it by position
        const allBlocks = editor.view.dom.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre');
        const isLastBlock = targetBlock === allBlocks[allBlocks.length - 1];
        
        const rect = targetBlock.getBoundingClientRect();
        const editorRect = editor.view.dom.getBoundingClientRect();
        
        let topPosition: number;
        
        // Check if this is the last block and we're dropping after it
        if (position === 'after' && isLastBlock) {
          // Dropping after the last block
          topPosition = rect.bottom - editorRect.top - 3;
        } else {
          // Dropping before or after other blocks
          const isBefore = position === 'before';
          topPosition = isBefore 
            ? rect.top - editorRect.top 
            : rect.bottom - editorRect.top - 3;
        }
        
        setIndicatorStyle({
          top: topPosition,
          left: 12,
          width: editorRect.width - 24,
          opacity: 1,
        });
      } catch (e) {
        console.error('Error updating drop indicator position:', e);
        setIndicatorStyle({ top: 0, left: 0, width: 0, opacity: 0 });
      }
    };

    updatePosition();
    
    const observer = new ResizeObserver(updatePosition);
    observer.observe(editor.view.dom);
    
    return () => observer.disconnect();
  }, [editor, targetBlock, position]);
  
  return (
    <div 
      className="drop-indicator"
      style={{
        position: 'absolute',
        top: indicatorStyle.top,
        left: indicatorStyle.left,
        width: indicatorStyle.width,
        height: '3px',
        backgroundColor: '#3b82f6',
        borderRadius: '2px',
        opacity: indicatorStyle.opacity,
        zIndex: 100,
        transition: 'all 0.15s ease',
        boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
      }}
    />
  );
};

function RichTextEditorClient({
  value,
  onChange,
  placeholder,
  className,
  onBlur,
  style,
  'data-testid': dataTestId,
  showToolbar = true,
  onReady
}: RichTextEditorProps) {
  const { useEditor, EditorContent } = require('@tiptap/react');
  const StarterKit = require('@tiptap/starter-kit').default;
  const Image = require('@tiptap/extension-image').default;
  const CodeBlockLowlight = require('@tiptap/extension-code-block-lowlight').default;
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
  const Extension = require('@tiptap/core').Extension;

  const MoveNodeExtension = Extension.create({
    name: 'moveNode',
    addCommands() {
      return {
        moveNode: (fromPos: number, toPos: number, before: boolean) => ({ tr, dispatch, state }: { tr: any; dispatch: boolean; state: any }) => {
          if (!dispatch) return true;
          
          const fromNode = state.doc.nodeAt(fromPos);
          
          if (!fromNode || !fromNode.type.isBlock) {
            return false;
          }
          
          const fromNodeSize = fromNode.nodeSize;
          
          let insertPos: number;
          const toNode = state.doc.nodeAt(toPos);
          const toNodeSize = toNode ? toNode.nodeSize : 0;
          
          if (before) {
            insertPos = toPos;
          } else {
            insertPos = toPos + toNodeSize;
          }
          
          if (fromPos < insertPos) {
            insertPos -= fromNodeSize;
          }
          
          if (fromPos !== insertPos) {
            // Use cut to get cleaner content without extra separators
            const content = state.doc.cut(fromPos, fromPos + fromNodeSize).content;
            tr.delete(fromPos, fromPos + fromNodeSize);
            tr.insert(insertPos, content);
          }
          
          return true;
        },
      };
    },
  });

  const BlockWrapperExtension = Extension.create({
    name: 'blockWrapper',
    addProseMirrorPlugins() {
      const { GripVertical } = require('lucide-react');
      const { renderToString } = require('react-dom/server');
      
      return [
        new (require('prosemirror-state').Plugin)({
          props: {
            decorations(state: any) {
              const decos: any[] = [];
              state.doc.descendants((node: any, pos: number, parent: any) => {
                if (node.type.isBlock) {
                  // Skip nodes that are inside list containers, list items, or blockquotes
                  // The container itself should have the drag handle, not its children
                  if (parent && parent.type && (parent.type.name === 'bulletList' || parent.type.name === 'orderedList' || parent.type.name === 'listItem' || parent.type.name === 'blockquote')) {
                    return true;
                  }
                  
                  // Skip all nodes inside tables (except the table itself)
                  // We only want one drag handle for the entire table
                  if (node.type.name !== 'table') {
                    // Check if any ancestor is a table by traversing up through positions
                    let currentPos = pos;
                    let $pos = state.doc.resolve(currentPos);
                    let isInsideTable = false;
                    
                    // Walk up the depth to find if any ancestor is a table
                    for (let depth = $pos.depth; depth >= 0; depth--) {
                      const ancestorNode = $pos.node(depth);
                      if (ancestorNode && ancestorNode.type && ancestorNode.type.name === 'table') {
                        isInsideTable = true;
                        break;
                      }
                    }
                    
                    if (isInsideTable) {
                      return true;
                    }
                  }
                  
                  const handle = document.createElement('span');
                  handle.className = 'drag-handle';
                  handle.setAttribute('data-pos', String(pos));
                  handle.innerHTML = renderToString(<GripVertical size={14} />);
                  
                  decos.push(
                    require('prosemirror-view').Decoration.widget(
                      pos,
                      handle,
                      { side: 0 }
                    )
                  );
                }
                return true;
              });
              return require('prosemirror-view').DecorationSet.create(state.doc, decos);
            },
          },
        }),
      ];
    },
  });

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0, maxHeight: 520 });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 0, y: 0 });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isTableSelected, setIsTableSelected] = useState(false);
  const [hasCodeBlock, setHasCodeBlock] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropTargetPos, setDropTargetPos] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [dragGhostPosition, setDragGhostPosition] = useState({ x: 0, y: 0 });

  const selectedIndexRef = useRef(0);
  const editorRef = useRef<any>(null);
  const handleDragStartRef = useRef<any>(null);
  const dragHandleRef = useRef<any>(null);
  const menuVisibleRef = useRef(false);
  const draggingPosRef = useRef<number | null>(null);
  const targetPosRef = useRef<number | null>(null);
  const targetBlockRef = useRef<HTMLElement | null>(null);
  const dropPositionRef = useRef<'before' | 'after'>('after');
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  

  const handleUpdate = useCallback(({ editor }: { editor: any }) => {
    const html = editor.getHTML();
    const json = JSON.stringify(editor.getJSON());
    onChange(html, json);
    const textContent = editor.getText().trim();
    let hasNonTextContent = false;
    editor.state.doc.content.descendants((node: any) => {
      if (node.type.name === 'image' || node.type.name === 'codeBlock' || node.type.name === 'table') {
        hasNonTextContent = true;
        return false;
      }
      return true;
    });
    setHasContent(textContent.length > 0 || hasNonTextContent);
    let foundCodeBlock = false;
    editor.state.doc.content.descendants((node: any) => {
      if (node.type.name === 'codeBlock') {
        foundCodeBlock = true;
        return false;
      }
      return true;
    });
    setHasCodeBlock(foundCodeBlock);
  }, []);

  const handleSelectionUpdate = useCallback(({ editor }: { editor: any }) => {
    const selection = editor.state.selection;
    const isTableActive = editor.isActive('table');
    const isCodeBlockActive = editor.isActive('codeBlock');
    setIsTableSelected(isTableActive);
    setHasCodeBlock(isCodeBlockActive);
    
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
      CodeBlockLowlight.configure({
        lowlight,
      }),
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
      MoveNodeExtension,
      BlockWrapperExtension,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: handleUpdate,
    onSelectionUpdate: handleSelectionUpdate,
    onCreate: ({ editor }: { editor: any }) => {
      editorRef.current = editor;
    },
  });

  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

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

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const itemsArray = Array.from(items);
      
      for (let i = 0; i < itemsArray.length; i++) {
        const item = itemsArray[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          
          const file = item.getAsFile();
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event: any) => {
            editor?.chain().focus().setImage({ src: event.target?.result }).run();
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    const hideAllHandles = () => {
      const handles = editorElement.querySelectorAll('.drag-handle');
      handles.forEach((handle: Element) => {
        (handle as HTMLElement).style.opacity = '0';
      });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      let handle: HTMLElement | null = null;
      let blockElement = target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, div');
      
      if (blockElement) {
        const previousSibling = blockElement.previousElementSibling as HTMLElement;
        if (previousSibling && previousSibling.classList.contains('drag-handle')) {
          handle = previousSibling;
        }
      } else {
        const dragHandleElement = target.closest('.drag-handle');
        if (dragHandleElement) {
          handle = dragHandleElement as HTMLElement;
        }
      }
      
      hideAllHandles();
      if (handle) {
        handle.style.opacity = '1';
      }
    };

    const handleMouseLeave = () => {
      hideAllHandles();
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const blockElement = target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, div');
      
      if (blockElement) {
        const previousSibling = blockElement.previousElementSibling as HTMLElement;
        
        if (previousSibling && previousSibling.classList.contains('drag-handle')) {
          hideAllHandles();
          previousSibling.style.opacity = '1';
        }
      }
    };

    editorElement.addEventListener('mouseover', handleMouseOver, true);
    editorElement.addEventListener('mouseleave', handleMouseLeave);
    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver, true);
      editorElement.removeEventListener('mouseleave', handleMouseLeave);
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const handle = target.closest('.drag-handle');
      if (handle) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get the position from the drag handle's data-pos attribute
        const pos = parseInt(handle.getAttribute('data-pos') || '0');
        
        // Resolve the position to get the current block range
        const $pos = editor.state.doc.resolve(pos);
        const blockRange = $pos.blockRange();
        const actualPos = blockRange ? blockRange.start : pos;
        
        draggingPosRef.current = actualPos;
        setIsDragging(true);
        setDragGhostPosition({ x: e.clientX, y: e.clientY });

        const handleMouseMove = (e: MouseEvent) => {
          setDragGhostPosition({ x: e.clientX, y: e.clientY });
          
          const elements = document.elementsFromPoint(e.clientX, e.clientY);
          const allBlockElements = editorElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre');
          const allBlocks: HTMLElement[] = Array.from(allBlockElements).filter(el => {
            const htmlEl = el as HTMLElement;
            const parent = htmlEl.parentElement;
            return parent && parent === editorElement;
          }) as HTMLElement[];
          
          let foundBlock = false;
          
          for (const el of elements) {
            const blockEl = (el as HTMLElement).closest('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre');
            if (blockEl && editorElement.contains(blockEl)) {
              foundBlock = true;
              const blockRect = blockEl.getBoundingClientRect();
              const isBefore = e.clientY < blockRect.top + blockRect.height / 2;
              
              let blockIndex = -1;
              for (let i = 0; i < allBlocks.length; i++) {
                if (allBlocks[i] === blockEl) {
                  blockIndex = i;
                  break;
                }
              }
              
              // Special handling: if this is an empty paragraph after a list,
              // treat dropping "before" this paragraph as dropping "after" the list
              let adjustedBlockIndex = blockIndex;
              let adjustedIsBefore = isBefore;
              let adjustedBlockEl = blockEl;
              
              // Check if this is an empty paragraph
              // Empty paragraphs in TipTap often contain <br> elements, so we check for that
              const isEmptyParagraph = (() => {
                if (blockEl.tagName.toLowerCase() !== 'p') return false;
                const text = blockEl.textContent?.trim() || '';
                if (text !== '') return false;
                // Also check if the only child is a <br> element
                const children = Array.from(blockEl.childNodes);
                if (children.length === 0) return true;
                if (children.length === 1 && (children[0] as HTMLElement)?.tagName?.toLowerCase() === 'br') {
                  return true;
                }
                return children.every(child => {
                  if (child.nodeType === Node.TEXT_NODE) {
                    return (child.textContent || '').trim() === '';
                  }
                  if (child.nodeType === Node.ELEMENT_NODE) {
                    const el = child as HTMLElement;
                    return el.tagName?.toLowerCase() === 'br' || el.classList?.contains('ProseMirror-widget');
                  }
                  return true;
                });
              })();
              
              if (isEmptyParagraph) {
                const prevBlock = blockIndex > 0 ? allBlocks[blockIndex - 1] : null;
                const nextBlock = allBlocks[blockIndex + 1];
                
                if (prevBlock) {
                  const prevTagName = prevBlock.tagName.toLowerCase();
                  if (prevTagName === 'ul' || prevTagName === 'ol') {
                    adjustedBlockIndex = blockIndex - 1;
                    adjustedIsBefore = false;
                    adjustedBlockEl = prevBlock as HTMLElement;
                  }
                }
                
                if (!adjustedBlockEl && nextBlock) {
                  const nextTagName = nextBlock.tagName.toLowerCase();
                  if (nextTagName === 'ul' || nextTagName === 'ol') {
                    adjustedBlockIndex = blockIndex + 1;
                    adjustedIsBefore = true;
                    adjustedBlockEl = nextBlock as HTMLElement;
                  }
                }
              }
              
              if (adjustedBlockIndex !== -1) {
                const nodePositions: number[] = [];
                editor.state.doc.descendants((node: any, pos: number, parent: any) => {
                  if (node.type.isBlock && parent && parent.type && parent.type.name === 'doc') {
                    if (node.type.name === 'listItem') {
                      return true;
                    }
                    const $pos = editor.state.doc.resolve(pos);
                    const blockRange = $pos.blockRange();
                    nodePositions.push(blockRange ? blockRange.start : pos);
                  }
                  return true;
                });
                
                if (adjustedBlockIndex < nodePositions.length) {
                  const targetPos = nodePositions[adjustedBlockIndex];
                  targetPosRef.current = targetPos;
                  targetBlockRef.current = adjustedBlockEl as HTMLElement;
                  dropPositionRef.current = adjustedIsBefore ? 'before' : 'after';
                  setDropTargetPos(targetPos);
                  setDropPosition(adjustedIsBefore ? 'before' : 'after');
                }
              }
              break;
            }
          }
          
          // If no block was found, check if we're at the end of the editor
          if (!foundBlock && allBlocks.length > 0) {
            const lastBlock = allBlocks[allBlocks.length - 1];
            const lastBlockRect = lastBlock.getBoundingClientRect();
            
            // Check if we're after the last block
            if (e.clientY > lastBlockRect.bottom) {
              const nodePositions: number[] = [];
              editor.state.doc.descendants((node: any, pos: number, parent: any) => {
                if (node.type.isBlock && parent && parent.type && parent.type.name === 'doc') {
                  if (node.type.name === 'listItem') {
                    return true;
                  }
                  const $pos = editor.state.doc.resolve(pos);
                  const blockRange = $pos.blockRange();
                  nodePositions.push(blockRange ? blockRange.start : pos);
                }
                return true;
              });
              
              if (nodePositions.length > 0) {
                const lastPos = nodePositions[nodePositions.length - 1];
                targetPosRef.current = lastPos;
                targetBlockRef.current = lastBlock as HTMLElement;
                dropPositionRef.current = 'after';
                setDropTargetPos(lastPos);
                setDropPosition('after');
              }
            }
          }
        };

        const handleMouseUp = () => {
          const fromPos = draggingPosRef.current;
          const toPos = targetPosRef.current;
          const isBefore = dropPositionRef.current === 'before';
          
          if (fromPos !== null && toPos !== null && fromPos !== toPos) {
            try {
              editor.commands.moveNode(fromPos, toPos, isBefore);
            } catch (err) {
              console.error('Error moving node:', err);
            }
          }
          
          setIsDragging(false);
          setDropTargetPos(null);
          setDropPosition(null);
          draggingPosRef.current = null;
          targetPosRef.current = null;
          targetBlockRef.current = null;
          dropPositionRef.current = 'after';
          
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    editorElement.addEventListener('mousedown', handleMouseDown);

    return () => {
      editorElement.removeEventListener('mousedown', handleMouseDown);
    };
  }, [editor]);

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
      case 'toggleBlockquote':
        editor.chain().focus().toggleBlockquote().run();
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
    <div className={`relative rounded-lg focus:outline-none focus:border-transparent focus:ring-0 ${className} ${showToolbar ? 'with-toolbar' : ''} flex flex-col h-full`}
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
        .tiptap-editor {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
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
          min-height: 100%;
          padding: 12px;
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
        .tiptap-editor h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.2;
        }
        .tiptap-editor h4 {
          font-size: 1.125em;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.2;
        }
        .tiptap-editor h5 {
          font-size: 1em;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.2;
        }
        .tiptap-editor h6 {
          font-size: 0.875em;
          font-weight: bold;
          margin: 0.5em 0;
          line-height: 1.2;
          color: #6b7280;
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
        .tiptap-editor pre[class*="language-"],
        .tiptap-editor pre {
          background: #1f2937;
          color: #e5e7eb;
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
        .tiptap-editor blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 0;
          margin-left: 24px;
          margin-top: 0;
          margin-bottom: 0.5em;
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
          width: calc(100% - 24px);
          margin: 1em 0 1em 24px;
          border: 1px solid #e5e7eb;
          table-layout: auto;
          position: relative;
          overflow: hidden;
        }
        .tiptap-editor th,
        .tiptap-editor td {
          border: 1px solid #e5e7eb;
          padding: 6px 12px;
          text-align: left;
          min-width: 80px;
          vertical-align: top;
          line-height: 1.4;
          position: relative;
        }
        .tiptap-editor th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #1f2937;
          border-color: #e5e7eb;
        }
        .tiptap-editor th:first-child {
          border-left-color: #e5e7eb;
        }
        .tiptap-editor th:last-child {
          border-right-color: #e5e7eb;
        }
        .tiptap-editor tr:first-child th {
          border-top-color: #e5e7eb;
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
          right: -4px;
          top: -50px;
          bottom: -50px;
          width: 8px;
          cursor: col-resize;
          background-color: rgba(59, 130, 246, 0.3);
          z-index: 20;
        }
        .tiptap-editor table .column-resize-handle:hover,
        .tiptap-editor table .column-resize-handle:active {
          background-color: #3b82f6;
        }
        .tiptap-editor table p {
          margin: 0;
          padding: 0;
        }
        .toolbar > .toolbar-group > button.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .toolbar > .toolbar-group > button.disabled:hover {
          background: transparent;
          color: #4b5563;
        }
        .tiptap-editor .tableWrapper {
          overflow-x: auto;
          position: relative;
          padding: 0;
          max-height: 500px;
          overflow: visible;
          margin-left: 24px;
        }
        .tiptap-editor .tableWrapper table {
          margin: 1em 0;
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
        .code-block-language-dropdown {
          z-index: 100;
        }
        .code-block-language-dropdown .toolbar-dropdown {
          display: flex;
          align-items: center;
        }
        .code-block-language-dropdown .toolbar-dropdown-trigger {
          position: absolute;
          background-color: white;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='Black' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 4px center;
          background-size: 16px 16px;
          right: 0.5rem;
          top: 0.5rem;
          padding: 2px 24px 2px 8px;
          border-radius: 4px;
          border: 1px solid #d1d5db;
          font-size: 12px;
          color: #374151;
          cursor: pointer;
          appearance: none;
          min-width: 100px;
          white-space: nowrap;
        }
        .code-block-language-dropdown .toolbar-dropdown-trigger:hover {
          border-color: #9ca3af;
        }
        .code-block-language-dropdown .toolbar-dropdown-menu {
          grid-template-columns: 1fr;
          min-width: 140px;
          margin-top: 4px;
          max-height: 200px;
          overflow-y: auto;
        }
        .code-block-language-dropdown .toolbar-dropdown-item {
          grid-template-columns: 1fr;
          padding: 6px 12px;
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
        .document-outline {
          background: transparent;
        }
        .document-outline h3 {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .outline-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.15s;
          font-size: 13px;
          color: #4b5563;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
        }
        .outline-item:hover {
          background-color: #e5e7eb;
          color: #1f2937;
        }
        .outline-item svg {
          flex-shrink: 0;
          width: 14px;
          height: 14px;
          color: #9ca3af;
        }
        .outline-item span.flex-1 {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .outline-item .text-xs {
          font-size: 11px;
          color: #9ca3af;
          flex-shrink: 0;
          margin-left: 4px;
        }
        .drag-handle {
          float: left;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 20px;
          cursor: grab;
          color: #6b7280;
          opacity: 0;
          transition: all 0.15s ease;
          margin-right: 4px;
          margin-top: 0;
          margin-left: -2px;
          z-index: 10;
          border-radius: 4px;
          background: transparent;
        }
        .drag-handle:hover {
          opacity: 1 !important;
        }
        .tiptap-editor p,
        .tiptap-editor h1,
        .tiptap-editor h2,
        .tiptap-editor h3,
        .tiptap-editor h4,
        .tiptap-editor h5,
        .tiptap-editor h6,
        .tiptap-editor pre {
          padding-left: 24px;
          margin-top: 0;
        }
        .tiptap-editor ul,
        .tiptap-editor ol {
          padding-left: 24px;
          margin-top: 0;
          list-style-position: inside;
        }
        .drag-handle:hover {
          color: #3b82f6;
          background: #eff6ff;
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
        }
        .drag-handle:active {
          cursor: grabbing;
          color: #2563eb;
          background: #dbeafe;
          transform: scale(1.05);
          box-shadow: 0 1px 4px rgba(59, 130, 246, 0.3);
        }
        .drag-handle svg {
          width: 16px;
          height: 16px;
          transition: all 0.15s ease;
        }
        .drag-handle:hover svg {
          stroke-width: 2.5;
        }
        .dragging {
          opacity: 0.5;
          background: #f3f4f6;
        }
      `}</style>

      {showToolbar && <Toolbar editor={editor} insertTable={insertTable} />}
      <TableToolbar editor={editor} show={isTableSelected} />
      <CodeBlockLanguageDropdown editor={editor} hasCodeBlock={hasCodeBlock} />
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="tiptap-editor" 
          data-testid={dataTestId}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isDragging && targetBlockRef.current !== null && dropPosition !== null && (
          <DropIndicator 
            editor={editor}
            targetBlock={targetBlockRef.current}
            position={dropPosition}
          />
        )}
      </div>

      {!hasContent && !isFocused && (
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
      
      {isDragging && (
        <div 
          className="drag-ghost"
          style={{
            left: dragGhostPosition.x,
            top: dragGhostPosition.y,
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 1000,
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '13px',
            color: '#374151',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {editorRef.current && draggingPosRef.current !== null && (
            <>
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              {editorRef.current.state.doc.nodeAt(draggingPosRef.current)?.textContent?.substring(0, 50) || 'Block'}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { DocumentOutline };
export default memo(RichTextEditorClient);
