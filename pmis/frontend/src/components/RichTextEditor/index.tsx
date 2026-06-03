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

const Toolbar = memo(({ editor }: { editor: any }) => {
  if (!editor) return null;

  const { 
    Bold, Italic, Underline, Strikethrough, Heading1, Heading2, 
    List, ListOrdered, Quote, Code, Type, Link2, ImageIcon, FileText, 
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Highlighter
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
        </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          className={editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

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
  const Color = require('@tiptap/extension-color').default;
  const { TextStyle } = require('@tiptap/extension-text-style');
  const Link = require('@tiptap/extension-link').default;
  const UnderlineExtension = require('@tiptap/extension-underline').default;
  const Highlight = require('@tiptap/extension-highlight').default;
  const TextAlign = require('@tiptap/extension-text-align').default;
  

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0, maxHeight: 520 });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 0, y: 0 });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [hasContent, setHasContent] = useState(false);

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
    }
    setShowSlashMenu(false);
  }, [editor]);

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
      className={`relative rounded-lg overflow-hidden focus:outline-none focus:border-transparent focus:ring-0 ${className} ${showToolbar ? 'with-toolbar' : ''}`} 
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
        .toolbar button {
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
        .toolbar button:hover {
          background: #e5e7eb;
          color: #1f2937;
        }
        .toolbar button.active {
          background: #d1d5db;
          color: #1f2937;
        }
        .toolbar button:active {
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
        }
        .tiptap-editor th,
        .tiptap-editor td {
          border: 1px solid #e5e7eb;
          padding: 10px 14px;
          text-align: left;
          min-width: 50px;
        }
        .tiptap-editor th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        .tiptap-editor tr:hover td {
          background-color: #f9fafb;
        }
        .tiptap-editor table .selectedCell {
          background-color: #dbeafe;
        }
        .tiptap-editor table .column-resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #3b82f6;
          cursor: col-resize;
          z-index: 10;
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
      `}</style>

      {showToolbar && <Toolbar editor={editor} />}
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