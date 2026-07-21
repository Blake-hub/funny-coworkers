import { memo, useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Type, Link2, ImageIcon, FileText,
  Undo, Redo, Highlighter, Table, ChevronDown,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from 'lucide-react';

interface ToolbarProps {
  editor: any;
  insertTable: () => void;
  uploadImage: () => void;
  onLinkClick?: () => void;
}

const HeadingDropdown = memo(({ editor }: { editor: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
      setMenuPosition({ left: rect.left, top: rect.bottom + 4 });
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
    for (const option of headingOptions) {
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
        {currentHeading ? <currentHeading.icon className="w-4 h-4" /> : <Heading1 className="w-4 h-4" />}
        <ChevronDown className="w-3 h-3" />
      </button>
      {isOpen && (
        <div className="toolbar-dropdown-menu" style={{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }}>
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
              <option.icon style={{ width: '16px', height: '16px' }} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const TextAlignDropdown = memo(({ editor }: { editor: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
      setMenuPosition({ left: rect.left, top: rect.bottom + 4 });
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
        <div className="toolbar-dropdown-menu" style={{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }}>
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
              <option.icon style={{ width: '16px', height: '16px' }} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export const Toolbar = memo(({ editor, insertTable, uploadImage, onLinkClick }: ToolbarProps) => {
  if (!editor) return null;

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className={editor.isActive('bold') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </button>
        <button className={editor.isActive('italic') ? 'active' : ''} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </button>
        <button className={editor.isActive('underline') ? 'active' : ''} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <Underline className="w-4 h-4" />
        </button>
        <button className={editor.isActive('strike') ? 'active' : ''} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </button>
        <button className={editor.isActive('highlight') ? 'active' : ''} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
          <Highlighter className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <HeadingDropdown editor={editor} />
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button className={editor.isActive('bulletList') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="w-4 h-4" />
        </button>
        <button className={editor.isActive('orderedList') ? 'active' : ''} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List">
          <ListOrdered className="w-4 h-4" />
        </button>
        <button className={editor.isActive('blockquote') ? 'active' : ''} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          <Quote className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button className={editor.isActive('code') ? 'active' : ''} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">
          <Code className="w-4 h-4" />
        </button>
        <button className={editor.isActive('codeBlock') ? 'active' : ''} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
          <Type className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button onClick={onLinkClick || (() => editor.chain().focus().extendMarkRange('link').toggleLink().run())} title="Insert Link">
          <Link2 className="w-4 h-4" />
        </button>
        <button onClick={uploadImage} title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.click();
        }} title="Attach File">
          <FileText className="w-4 h-4" />
        </button>
        <button onClick={insertTable} title="Insert Table (3x3)">
          <Table className="w-4 h-4" />
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <TextAlignDropdown editor={editor} />

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
          <Undo className="w-4 h-4" />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});