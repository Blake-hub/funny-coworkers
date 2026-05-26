import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { Toast, useToast } from '@/context/ToastContext';

interface ToastItemProps {
  toast: Toast;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
};

export default function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();
  const Icon = icons[toast.type];

  return (
    <div
      className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100 min-w-[280px] max-w-[350px] animate-slide-in"
      style={{
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <div className={`${colors[toast.type]} p-2 rounded-full`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-gray-700 text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span className="text-sm">&times;</span>
      </button>
    </div>
  );
}