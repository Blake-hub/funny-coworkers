import { useEffect, useState, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
  style?: React.CSSProperties;
}

function RichTextEditorClient({ value, onChange, placeholder, className, onBlur, style }: RichTextEditorProps) {
  const { useEditor, EditorContent } = require('@tiptap/react');
  const StarterKit = require('@tiptap/starter-kit').default;
  const Image = require('@tiptap/extension-image').default;
  const CodeBlock = require('@tiptap/extension-code-block').default;
  const Color = require('@tiptap/extension-color').default;
  const { TextStyle } = require('@tiptap/extension-text-style');
  const Link = require('@tiptap/extension-link').default;
  const UnderlineExtension = require('@tiptap/extension-underline').default;
  const {
    Bold,
    Italic,
    UnderlineIcon,
    Strikethrough,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Code,
    Link2,
    ImageIcon,
    Type,
    FileText,
    AtSign,
    Search,
  } = require('lucide-react');

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0, maxHeight: 520 });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const selectedIndexRef = useRef(0);
  const menuVisibleRef = useRef(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 0, y: 0 });
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);

  const slashCommands = [
    { id: 'bold', label: 'Bold', icon: Bold, command: 'toggleBold', group: 'text' },
    { id: 'italic', label: 'Italic', icon: Italic, command: 'toggleItalic', group: 'text' },
    { id: 'underline', label: 'Underline', icon: UnderlineIcon, command: 'toggleUnderline', group: 'text' },
    { id: 'strike', label: 'Strikethrough', icon: Strikethrough, command: 'toggleStrike', group: 'text' },
    { id: 'h1', label: 'Heading 1', icon: Heading1, command: 'toggleHeading', params: { level: 1 }, group: 'heading' },
    { id: 'h2', label: 'Heading 2', icon: Heading2, command: 'toggleHeading', params: { level: 2 }, group: 'heading' },
    { id: 'bulletList', label: 'Bullet List', icon: List, command: 'toggleBulletList', group: 'list' },
    { id: 'orderedList', label: 'Ordered List', icon: ListOrdered, command: 'toggleOrderedList', group: 'list' },
    { id: 'code', label: 'Inline Code', icon: Code, command: 'toggleCode', group: 'code' },
    { id: 'codeBlock', label: 'Code Block', icon: Type, command: 'toggleCodeBlock', group: 'code' },
    { id: 'link', label: 'Insert Link', icon: Link2, command: 'insertLink', group: 'insert' },
    { id: 'image', label: 'Insert Image', icon: ImageIcon, command: 'insertImage', group: 'insert' },
    { id: 'file', label: 'Attach File', icon: FileText, command: 'attachFile', group: 'insert' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
      }),
      Image.configure({ inline: true }),
      CodeBlock,
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
      UnderlineExtension,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML());
      setHasContent(editor.getText().trim().length > 0);
    },
    onSelectionUpdate: ({ editor }: { editor: any }) => {
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
    },
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
    const handleClickOutside = (e: MouseEvent) => {
      if (menuVisibleRef.current && slashMenuRef.current) {
        if (!slashMenuRef.current.contains(e.target as Node)) {
          menuVisibleRef.current = false;
          setShowSlashMenu(false);
          setMenuVisible(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return;
      
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
            setMenuVisible(true);
          }
        }
      }
      
      if (e.key === 'Escape') {
        menuVisibleRef.current = false;
        setShowSlashMenu(false);
        setMenuVisible(false);
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
          setMenuVisible(false);
          return;
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.slash-menu') && !target.closest('.tiptap-editor')) {
        menuVisibleRef.current = false;
        setShowSlashMenu(false);
        setMenuVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor, menuVisible]);

  const executeCommand = (command: string, params?: any) => {
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
  };

  const handleImageUpload = () => {
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
  };

  const handleLinkInsert = () => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setShowLinkModal(false);
      setLinkUrl('');
    }
  };

  if (!editor) return null;

  return (
    <div 
      ref={editorContainerRef}
      className={`relative rounded-lg overflow-hidden focus:outline-none focus:border-transparent focus:ring-0 ${className}`} 
      style={{ outline: 'none !important', boxShadow: 'none !important', border: 'none !important', cursor: 'text', ...style }}
    >
      <style>{`
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
          top: 8px;
          left: 8px;
          color: #9ca3af;
          pointer-events: none;
          user-select: none;
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
          margin: 0;
          line-height: 1.5;
        }
        .tiptap-editor strong {
          font-weight: bold;
        }
        .tiptap-editor em {
          font-style: italic;
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

      <EditorContent editor={editor} className="tiptap-editor" />

      {!hasContent && !editor.getText().trim() && (
        <div className="editor-placeholder">{placeholder || 'Start typing...'}</div>
      )}

      {showSlashMenu && (
        <div
          ref={slashMenuRef}
          className="slash-menu"
          style={{
            left: slashMenuPosition.x,
            top: slashMenuPosition.y,
            maxHeight: slashMenuPosition.maxHeight,
            overflowY: 'auto',
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 mb-2">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Search commands...</span>
          </div>
          {slashCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              data-command-index={index}
              className={`slash-menu-item ${selectedCommandIndex === index ? 'selected' : ''}`}
              onClick={() => {
                executeCommand(cmd.command, cmd.params);
              }}
            >
              <div className="slash-menu-item-icon">
                <cmd.icon className="w-4 h-4 text-gray-600" />
              </div>
              <span className="slash-menu-item-label">{cmd.label}</span>
            </button>
          ))}
        </div>
      )}

      {showFloatingToolbar && (
        <div
          className="floating-toolbar"
          style={{
            left: floatingToolbarPosition.x,
            top: floatingToolbarPosition.y,
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
            <UnderlineIcon className="w-4 h-4" />
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
            onClick={() => setShowLinkModal(true)}
            title="Insert Link"
          >
            <Link2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-96">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLinkInsert();
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkInsert}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditorClient {...props} />;
}