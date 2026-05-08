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
  const {
    Bold,
    Italic,
    Underline,
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
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 0, y: 0 });
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const slashCommands = [
    { id: 'bold', label: 'Bold', icon: Bold, command: 'toggleBold' },
    { id: 'italic', label: 'Italic', icon: Italic, command: 'toggleItalic' },
    { id: 'underline', label: 'Underline', icon: Underline, command: 'toggleUnderline' },
    { id: 'strike', label: 'Strikethrough', icon: Strikethrough, command: 'toggleStrike' },
    { id: 'h1', label: 'Heading 1', icon: Heading1, command: 'toggleHeading', params: { level: 1 } },
    { id: 'h2', label: 'Heading 2', icon: Heading2, command: 'toggleHeading', params: { level: 2 } },
    { id: 'bulletList', label: 'Bullet List', icon: List, command: 'toggleBulletList' },
    { id: 'orderedList', label: 'Ordered List', icon: ListOrdered, command: 'toggleOrderedList' },
    { id: 'code', label: 'Inline Code', icon: Code, command: 'toggleCode' },
    { id: 'codeBlock', label: 'Code Block', icon: Type, command: 'toggleCodeBlock' },
    { id: 'link', label: 'Insert Link', icon: Link2, command: 'insertLink' },
    { id: 'image', label: 'Insert Image', icon: ImageIcon, command: 'insertImage' },
    { id: 'file', label: 'Attach File', icon: FileText, command: 'attachFile' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      CodeBlock,
      Color,
      TextStyle,
      Link.configure({ openOnClick: false }),
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && editor) {
        const selection = editor.state.selection;
        const $from = selection.$from;
        const textBeforeCursor = $from.nodeBefore?.textContent || '';
        const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
        const textAfterLastSpace = textBeforeCursor.substring(lastSpaceIndex + 1);
        
        if (textAfterLastSpace === '/' || textAfterLastSpace === '') {
          e.preventDefault();
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSlashMenuPosition({ x: rect.left, y: rect.bottom + 8 });
            setShowSlashMenu(true);
          }
        }
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.slash-menu') && !target.closest('.tiptap-editor')) {
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor]);

  const executeCommand = (command: string, params?: any) => {
    if (!editor) return;

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
        editor.chain().focus().toggleHeading(params).run();
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
          className="slash-menu fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 w-64"
          style={{ left: slashMenuPosition.x, top: slashMenuPosition.y }}
        >
          <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Commands</p>
          {slashCommands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                onClick={() => executeCommand(cmd.command, cmd.params)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{cmd.label}</span>
              </button>
            );
          })}
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
            <Underline className="w-4 h-4" />
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