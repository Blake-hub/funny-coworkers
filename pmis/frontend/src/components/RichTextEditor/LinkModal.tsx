import { memo, useState, useEffect } from 'react';

interface LinkModalProps {
  show: boolean;
  onInsert: (url: string) => void;
  onCancel: () => void;
}

export const LinkModal = memo(({ show, onInsert, onCancel }: LinkModalProps) => {
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
