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
import { formatCurrency, calcularPrecio, calcularDescuento, formatNumber, getCategoryLabels } from '../utils/helpers';

export default function QuoterModal({ isOpen, onClose, producto, onAddToCart }) {
  const labels = getCategoryLabels(producto?.categoria);
  const [cantidad, setCantidad] = useState(1);
  const [cantidadInput, setCantidadInput] = useState('1');
  const [personalizado, setPersonalizado] = useState(false);
  const [requiereDiseno, setRequiereDiseno] = useState(false);
  const [precioDisenoCustom, setPrecioDisenoCustom] = useState(25000);
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

      const defDis = producto.precioDiseno !== undefined && producto.precioDiseno !== null && producto.precioDiseno !== ''
        ? Number(producto.precioDiseno)
        : 25000;
      setPrecioDisenoCustom(defDis);

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
    () => calcularPrecio(producto, cantidad, esPersonalizable ? personalizado : false, estampadoPrincipal, estampadosAdicionales, requiereDiseno, precioDisenoCustom),
    [producto, cantidad, personalizado, esPersonalizable, estampadoPrincipal, estampadosAdicionales, requiereDiseno, precioDisenoCustom]
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
        const pMay = estampadoPrincipal.precioMayoreo;
        const minMay = estampadoPrincipal.minUnidadesMayoreo || 3;
        return [
          { minUnidades: 1, maxUnidades: minMay - 1, precioEscala: p1Ud, precioBase1Ud: p1Ud },
          { minUnidades: minMay, maxUnidades: 999, precioEscala: pMay, precioBase1Ud: p1Ud },
        ];
      }
    }

    if (producto.escalasVolumen && producto.escalasVolumen.length > 0) {
      const p1Ud = personalizado
        ? (producto.precioPersonalizado || producto.precioSinPersonalizar)
        : producto.precioSinPersonalizar;

      return producto.escalasVolumen.map((esc) => {
        let precioEsc = personalizado ? esc.precioPersonalizado : esc.precioSinPersonalizar;

        if (personalizado && (!precioEsc || precioEsc === p1Ud)) {
          const descBase = producto.precioSinPersonalizar - esc.precioSinPersonalizar;
          precioEsc = Math.max(0, p1Ud - Math.max(0, descBase));
        }

        return {
          minUnidades: esc.minUnidades,
          maxUnidades: esc.maxUnidades,
          precioEscala: precioEsc || p1Ud,
          precioBase1Ud: p1Ud,
        };
      });
    }

    return [];
  }, [producto, personalizado, estampadoPrincipal]);

  const descuento = useMemo(() => {
    if (!resultado.escalaAplicada) return 0;
    return calcularDescuento(resultado.precioBaseOriginal, resultado.precioUnitarioBase);
  }, [resultado]);

  const handleCantidadChange = (e) => {
    const value = e.target.value;
    setCantidadInput(value);
    const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setCantidad(parsed);
    } else if (value === '') {
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
        minUnidadesMayoreo: primerTamano.minUnidadesMayoreo || 3,
        precioAdicional: primerTamano.precioAdicional || primerTamano.precio || 0,
        precioAdicionalMayoreo: primerTamano.precioAdicionalMayoreo || 0,
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
        minUnidadesMayoreo: tamano.minUnidadesMayoreo || 3,
        precioAdicional: tamano.precioAdicional || tamano.precio || 0,
        precioAdicionalMayoreo: tamano.precioAdicionalMayoreo || 0,
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
      precioDisenoCustom: isActuallyPersonalized && requiereDiseno ? precioDisenoCustom : 0,
      costoDiseno: isActuallyPersonalized ? resultado.costoDiseno : 0,
      precioUnitario: resultado.precioUnitario,
      precioTotal: resultado.precioTotal,
    };

    onAddToCart(itemConfigured);
    onClose();
  };

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-surface-900/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between bg-surface-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 overflow-hidden shrink-0 flex items-center justify-center">
              {!imgError && producto.imagen ? (
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <ImageOff className="w-5 h-5 text-primary-400" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-surface-900 line-clamp-1">
                {producto.nombre}
              </h2>
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <span>{labels.base}: <strong>{formatCurrency(producto.precioSinPersonalizar, producto.moneda)}</strong></span>
                {esPersonalizable && (
                  <>
                    <span>•</span>
                    <span>{labels.personalizado}: <strong className="text-primary-600">{formatCurrency(producto.precioPersonalizado, producto.moneda)}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-100 text-surface-500 hover:text-surface-800 hover:bg-surface-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Selector de Modo: Sin Personalizar vs Personalizado */}
          {esPersonalizable && !esSoloPersonalizado && (
            <div className="grid grid-cols-2 p-1 bg-surface-100 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setPersonalizado(false)}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !personalizado
                    ? 'bg-white text-surface-900 shadow-sm'
                    : 'text-surface-500 hover:text-surface-800'
                }`}
              >
                {labels.sinPersonalizar} ({formatCurrency(producto.precioSinPersonalizar, producto.moneda)})
              </button>
              <button
                type="button"
                onClick={() => setPersonalizado(true)}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  personalizado
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'text-surface-500 hover:text-surface-800'
                }`}
              >
                {labels.personalizado} ({formatCurrency(producto.precioPersonalizado, producto.moneda)})
              </button>
            </div>
          )}

          {/* Selector de Cantidad */}
          <div className="flex items-center justify-between p-3.5 bg-surface-50 border border-surface-200/80 rounded-2xl">
            <span className="text-xs font-bold text-surface-700">Cantidad a cotizar:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const n = Math.max(1, cantidad - 1);
                  setCantidad(n);
                  setCantidadInput(formatNumber(n));
                }}
                className="w-8 h-8 rounded-xl bg-white border border-surface-200 text-surface-700 font-bold hover:bg-surface-100 flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
              >
                -
              </button>

              <input
                type="text"
                inputMode="numeric"
                value={cantidadInput}
                onChange={handleCantidadChange}
                onBlur={handleCantidadBlur}
                className="w-16 py-1.5 bg-white border border-surface-300 rounded-xl text-center text-sm font-extrabold text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />

              <button
                type="button"
                onClick={() => {
                  const n = cantidad + 1;
                  setCantidad(n);
                  setCantidadInput(formatNumber(n));
                }}
                className="w-8 h-8 rounded-xl bg-white border border-surface-200 text-surface-700 font-bold hover:bg-surface-100 flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* Opciones de Estampado / Servicio Principal */}
          {esPersonalizable && personalizado && tieneEstampado && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="text-xs font-bold text-surface-700 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  {producto.configEstampado?.titulo || 'Elige la Opción / Servicio Principal'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {producto.configEstampado.tamanos.map((t) => {
                    const isSelected = estampadoPrincipal?.id === t.id;
                    const minMay = t.minUnidadesMayoreo || 3;
                    const esAlPorMayor = cantidad >= minMay && t.precioMayoreo && t.precioMayoreo > 0;
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
                              ({minMay}+ uds)
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
                          {producto.configEstampado.tamanos.map((t) => {
                            const minMayEst = t.minUnidadesMayoreo || 3;
                            const aplicaExtraMay = cantidad >= minMayEst && t.precioAdicionalMayoreo && t.precioAdicionalMayoreo > 0;
                            const precioExtraMostrar = aplicaExtraMay ? t.precioAdicionalMayoreo : (t.precioAdicional || t.precio || 0);

                            return (
                              <option key={t.id} value={t.id}>
                                {t.nombre} (+{formatCurrency(precioExtraMostrar, producto.moneda)}{aplicaExtraMay ? ` [Mayoreo ${minMayEst}+]` : ''})
                              </option>
                            );
                          })}
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

              {/* Elaboración de diseño (Editable) */}
              <div className="pt-1">
                <div className="p-3.5 bg-surface-50 border border-surface-200 rounded-2xl transition-all space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiereDiseno}
                      onChange={(e) => setRequiereDiseno(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-surface-800 flex items-center gap-1.5 flex-1">
                      <PenTool className="w-4 h-4 text-primary-500" />
                      ¿Requiere elaboración de diseño?
                    </span>
                  </label>

                  {requiereDiseno && (
                    <div className="flex items-center justify-between gap-2 pl-7 pt-2 border-t border-surface-200/60 animate-fadeIn">
                      <span className="text-xs font-medium text-surface-600">Costo de elaboración de diseño:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-primary-600">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={typeof precioDisenoCustom === 'number' ? formatNumber(precioDisenoCustom) : precioDisenoCustom}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, '');
                            setPrecioDisenoCustom(raw ? parseInt(raw, 10) : 0);
                          }}
                          className="w-28 px-2.5 py-1 bg-white border border-primary-300 rounded-lg text-xs font-bold text-primary-600 text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <span className="text-[10px] text-surface-400 font-medium">(Único)</span>
                      </div>
                    </div>
                  )}
                </div>
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
                  <span>Diseño: <strong className="text-primary-300">+{formatCurrency(resultado.costoDiseno, producto.moneda)}</strong></span>
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
