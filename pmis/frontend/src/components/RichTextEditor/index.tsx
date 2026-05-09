import { useState, useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

function RichTextEditorClient({ value, onChange, placeholder, className }: RichTextEditorProps) {
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
  } = require('lucide-react');

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0, maxHeight: 520 });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const selectedIndexRef = useRef(0);
  const menuVisibleRef = useRef(false);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 0, y: 0 });
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

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
          console.log('Selected command:', slashCommands[nextIndex].label);
          
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
          console.log('Selected command:', slashCommands[nextIndex].label);
          
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
          console.log('Enter pressed, executing:', cmd?.label);
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
    console.log('Executing command:', command, 'with params:', params);

    switch (command) {
      case 'toggleBold':
        editor.chain().focus().toggleBold().run();
        console.log('Bold executed');
        break;
      case 'toggleItalic':
        editor.chain().focus().toggleItalic().run();
        console.log('Italic executed');
        break;
      case 'toggleUnderline':
        editor.chain().focus().toggleUnderline().run();
        console.log('Underline executed');
        break;
      case 'toggleStrike':
        editor.chain().focus().toggleStrike().run();
        console.log('Strike executed');
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
        try {
          editor.chain().focus().toggleCode().run();
          console.log('Code executed');
        } catch (error) {
          console.error('Error executing code:', error);
        }
        break;
      case 'toggleCodeBlock':
        try {
          editor.chain().focus().toggleCodeBlock().run();
          console.log('Code block executed');
        } catch (error) {
          console.error('Error executing code block:', error);
        }
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
      className={`relative rounded-lg overflow-hidden focus:outline-none focus:border-transparent focus:ring-0 ${className}`} 
      style={{ outline: 'none !important', boxShadow: 'none !important', border: 'none !important', minHeight: '200px', cursor: 'text' }}
      onClick={() => editor?.chain().focus().run()}
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
          min-height: 200px;
        }
        .editor-placeholder {
          position: absolute;
          top: 16px;
          left: 16px;
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
          font-size: 0.9em;
        }
        .tiptap-editor pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .tiptap-editor pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
      `}</style>
      {!value && (
        <div className="editor-placeholder">{placeholder || 'Start writing...'}</div>
      )}
   <EditorContent
        editor={editor}
        className="min-h-[200px] p-4 outline-none focus:outline-none focus:border-transparent focus:ring-0 prose tiptap-editor relative"
        style={{ outline: 'none !important', boxShadow: 'none !important', border: 'none !important', minHeight: '200px' }}
      />

      {showSlashMenu && (
        <div
          ref={slashMenuRef}
          className="slash-menu fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 w-64 overflow-y-auto"
          style={{ 
            left: slashMenuPosition.x, 
            top: slashMenuPosition.y,
            maxHeight: `${slashMenuPosition.maxHeight || 520}px`
          }}
        >
          {(() => {
            let currentGroup = '';
            let flatIndex = 0;
            return slashCommands.map((cmd) => {
              const Icon = cmd.icon;
              const showDivider = cmd.group !== currentGroup && currentGroup !== '';
              currentGroup = cmd.group;
              
              const isSelected = flatIndex === selectedCommandIndex;
              const currentIndex = flatIndex;
              flatIndex++;
              
              return (
                <div key={cmd.id}>
                  {showDivider && <div className="h-px bg-gray-200 my-1 mx-2" />}
                  <button
                    onClick={() => executeCommand(cmd.command, cmd.params)}
                    className={`w-full flex items-center gap-3 px-3 py-2 transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    data-command-index={currentIndex}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="text-sm">{cmd.label}</span>
                  </button>
                </div>
              );
            });
          })()}
        </div>
      )}

      {showFloatingToolbar && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 flex items-center gap-1 py-1 px-2 z-50"
          style={{
            left: floatingToolbarPosition.x - 100,
            top: floatingToolbarPosition.y,
          }}
        >
          <button
            onClick={() => {
              editor.chain().focus().toggleBold().run();
              setShowFloatingToolbar(false);
            }}
            className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              editor.chain().focus().toggleItalic().run();
              setShowFloatingToolbar(false);
            }}
            className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              editor.chain().focus().toggleUnderline().run();
              setShowFloatingToolbar(false);
            }}
            className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('underline') ? 'bg-gray-100' : ''}`}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button
            onClick={() => {
              editor.chain().focus().toggleCode().run();
              setShowFloatingToolbar(false);
            }}
            className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${editor.isActive('code') ? 'bg-gray-100' : ''}`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setShowLinkModal(true);
              setShowFloatingToolbar(false);
            }}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Insert Link"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              editor.chain().focus().insertContent(`<span class="px-1.5 py-0.5 bg-gray-200 rounded text-sm">@</span>`);
              setShowFloatingToolbar(false);
            }}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Mention"
          >
            <AtSign className="w-4 h-4" />
          </button>
        </div>
      )}

      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
            <h3 className="text-sm font-semibold mb-3">Insert Link</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLinkInsert();
              }}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkInsert}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
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

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing...', className = '' }: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <RichTextEditorClient value={value} onChange={onChange} placeholder={placeholder} className={className} />;
}