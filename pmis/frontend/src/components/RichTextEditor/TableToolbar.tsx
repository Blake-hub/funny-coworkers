import { memo, useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, LayoutGrid, Square, Layout, Minus } from 'lucide-react';

interface TableToolbarProps {
  editor: any;
  show: boolean;
}

export const TableToolbar = memo(({ editor, show }: TableToolbarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!show || !editor) return;

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
