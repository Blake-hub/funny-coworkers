import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, LayoutGrid, Square, Layout, Minus } from 'lucide-react';

interface TableToolbarProps {
  editor: any;
  show: boolean;
}

export const TableToolbar = memo(({ editor, show }: TableToolbarProps) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!show || !editor) return;

    const editorContainer = document.querySelector('.tiptap-editor') as HTMLElement;
    if (!editorContainer) return;

    const tableElement = editorContainer.querySelector('table') as HTMLElement;
    if (!tableElement) return;

    const containerRect = editorContainer.getBoundingClientRect();
    const tableRect = tableElement.getBoundingClientRect();

    setPosition({
      top: tableRect.top - containerRect.top - 50,
      left: tableRect.left - containerRect.left,
    });
  }, [show, editor]);

  useEffect(() => {
    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [updatePosition]);

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
