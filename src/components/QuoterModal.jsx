import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Stamp,
  Sparkles,
  PenTool,
  ImageOff,
  ShoppingBag,
} from 'lucide-react';
import { formatCurrency, calcularPrecio, calcularDescuento, formatNumber } from '../utils/helpers';

export default function QuoterModal({ isOpen, onClose, producto, onAddToCart }) {
  const [cantidad, setCantidad] = useState(1);
  const [cantidadInput, setCantidadInput] = useState('1');
  const [personalizado, setPersonalizado] = useState(false);
  const [requiereDiseno, setRequiereDiseno] = useState(false);
  const [imgError, setImgError] = useState(false);

  const esPersonalizable = producto?.esPersonalizable !== undefined ? producto.esPersonalizable : true;
  const esSoloPersonalizado = Boolean(
    producto?.soloPersonalizado ||
    (esPersonalizable && (producto?.precioSinPersonalizar === 0 || producto?.nombre?.toLowerCase().includes('cliente trae')))
  );

  const tieneEstampado = esPersonalizable && producto?.configEstampado?.tamanos?.length > 0;
  const [estampadoPrincipal, setEstampadoPrincipal] = useState(null);
  const [estampadosAdicionales, setEstampadosAdicionales] = useState([]);

  useEffect(() => {
    if (isOpen && producto) {
      setCantidad(1);
      setCantidadInput('1');
      setPersonalizado(esSoloPersonalizado ? true : false);
      setRequiereDiseno(false);
      setEstampadosAdicionales([]);
      setImgError(false);

      if (esPersonalizable && producto.configEstampado?.tamanos?.length > 0) {
        setEstampadoPrincipal(producto.configEstampado.tamanos[0]);
      } else {
        setEstampadoPrincipal(null);
      }
    }
  }, [isOpen, producto, esPersonalizable, esSoloPersonalizado]);

  const resultado = useMemo(
    () => calcularPrecio(producto, cantidad, esPersonalizable ? personalizado : false, estampadoPrincipal, estampadosAdicionales, requiereDiseno),
    [producto, cantidad, personalizado, esPersonalizable, estampadoPrincipal, estampadosAdicionales, requiereDiseno]
  );

  const escalasARenderizar = useMemo(() => {
    if (!producto) return [];

    if (personalizado && estampadoPrincipal) {
      if (estampadoPrincipal.escalas && estampadoPrincipal.escalas.length > 0) {
        return estampadoPrincipal.escalas.map((esc) => ({
          minUnidades: esc.minUnidades,
          maxUnidades: esc.maxUnidades,
          precioEscala: esc.precio,
          precioBase1Ud: estampadoPrincipal.precioPrincipal || producto.precioPersonalizado,
        }));
      }

      if (estampadoPrincipal.precioMayoreo && estampadoPrincipal.precioMayoreo > 0) {
        const p1Ud = estampadoPrincipal.precioPrincipal || producto.precioPersonalizado;
        const p3Uds = estampadoPrincipal.precioMayoreo;
        return [
          { minUnidades: 1, maxUnidades: 2, precioEscala: p1Ud, precioBase1Ud: p1Ud },
          { minUnidades: 3, maxUnidades: 999, precioEscala: p3Uds, precioBase1Ud: p1Ud },
        ];
      }
    }

    if (producto.escalasVolumen && producto.escalasVolumen.length > 0) {
      return producto.escalasVolumen.map((escala) => {
        let precioEscala = escala.precioSinPersonalizar;
        let precioBase1Ud = producto.precioSinPersonalizar;

        if (personalizado) {
          precioBase1Ud = estampadoPrincipal?.precioPrincipal || producto.precioPersonalizado;
          const pRefSinVol = producto.precioPersonalizado || precioBase1Ud;
          const descuentoPesos = Math.max(0, pRefSinVol - (escala.precioPersonalizado || pRefSinVol));
          precioEscala = Math.max(0, precioBase1Ud - descuentoPesos);
        }

        return {
          minUnidades: escala.minUnidades,
          maxUnidades: escala.maxUnidades,
          precioEscala,
          precioBase1Ud,
        };
      });
    }

    return [];
  }, [producto, personalizado, estampadoPrincipal]);

  const descuento = calcularDescuento(
    resultado.precioBaseOriginal,
    resultado.precioUnitarioBase || resultado.precioUnitario
  );

  const handleCantidadChange = (value) => {
    const cleaned = value.replace(/[^\d]/g, '');
    setCantidadInput(cleaned);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0) {
      setCantidad(num);
    } else if (cleaned === '') {
      setCantidad(0);
    }
  };

  const handleCantidadBlur = () => {
    if (cantidad <= 0) {
      setCantidad(1);
      setCantidadInput('1');
    } else {
      setCantidadInput(formatNumber(cantidad));
    }
  };

  const addEstampadoAdicional = () => {
    if (!tieneEstampado) return;
    const primerTamano = producto.configEstampado.tamanos[0];
    setEstampadosAdicionales((prev) => [
      ...prev,
      {
        tamanoId: primerTamano.id,
        nombre: primerTamano.nombre,
        precioAdicional: primerTamano.precioAdicional || primerTamano.precio || 0,
      },
    ]);
  };

  const updateEstampadoAdicional = (index, tamanoId) => {
    const tamano = producto.configEstampado.tamanos.find((t) => t.id === tamanoId);
    if (!tamano) return;
    setEstampadosAdicionales((prev) => {
      const next = [...prev];
      next[index] = {
        tamanoId: tamano.id,
        nombre: tamano.nombre,
        precioAdicional: tamano.precioAdicional || tamano.precio || 0,
      };
      return next;
    });
  };

  const removeEstampadoAdicional = (index) => {
    setEstampadosAdicionales((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const isActuallyPersonalized = esPersonalizable && personalizado;
    const itemConfigured = {
      cartItemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productoId: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      imagen: producto.imagen,
      moneda: producto.moneda || 'COP',
      cantidad: cantidad > 0 ? cantidad : 1,
      personalizado: isActuallyPersonalized,
      estampadoPrincipal: isActuallyPersonalized ? estampadoPrincipal : null,
      estampadosAdicionales: isActuallyPersonalized ? estampadosAdicionales : [],
      requiereDiseno: isActuallyPersonalized ? requiereDiseno : false,
      costoDiseno: isActuallyPersonalized ? resultado.costoDiseno : 0,
      precioUnitario: resultado.precioUnitario,
      precioTotal: resultado.precioTotal,
    };

    onAddToCart(itemConfigured);
    onClose();
  };

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl animate-slideUp flex flex-col max-h-[92vh] overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Info del Producto */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-100 bg-surface-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-surface-200 overflow-hidden shrink-0 border border-surface-200">
              {!imgError && producto.imagen ? (
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-surface-400">
                  <ImageOff className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-surface-900 truncate">
                  {producto.nombre}
                </h3>
                {producto.categoria && (
                  <span className="px-2 py-0.5 bg-surface-200 text-surface-700 text-[10px] font-semibold rounded-md shrink-0">
                    {producto.categoria}
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-500 mt-0.5">
                {esPersonalizable ? (
                  esSoloPersonalizado ? (
                    <>
                      Personalizado: <strong className="text-primary-600">{formatCurrency(producto.precioPersonalizado, producto.moneda)}</strong>
                    </>
                  ) : (
                    <>
                      Base: <strong className="text-surface-800">{formatCurrency(producto.precioSinPersonalizar, producto.moneda)}</strong>
                      {'  •  '}
                      Personalizado: <strong className="text-primary-600">{formatCurrency(producto.precioPersonalizado, producto.moneda)}</strong>
                    </>
                  )
                ) : (
                  <>
                    Precio: <strong className="text-surface-900">{formatCurrency(producto.precioSinPersonalizar, producto.moneda)}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-200 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body interactivo del Cotizador */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
          {/* Tipo de producto (Selector solo si es personalizable y NO es soloPersonalizado) */}
          {esPersonalizable && !esSoloPersonalizado && (
            <div>
              <label className="text-xs font-semibold text-surface-600 mb-2 block uppercase tracking-wider">
                1. Selecciona Tipo de Producto
              </label>
              <div className="grid grid-cols-2 gap-2 bg-surface-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setPersonalizado(false);
                    setEstampadosAdicionales([]);
                    setRequiereDiseno(false);
                  }}
                  className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    !personalizado
                      ? 'bg-white text-surface-900 shadow-md'
                      : 'text-surface-500 hover:text-surface-800'
                  }`}
                >
                  Sin personalizar
                </button>
                <button
                  type="button"
                  onClick={() => setPersonalizado(true)}
                  className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    personalizado
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'text-surface-500 hover:text-surface-800'
                  }`}
                >
                  Personalizado
                </button>
              </div>
            </div>
          )}

          {/* Input cantidad */}
          <div>
            <label className="text-xs font-semibold text-surface-600 mb-2 block uppercase tracking-wider">
              {esPersonalizable && !esSoloPersonalizado ? '2. Cantidad Requerida' : 'Cantidad Requerida'}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={cantidadInput}
                onChange={(e) => handleCantidadChange(e.target.value)}
                onBlur={handleCantidadBlur}
                className="flex-1 px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-base font-bold text-surface-900 text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                placeholder="Ej: 50"
              />
              <div className="flex gap-1.5">
                {[1, 10, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCantidad(num);
                      setCantidadInput(String(num));
                    }}
                    className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      cantidad === num
                        ? 'bg-surface-900 text-white border-surface-900'
                        : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Opciones de Estampado si aplica */}
          {tieneEstampado && personalizado && (
            <div className="space-y-4 pt-2 border-t border-surface-100">
              {/* Estampado Principal */}
              <div>
                <label className="text-xs font-bold text-surface-700 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  {producto.configEstampado?.titulo || 'Elige la Opción / Servicio Principal'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {producto.configEstampado.tamanos.map((t) => {
                    const isSelected = estampadoPrincipal?.id === t.id;
                    const esAlPorMayor = cantidad >= 3 && t.precioMayoreo && t.precioMayoreo > 0;
                    const precioBaseTamano = esAlPorMayor
                      ? t.precioMayoreo
                      : (t.precioPrincipal || t.precio || producto.precioPersonalizado);

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEstampadoPrincipal(t)}
                        className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20'
                            : 'bg-white text-surface-700 border-surface-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">{t.nombre}</span>
                          {esAlPorMayor && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-accent-100 text-accent-700 rounded-md">
                              (3+ uds)
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-extrabold mt-1 ${isSelected ? 'text-white' : 'text-primary-600'}`}>
                          {formatCurrency(precioBaseTamano, producto.moneda)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opciones / Servicios Extras */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-surface-700 flex items-center gap-1.5">
                    <Stamp className="w-4 h-4 text-surface-400" />
                    {producto.categoria?.toLowerCase().includes('servicio') ? 'Servicios / Trabajos Adicionales' : 'Opciones / Estampados Adicionales (Extras)'}
                  </label>
                  <button
                    type="button"
                    onClick={addEstampadoAdicional}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Agregar Extra
                  </button>
                </div>

                {estampadosAdicionales.length === 0 ? (
                  <p className="text-xs text-surface-400 italic py-2 text-center bg-surface-50 rounded-xl border border-dashed border-surface-200">
                    {producto.categoria?.toLowerCase().includes('servicio')
                      ? '¿Requiere algún servicio o reparación adicional? Presiona "+ Agregar Extra"'
                      : '¿Quieres opciones o estampados extras? Presiona "+ Agregar Extra"'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {estampadosAdicionales.map((est, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl p-2.5 animate-scaleIn"
                      >
                        <span className="text-xs font-bold text-surface-400 w-5 text-center">
                          +{i + 1}
                        </span>
                        <select
                          value={est.tamanoId}
                          onChange={(e) => updateEstampadoAdicional(i, e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-surface-200 rounded-lg text-xs font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                          {producto.configEstampado.tamanos.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombre} (+{formatCurrency(t.precioAdicional || t.precio || 0, producto.moneda)})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeEstampadoAdicional(i)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-danger-500 hover:bg-danger-50 transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Elaboración de diseño */}
              <div className="pt-1">
                <label className="flex items-center gap-3 p-3.5 bg-surface-50 border border-surface-200 hover:border-primary-300 rounded-2xl cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={requiereDiseno}
                    onChange={(e) => setRequiereDiseno(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-surface-800 flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-primary-500" />
                      ¿Requiere elaboración de diseño?
                    </span>
                    <span className="text-xs font-bold text-primary-600">+ $25.000 (Único)</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Tabla de Escalas de Volumen */}
          {escalasARenderizar.length > 0 && (
            <div className="pt-2 border-t border-surface-100">
              <label className="text-xs font-semibold text-surface-600 mb-2 block uppercase tracking-wider">
                Precios por Volumen {personalizado && estampadoPrincipal ? `para "${estampadoPrincipal.nombre}"` : ''}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {escalasARenderizar.map((escala, i) => {
                  const isActive =
                    resultado.escalaAplicada &&
                    escala.minUnidades === resultado.escalaAplicada.minUnidades;

                  const desc = calcularDescuento(escala.precioBase1Ud, escala.precioEscala);

                  return (
                    <div
                      key={i}
                      className={`flex flex-col p-3 rounded-2xl border text-xs transition-all ${
                        isActive
                          ? 'bg-primary-50 border-primary-300 text-primary-900 shadow-sm'
                          : 'bg-white border-surface-200 text-surface-600'
                      }`}
                    >
                      <span className="text-[11px] font-medium text-surface-500">
                        {escala.minUnidades} - {escala.maxUnidades === 999 ? '∞' : escala.maxUnidades} uds
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-sm font-extrabold ${isActive ? 'text-primary-700' : 'text-surface-900'}`}>
                          {formatCurrency(escala.precioEscala, producto.moneda)}
                        </span>
                        {desc > 0 && (
                          <span className="px-1.5 py-0.5 bg-accent-100 text-accent-700 text-[10px] font-bold rounded-md">
                            -{desc}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Desglose y Total */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-surface-800 to-surface-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            {esPersonalizable && personalizado && tieneEstampado && (
              <div className="text-xs text-surface-300 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>Base: <strong>{formatCurrency(resultado.precioUnitarioBase, producto.moneda)}</strong></span>
                {resultado.costoEstampadosAdicionales > 0 && (
                  <span>Extras: <strong className="text-accent-300">+{formatCurrency(resultado.costoEstampadosAdicionales, producto.moneda)}/ud</strong></span>
                )}
                {resultado.costoDiseno > 0 && (
                  <span>Diseño: <strong className="text-primary-300">+$25.000</strong></span>
                )}
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-surface-400">Unitario:</span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(resultado.precioUnitario, producto.moneda)}
              </span>
              {descuento > 0 && (
                <span className="text-[11px] text-accent-300 font-semibold">
                  (-{descuento}% vol)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <div className="text-right">
              <span className="text-[10px] text-surface-400 block uppercase tracking-wider">
                Total ({formatNumber(cantidad)} uds)
              </span>
              <span className="text-xl font-black text-white">
                {formatCurrency(resultado.precioTotal, producto.moneda)}
              </span>
            </div>

            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              + Añadir a la Cotización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
