import { useState } from 'react';
import {
  Edit3,
  Copy,
  Trash2,
  Calculator,
  Tag,
  Palette,
  ImageOff,
  FolderOpen,
  Stamp,
  TrendingDown,
  History,
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function ProductCard({ producto, onEdit, onDuplicate, onDelete, onQuote, onViewHistory }) {
  const [imgError, setImgError] = useState(false);
  const esPersonalizable = producto.esPersonalizable !== undefined ? producto.esPersonalizable : true;
  const tieneEstampado = esPersonalizable && producto.configEstampado?.tamanos?.length > 0;

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
    <div className="group bg-white rounded-2xl border border-surface-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-surface-300/60 transition-all duration-300 overflow-hidden animate-scaleIn flex flex-col">
      {/* Imagen */}
      <div
        className="relative aspect-square bg-surface-100 overflow-hidden cursor-pointer"
        onClick={() => onQuote(producto)}
      >
        {!imgError && producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-surface-300">
            <ImageOff className="w-12 h-12 mb-2" strokeWidth={1.5} />
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}

        {/* Badge de categoría */}
        {producto.categoria && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-surface-700 text-[10px] font-semibold rounded-lg shadow-sm flex items-center gap-1">
            <FolderOpen className="w-3 h-3 text-surface-400" />
            {producto.categoria}
          </div>
        )}

        {/* Badge de estampado disponible */}
        {tieneEstampado && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-primary-500/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded-lg shadow-sm flex items-center gap-1">
            <Stamp className="w-3 h-3" />
            Estampados
          </div>
        )}

        {/* Botones de acción destacados */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory(producto);
            }}
            className="w-8 h-8 bg-white text-surface-700 hover:text-accent-700 border border-surface-200 rounded-xl flex items-center justify-center shadow-lg hover:bg-accent-50 active:scale-90 transition-all cursor-pointer"
            title="Ver historial de precios"
          >
            <History className="w-4 h-4" />
          </button>

          {onDuplicate && (
            <button
              id={`duplicate-${producto.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(producto);
              }}
              className="w-8 h-8 bg-white text-accent-600 border border-accent-200 rounded-xl flex items-center justify-center shadow-lg hover:bg-accent-50 active:scale-90 transition-all cursor-pointer"
              title="Duplicar producto"
            >
              <Copy className="w-4 h-4 text-accent-600" strokeWidth={2} />
            </button>
          )}

          <button
            id={`edit-${producto.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(producto);
            }}
            className="w-8 h-8 bg-white text-primary-600 border border-primary-100 rounded-xl flex items-center justify-center shadow-lg hover:bg-primary-50 active:scale-90 transition-all cursor-pointer"
            title="Editar producto"
          >
            <Edit3 className="w-4 h-4 text-primary-600" strokeWidth={2.5} />
          </button>

          <button
            id={`delete-${producto.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(producto.id);
            }}
            className="w-8 h-8 bg-white text-danger-600 border border-danger-100 rounded-xl flex items-center justify-center shadow-lg hover:bg-danger-50 active:scale-90 transition-all cursor-pointer"
            title="Eliminar producto"
          >
            <Trash2 className="w-4 h-4 text-danger-600" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-surface-900 line-clamp-2 leading-snug mb-3">
            {producto.nombre}
          </h3>

          {/* Bloques de Precios y Etiquetas */}
          <div className="space-y-2.5 mb-4">
            {esPersonalizable ? (
              <>
                {/* 1. Base + Sus etiquetas */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="w-3.5 h-3.5 text-surface-400" strokeWidth={2} />
                    <span className="text-xs text-surface-500">Base:</span>
                    <span className="text-sm font-bold text-surface-800">
                      {formatCurrency(producto.precioSinPersonalizar, producto.moneda)}
                    </span>
                  </div>

                  {escalasBase.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-5">
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

                {/* 2. Personalizado + Sus etiquetas */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Palette className="w-3.5 h-3.5 text-primary-400" strokeWidth={2} />
                    <span className="text-xs text-surface-500">Personalizado:</span>
                    <span className="text-sm font-bold text-primary-600">
                      {formatCurrency(producto.precioPersonalizado, producto.moneda)}
                    </span>
                  </div>

                  {escalasPers.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-5">
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
                  )}
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Tag className="w-3.5 h-3.5 text-surface-400" strokeWidth={2} />
                  <span className="text-xs text-surface-500">Precio:</span>
                  <span className="text-sm font-extrabold text-surface-900">
                    {formatCurrency(producto.precioSinPersonalizar, producto.moneda)}
                  </span>
                </div>

                {escalasBase.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-5">
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
            )}
          </div>
        </div>

        {/* Botón abrir cotizador */}
        <button
          onClick={() => onQuote(producto)}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Calculator className="w-4 h-4" />
          Cotizar Producto
        </button>
      </div>
    </div>
  );
}
