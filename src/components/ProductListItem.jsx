import { useState } from 'react';
import { Calculator, Edit3, Copy, Trash2, Tag, Palette, FolderOpen, ImageOff, TrendingDown, History } from 'lucide-react';
import { formatCurrency, getCategoryLabels } from '../utils/helpers';

export default function ProductListItem({ producto, onEdit, onDuplicate, onDelete, onQuote, onViewHistory }) {
  const [imgError, setImgError] = useState(false);
  const labels = getCategoryLabels(producto.categoria);
  const esPersonalizable = producto.esPersonalizable !== undefined ? producto.esPersonalizable : true;

  // Escalas de volumen base (reglas con minUnidades > 1)
  const escalasBase = (producto.escalasVolumen || []).filter((e) => {
    if (e.minUnidades <= 1) return false;
    const pBase = producto.precioSinPersonalizar || 0;
    return e.precioSinPersonalizar > 0 && (pBase === 0 || e.precioSinPersonalizar < pBase || e.minUnidades > 1);
  });

  // Obtener escalas de volumen reales para el precio personalizado
  let escalasPers = [];
  const primerTamano = producto.configEstampado?.tamanos?.[0];

  if (esPersonalizable && primerTamano) {
    if (primerTamano.escalas && primerTamano.escalas.length > 0) {
      escalasPers = primerTamano.escalas
        .filter((e) => e.minUnidades > 1 && e.precio > 0)
        .map((e) => ({
          minUnidades: e.minUnidades,
          maxUnidades: e.maxUnidades,
          precioPersonalizado: e.precio,
        }));
    } else if (primerTamano.precioMayoreo && primerTamano.precioMayoreo > 0) {
      const minMay = primerTamano.minUnidadesMayoreo || 3;
      escalasPers = [
        {
          minUnidades: minMay,
          maxUnidades: 999,
          precioPersonalizado: primerTamano.precioMayoreo,
        },
      ];
    }
  }

  // Fallback a escalasVolumen generales si no hay en la opción principal
  if (esPersonalizable && escalasPers.length === 0 && producto.escalasVolumen) {
    const pPers = producto.precioPersonalizado || producto.precioSinPersonalizar || 0;
    escalasPers = producto.escalasVolumen.filter((e) => {
      if (e.minUnidades <= 1) return false;
      return e.precioPersonalizado > 0 && (pPers === 0 || e.precioPersonalizado < pPers || e.minUnidades > 1);
    });
  }

  return (
    <div className="group bg-white rounded-2xl border border-surface-200/60 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:border-surface-300 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
      {/* Lado Izquierdo: Imagen + Título + Categoría */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-surface-100 overflow-hidden shrink-0 border border-surface-200/60 mt-0.5 sm:mt-0">
          {!imgError && producto.imagen ? (
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-surface-300">
              <ImageOff className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-sm font-bold text-surface-900 truncate">
              {producto.nombre}
            </h3>
            {producto.categoria && (
              <span className="px-2 py-0.5 bg-surface-100 text-surface-600 text-[10px] font-semibold rounded-md flex items-center gap-1 border border-surface-200/60">
                <FolderOpen className="w-2.5 h-2.5 text-surface-400" />
                {producto.categoria}
              </span>
            )}
          </div>

          {/* Bloque de Precios Ordenados */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-6 gap-y-2 text-xs">
            {esPersonalizable ? (
              <>
                {/* Bloque Base */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1 text-surface-500">
                    <Tag className="w-3 h-3 text-surface-400" />
                    <span>{labels.base}:</span>
                    <strong className="text-surface-800 font-semibold">
                      {formatCurrency(producto.precioSinPersonalizar, producto.moneda)}
                    </strong>
                  </div>
                  {escalasBase.map((escala, i) => (
                    <span
                      key={`b-${i}`}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-100 text-surface-700 text-[10px] font-bold rounded-md border border-surface-200/60"
                    >
                      <TrendingDown className="w-2.5 h-2.5 text-surface-400" />
                      {escala.minUnidades}+ {formatCurrency(escala.precioSinPersonalizar, producto.moneda)}
                    </span>
                  ))}
                </div>

                {/* Bloque Personalizado */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1 text-surface-500">
                    <Palette className="w-3 h-3 text-primary-400" />
                    <span>{labels.personalizado}:</span>
                    <strong className="text-primary-600 font-bold">
                      {formatCurrency(producto.precioPersonalizado, producto.moneda)}
                    </strong>
                  </div>
                  {escalasPers.map((escala, i) => (
                    <span
                      key={`p-${i}`}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-md border border-primary-200/60"
                    >
                      <TrendingDown className="w-2.5 h-2.5 text-primary-400" />
                      {escala.minUnidades}+ {formatCurrency(escala.precioPersonalizado, producto.moneda)}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 text-surface-500">
                  <Tag className="w-3 h-3 text-surface-400" />
                  <span>Precio:</span>
                  <strong className="text-surface-900 font-extrabold text-sm">
                    {formatCurrency(producto.precioSinPersonalizar, producto.moneda)}
                  </strong>
                </div>
                {escalasBase.map((escala, i) => (
                  <span
                    key={`b-${i}`}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-100 text-surface-700 text-[10px] font-bold rounded-md border border-surface-200/60"
                  >
                    <TrendingDown className="w-2.5 h-2.5 text-surface-400" />
                    {escala.minUnidades}+ {formatCurrency(escala.precioSinPersonalizar, producto.moneda)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lado Derecho: Botones de Acción */}
      <div className="flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-100">
        <button
          onClick={() => onQuote(producto)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-500/20 transition-all cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5" />
          Cotizar
        </button>

        <button
          onClick={() => onViewHistory(producto)}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-surface-50 hover:bg-accent-50 text-surface-600 hover:text-accent-700 border border-surface-200 hover:border-accent-200 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
          title="Ver historial de cambios"
        >
          <History className="w-4 h-4" />
        </button>

        {onDuplicate && (
          <button
            onClick={() => onDuplicate(producto)}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-surface-50 hover:bg-accent-50 text-surface-600 hover:text-accent-600 border border-surface-200 hover:border-accent-200 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Duplicar producto"
          >
            <Copy className="w-4 h-4 text-accent-600" />
          </button>
        )}

        <button
          onClick={() => onEdit(producto)}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-surface-50 hover:bg-primary-50 text-surface-600 hover:text-primary-600 border border-surface-200 hover:border-primary-200 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
          title="Editar producto"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(producto.id)}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-surface-50 hover:bg-danger-50 text-surface-600 hover:text-danger-600 border border-surface-200 hover:border-danger-200 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
          title="Eliminar producto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
