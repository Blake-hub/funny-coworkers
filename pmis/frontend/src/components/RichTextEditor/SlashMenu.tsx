import { memo, forwardRef } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Quote,
  List, ListOrdered, Code, Type, Link2, ImageIcon, FileText, Search
} from 'lucide-react';

export const slashCommands = [
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

export const SlashMenu = memo(SlashMenuComponent);
