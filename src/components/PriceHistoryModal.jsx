import { useState, useEffect } from 'react';
import { X, History, User, Calendar, Tag, Palette, TrendingUp, TrendingDown, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate, getCategoryLabels } from '../utils/helpers';

export default function PriceHistoryModal({ isOpen, onClose, producto }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  if (!isOpen || !producto) return null;

  const labels = getCategoryLabels(producto.categoria);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const historial = producto.historialPrecios || [];
  const esPersonalizable = producto.esPersonalizable !== undefined ? producto.esPersonalizable : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-surface-950/60 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-surface-200/80 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-200 ${
          isClosing ? 'animate-fadeOut scale-95' : 'animate-scaleIn scale-100'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-surface-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-accent-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Historial de Cambios de Precio
              </h2>
              <p className="text-xs text-surface-400 truncate max-w-[260px] sm:max-w-xs">
                {producto.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen de Última Modificación */}
        <div className="p-4 bg-surface-50 border-b border-surface-200/60 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-surface-600">
            <Calendar className="w-3.5 h-3.5 text-primary-500" />
            <span>Última actualización:</span>
            <strong className="text-surface-900 font-semibold">
              {formatDate(producto.ultimaActualizacion)}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-surface-200 text-surface-700 font-medium">
            <User className="w-3 h-3 text-accent-600" />
            <span>Responsable:</span>
            <strong className="text-surface-900">{producto.responsable || 'Administrador'}</strong>
          </div>
        </div>

        {/* Lista del Historial */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {historial.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-surface-100 text-surface-400 flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-surface-800 mb-1">Sin historial previo</h4>
              <p className="text-xs text-surface-500 max-w-sm mx-auto">
                No hay modificaciones anteriores registradas. Los cambios futuros que realices en el precio se registrarán aquí con su responsable y fecha.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div
                    key={entry.id || index}
                    className="p-3.5 bg-white rounded-xl border border-surface-200/80 shadow-sm hover:border-primary-200 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-surface-100">
                      <div className="flex items-center gap-1.5 text-surface-700 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-surface-400" />
                        <span>{formatDate(entry.fecha)}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-surface-100 text-surface-800 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <User className="w-3 h-3 text-primary-500" />
                        <span>{entry.responsable || 'Administrador'}</span>
                      </div>
                    </div>

                    {entry.motivo && (
                      <p className="text-[11px] text-surface-600 mb-2 italic bg-surface-50 p-1.5 rounded border border-surface-100">
                        💬 "{entry.motivo}"
                      </p>
                    )}

                    {/* Comparación de Precios */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Precio Sin Personalizar / Base */}
                      <div className="p-2 bg-surface-50 rounded-lg border border-surface-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-surface-600">
                          <Tag className="w-3 h-3 text-surface-400" />
                          <span>{labels.base}:</span>
                        </div>
                        <span className="font-bold text-surface-900">
                          {formatCurrency(entry.precioSinPersonalizar, producto.moneda)}
                        </span>
                      </div>

                      {/* Precio Personalizado */}
                      {esPersonalizable && (
                        <div className="p-2 bg-primary-50/50 rounded-lg border border-primary-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-primary-700">
                            <Palette className="w-3 h-3 text-primary-400" />
                            <span>{labels.personalizado}:</span>
                          </div>
                          <span className="font-bold text-primary-700">
                            {formatCurrency(entry.precioPersonalizado, producto.moneda)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-50 border-t border-surface-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-surface-500">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-500" />
            <span>Registro de auditoría activo</span>
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-surface-800 hover:bg-surface-900 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
