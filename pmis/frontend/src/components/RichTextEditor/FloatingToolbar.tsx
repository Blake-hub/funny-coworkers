import { memo, type ReactNode } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Code, Link2 } from 'lucide-react';

interface FloatingToolbarProps {
  show: boolean;
  position: { x: number; y: number };
  editor: {
    isActive: (name: string) => boolean;
    chain: () => {
      focus: () => {
        toggleBold: () => { run: () => void };
        toggleItalic: () => { run: () => void };
        toggleUnderline: () => { run: () => void };
        toggleHeading: (options: { level: number }) => { run: () => void };
        toggleBulletList: () => { run: () => void };
        toggleOrderedList: () => { run: () => void };
        toggleCode: () => { run: () => void };
        extendMarkRange: (name: string) => { toggleLink: () => { run: () => void } };
      };
    };
  };
}

function FloatingToolbarComponent({ show, position, editor }: FloatingToolbarProps): ReactNode {
  if (!show || !editor) return null;

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
}

export const FloatingToolbar = memo(FloatingToolbarComponent);
