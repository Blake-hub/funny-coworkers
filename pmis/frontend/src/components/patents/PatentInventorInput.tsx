import { useState } from 'react';
import { X } from 'lucide-react';

interface PatentInventorInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

/** Tag-style inventor name input: type a name, press Enter to add. */
export default function PatentInventorInput({ value, onChange, placeholder }: PatentInventorInputProps) {
  const [input, setInput] = useState('');

  const addCurrent = () => {
    const name = input.trim();
    if (!name || value.includes(name)) {
      setInput('');
      return;
    }
    onChange([...value, name]);
    setInput('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full min-h-[34px] px-2 py-1.5 border border-gray-200 rounded focus-within:border-gray-400">
      {value.map((name) => (
        <span
          key={name}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
        >
          {name}
          <button
            type="button"
            onClick={() => onChange(value.filter((n) => n !== name))}
            className="text-gray-400 hover:text-gray-600"
            aria-label={`Remove ${name}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        placeholder={value.length === 0 ? placeholder : ''}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addCurrent();
          } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={addCurrent}
        className="flex-1 min-w-[120px] border-0 focus:ring-0 focus:outline-none text-sm"
      />
    </div>
  );
}
