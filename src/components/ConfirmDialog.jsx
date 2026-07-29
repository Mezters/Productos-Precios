import { X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slideUp p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-danger-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger-500" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-surface-900 mb-1">
              {title || '¿Eliminar producto?'}
            </h3>
            <p className="text-sm text-surface-500 leading-relaxed">
              {message || 'Esta acción no se puede deshacer. El producto será eliminado permanentemente.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-danger-500/20 transition-all cursor-pointer active:scale-[0.97]"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
