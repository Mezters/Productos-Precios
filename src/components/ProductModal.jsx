import { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Image,
  Package,
  DollarSign,
  Layers,
  AlertCircle,
  FolderOpen,
  Stamp,
  Palette,
  User,
} from 'lucide-react';
import { generateId, formatNumber, parseFormattedNumber, getCategoryLabels } from '../utils/helpers';
import { CATEGORIAS_CON_ESTAMPADO, TAMANOS_ESTAMPADO_DEFAULT } from '../utils/storage';

const emptyProduct = {
  nombre: '',
  imagen: '',
  categoria: '',
  esPersonalizable: true,
  soloPersonalizado: false,
  tieneDescuentoVolumen: true,
  precioSinPersonalizar: '',
  precioPersonalizado: '',
  moneda: 'COP',
  escalasVolumen: [{ minUnidades: 1, maxUnidades: 11, precioSinPersonalizar: '', precioPersonalizado: '' }],
  configEstampado: null,
  responsable: '',
  motivoCambio: '',
};

export default function ProductModal({ isOpen, onClose, onSave, editProduct, categoriasExistentes }) {
  const [form, setForm] = useState(emptyProduct);
  const labels = getCategoryLabels(form.categoria);
  const [errors, setErrors] = useState({});
  const [isClosing, setIsClosing] = useState(false);
  const [customCategoria, setCustomCategoria] = useState(false);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  const todasCategorias = Array.from(
    new Set(categoriasExistentes || [])
  ).sort();

  const categoriaSoportaEstampado = form.esPersonalizable && CATEGORIAS_CON_ESTAMPADO.includes(form.categoria);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      const savedResponsable = localStorage.getItem('last_responsable') || 'Administrador';

      if (editProduct) {
        const tieneVolumen = editProduct.tieneDescuentoVolumen !== undefined
          ? editProduct.tieneDescuentoVolumen
          : (Array.isArray(editProduct.escalasVolumen) && editProduct.escalasVolumen.length > 0);

        setForm({
          ...editProduct,
          esPersonalizable: editProduct.esPersonalizable !== undefined ? editProduct.esPersonalizable : true,
          soloPersonalizado: Boolean(editProduct.soloPersonalizado),
          tieneDescuentoVolumen: tieneVolumen,
          precioSinPersonalizar: editProduct.precioSinPersonalizar ?? '',
          precioPersonalizado: editProduct.precioPersonalizado ?? '',
          categoria: editProduct.categoria || '',
          configEstampado: editProduct.configEstampado || null,
          responsable: savedResponsable,
          motivoCambio: '',
          historialPrecios: editProduct.historialPrecios || [],
          escalasVolumen: (editProduct.escalasVolumen && editProduct.escalasVolumen.length > 0)
            ? editProduct.escalasVolumen.map((e) => ({
                ...e,
                precioSinPersonalizar: e.precioSinPersonalizar ?? '',
                precioPersonalizado: e.precioPersonalizado ?? '',
              }))
            : [{ minUnidades: 1, maxUnidades: 999, precioSinPersonalizar: editProduct.precioSinPersonalizar || '', precioPersonalizado: editProduct.precioPersonalizado || '' }],
        });
        setCustomCategoria(false);
      } else {
        setForm({
          ...emptyProduct,
          responsable: savedResponsable,
          historialPrecios: [],
          escalasVolumen: [{ minUnidades: 1, maxUnidades: 11, precioSinPersonalizar: '', precioPersonalizado: '' }],
        });
        setCustomCategoria(false);
      }
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, editProduct]);

  useEffect(() => {
    if (form.esPersonalizable && !form.configEstampado) {
      setForm((prev) => ({
        ...prev,
        configEstampado: {
          titulo: '',
          aditivo: false,
          tamanos: TAMANOS_ESTAMPADO_DEFAULT.map((t) => ({ ...t })),
        },
      }));
    }
  }, [form.esPersonalizable, form.configEstampado]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateEscala = (index, field, value) => {
    setForm((prev) => {
      const escalas = [...prev.escalasVolumen];
      escalas[index] = { ...escalas[index], [field]: value };
      return { ...prev, escalasVolumen: escalas };
    });
  };

  const addEscala = () => {
    setForm((prev) => {
      const escalas = [...prev.escalasVolumen];
      const lastMax =
        escalas.length > 0 ? escalas[escalas.length - 1].maxUnidades + 1 : 1;
      escalas.push({
        minUnidades: lastMax,
        maxUnidades: lastMax + 49,
        precioSinPersonalizar: prev.precioSinPersonalizar || '',
        precioPersonalizado: prev.precioPersonalizado || '',
      });
      return { ...prev, escalasVolumen: escalas };
    });
  };

  const removeEscala = (index) => {
    setForm((prev) => ({
      ...prev,
      escalasVolumen: prev.escalasVolumen.filter((_, i) => i !== index),
    }));
  };

  const updateTamano = (index, field, value) => {
    setForm((prev) => {
      const tamanos = [...(prev.configEstampado?.tamanos || [])];
      tamanos[index] = { ...tamanos[index], [field]: value };
      if (field === 'nombre') {
        tamanos[index].id = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      return {
        ...prev,
        configEstampado: { ...prev.configEstampado, tamanos },
      };
    });
  };

  const addTamano = () => {
    setForm((prev) => {
      const tamanos = [...(prev.configEstampado?.tamanos || [])];
      tamanos.push({ id: `tamano-${Date.now()}`, nombre: '', precioPrincipal: '', precioAdicional: '' });
      return {
        ...prev,
        configEstampado: { ...prev.configEstampado, tamanos },
      };
    });
  };

  const removeTamano = (index) => {
    setForm((prev) => {
      const tamanos = (prev.configEstampado?.tamanos || []).filter((_, i) => i !== index);
      return {
        ...prev,
        configEstampado: { ...prev.configEstampado, tamanos },
      };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';

    if (!form.esPersonalizable || !form.soloPersonalizado) {
      const pBase = typeof form.precioSinPersonalizar === 'string'
        ? parseFormattedNumber(form.precioSinPersonalizar)
        : form.precioSinPersonalizar;
      if (!pBase || pBase <= 0) newErrors.precioSinPersonalizar = 'Precio requerido';
    }

    if (form.esPersonalizable) {
      const pPers = typeof form.precioPersonalizado === 'string'
        ? parseFormattedNumber(form.precioPersonalizado)
        : form.precioPersonalizado;
      if (!pPers || pPers <= 0) newErrors.precioPersonalizado = 'Precio personalizado requerido';
    }

    if (!form.responsable || !form.responsable.trim()) {
      newErrors.responsable = 'Especifica quién realiza esta modificación';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const responsableNombre = (form.responsable || 'Administrador').trim();
    localStorage.setItem('last_responsable', responsableNombre);

    const now = new Date().toISOString();

    const pPers = form.esPersonalizable
      ? (typeof form.precioPersonalizado === 'string'
          ? parseFormattedNumber(form.precioPersonalizado)
          : (form.precioPersonalizado || 0))
      : 0;

    const pBase = (form.esPersonalizable && form.soloPersonalizado)
      ? 0
      : (typeof form.precioSinPersonalizar === 'string'
          ? parseFormattedNumber(form.precioSinPersonalizar)
          : (form.precioSinPersonalizar || pPers));

    // Crear registro en el historial de precios
    const actualHistorial = Array.isArray(form.historialPrecios) ? form.historialPrecios : [];
    const nuevoRegistroHistorial = {
      id: generateId(),
      fecha: now,
      responsable: responsableNombre,
      precioSinPersonalizar: pBase,
      precioPersonalizado: pPers || pBase,
      motivo: (form.motivoCambio || (editProduct ? 'Actualización de datos y precio' : 'Creación inicial de producto')).trim(),
    };

    const escalasFinales = form.tieneDescuentoVolumen
      ? form.escalasVolumen.map((e) => {
          let pP = 0;
          if (form.esPersonalizable) {
            if (typeof e.precioPersonalizado === 'string') {
              pP = parseFormattedNumber(e.precioPersonalizado);
            } else if (typeof e.precioPersonalizado === 'number') {
              pP = e.precioPersonalizado;
            }
            if (!pP && pP !== 0) pP = pPers;
          }

          let pSinP = 0;
          if (!form.esPersonalizable || !form.soloPersonalizado) {
            if (typeof e.precioSinPersonalizar === 'string') {
              pSinP = parseFormattedNumber(e.precioSinPersonalizar);
            } else if (typeof e.precioSinPersonalizar === 'number') {
              pSinP = e.precioSinPersonalizar;
            }
            if (!pSinP && pSinP !== 0) pSinP = pBase;
          }

          return {
            minUnidades: parseInt(e.minUnidades, 10) || 1,
            maxUnidades: parseInt(e.maxUnidades, 10) || 999,
            precioSinPersonalizar: pSinP,
            precioPersonalizado: pP,
          };
        })
      : [];

    const producto = {
      id: (editProduct && editProduct.id) ? editProduct.id : generateId(),
      nombre: form.nombre.trim(),
      imagen: form.imagen.trim(),
      categoria: form.categoria.trim(),
      esPersonalizable: Boolean(form.esPersonalizable),
      soloPersonalizado: Boolean(form.esPersonalizable && form.soloPersonalizado),
      tieneDescuentoVolumen: Boolean(form.tieneDescuentoVolumen),
      precioSinPersonalizar: pBase,
      precioPersonalizado: pPers || pBase,
      moneda: form.moneda || 'COP',
      ultimaActualizacion: now,
      responsable: responsableNombre,
      historialPrecios: [...actualHistorial, nuevoRegistroHistorial],
      escalasVolumen: escalasFinales,
    };    if (form.esPersonalizable && form.configEstampado?.tamanos?.length > 0) {
      producto.configEstampado = {
        titulo: form.configEstampado.titulo || '',
        aditivo: Boolean(form.configEstampado.aditivo),
        tamanos: form.configEstampado.tamanos.map((t) => ({
          id: t.id || t.nombre.toLowerCase().replace(/\s+/g, '-'),
          nombre: t.nombre.trim() || 'Opción',
          minUnidadesMayoreo: parseInt(t.minUnidadesMayoreo, 10) || 3,
          precioPrincipal: typeof t.precioPrincipal === 'string'
            ? parseFormattedNumber(t.precioPrincipal)
            : (t.precioPrincipal || t.precio || pPers),
          precioMayoreo: typeof t.precioMayoreo === 'string'
            ? parseFormattedNumber(t.precioMayoreo)
            : (t.precioMayoreo || 0),
          precioAdicional: typeof t.precioAdicional === 'string'
            ? parseFormattedNumber(t.precioAdicional)
            : (t.precioAdicional || 0),
          precioAdicionalMayoreo: typeof t.precioAdicionalMayoreo === 'string'
            ? parseFormattedNumber(t.precioAdicionalMayoreo)
            : (t.precioAdicionalMayoreo || 0),
          escalas: (t.escalas || []).map((e) => ({
            minUnidades: parseInt(e.minUnidades, 10) || 1,
            maxUnidades: parseInt(e.maxUnidades, 10) || 999,
            precio: typeof e.precio === 'string'
              ? parseFormattedNumber(e.precio)
              : (e.precio || 0),
          })),
        })),
      };
    } else {
      delete producto.configEstampado;
    }

    onSave(producto);
    handleClose();
  };

  const renderPriceInput = (value, onChange, onBlur, placeholder, errorKey) => {
    const displayValue = typeof value === 'number' ? formatNumber(value) : value;
    return (
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, '');
          onChange(raw);
        }}
        onBlur={() => {
          const num = parseFormattedNumber(value);
          if (num > 0) onBlur(num);
        }}
        placeholder={placeholder}
        className={`w-full px-2.5 py-2 bg-white border rounded-lg text-sm text-center font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all ${
          errors[errorKey] ? 'border-danger-400' : 'border-surface-200'
        }`}
      />
    );
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      style={{
        animation: isClosing ? 'fadeIn 0.2s ease-out reverse' : undefined,
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal - Ancho cómodo para PC (max-w-3xl) y compacto en celular */}
      <div
        ref={modalRef}
        className={`relative w-full max-w-xl md:max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[92vh] flex flex-col ${
          isClosing ? '' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50/50">
          <div>
            <h2 className="text-lg font-bold text-surface-900">
              {editProduct ? (editProduct.id ? 'Editar Producto' : 'Duplicar Producto') : 'Nuevo Producto'}
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {editProduct
                ? (editProduct.id
                    ? 'Modifica los datos y registra la actualización'
                    : 'Ajusta los nombres o precios para guardar este nuevo producto duplicado')
                : 'Completa la información del nuevo producto'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin"
        >
          {/* Campo Responsable y Motivo (Auditoría) */}
          <div className="p-3.5 bg-primary-50/50 border border-primary-200/80 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-900 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-primary-600" />
              Responsable de esta Modificación *
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-surface-600 mb-1 block">
                  Tu nombre o cargo:
                </label>
                <input
                  type="text"
                  value={form.responsable}
                  onChange={(e) => updateField('responsable', e.target.value)}
                  placeholder='Ej: "Juan (Caja)", "Administrador"'
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all ${
                    errors.responsable ? 'border-danger-400' : 'border-surface-200'
                  }`}
                />
                {errors.responsable && (
                  <p className="mt-1 text-[10px] text-danger-500">{errors.responsable}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-surface-600 mb-1 block">
                  Motivo (Opcional):
                </label>
                <input
                  type="text"
                  value={form.motivoCambio}
                  onChange={(e) => updateField('motivoCambio', e.target.value)}
                  placeholder='Ej: "Aumento precio vinilo"'
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Fila Doble para PC: Imagen URL + Nombre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
                <Package className="w-4 h-4 text-surface-400" />
                Nombre del Producto *
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                placeholder='Ej: "Mug Blanco 11oz"'
                className={`w-full px-3.5 py-2.5 bg-surface-50 border rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all ${
                  errors.nombre ? 'border-danger-400 bg-danger-50/50' : 'border-surface-200'
                }`}
              />
              {errors.nombre && (
                <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.nombre}
                </p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
                <FolderOpen className="w-4 h-4 text-surface-400" />
                Categoría
              </label>
              {!customCategoria ? (
                <div className="space-y-2">
                  <select
                    value={form.categoria}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setCustomCategoria(true);
                        updateField('categoria', '');
                      } else {
                        updateField('categoria', e.target.value);
                        if (!CATEGORIAS_CON_ESTAMPADO.includes(e.target.value)) {
                          setForm((prev) => ({ ...prev, configEstampado: null }));
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem',
                    }}
                  >
                    <option value="">Sin categoría</option>
                    {todasCategorias.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__custom__">+ Nueva categoría...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) => updateField('categoria', e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    className="flex-1 px-3.5 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCategoria(false);
                      updateField('categoria', '');
                    }}
                    className="px-3 py-2.5 text-xs font-medium text-surface-500 hover:text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Imagen URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
              <Image className="w-4 h-4 text-surface-400" />
              URL de la Imagen (Opcional)
            </label>
            <input
              type="url"
              value={form.imagen}
              onChange={(e) => updateField('imagen', e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full px-3.5 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
            />
          </div>

          {/* Checkbox: ¿Es Personalizable? */}
          <div className="p-3.5 bg-surface-50 border border-surface-200 rounded-xl space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.esPersonalizable}
                onChange={(e) => updateField('esPersonalizable', e.target.checked)}
                className="w-4.5 h-4.5 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-surface-900 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-primary-500" />
                  {labels.personalizableTitle}
                </span>
                <p className="text-xs text-surface-400 mt-0.5">
                  {labels.personalizableDesc}
                </p>
              </div>
            </label>

            {form.esPersonalizable && (
              <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-surface-200/60 pl-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.soloPersonalizado)}
                  onChange={(e) => updateField('soloPersonalizado', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-surface-700">
                  {labels.ocultarSinPersonalizarLabel}
                </span>
              </label>
            )}
          </div>

          {/* Precios Base Generales */}
          <div className={`grid ${form.esPersonalizable && !form.soloPersonalizado ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {(!form.esPersonalizable || !form.soloPersonalizado) && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
                  <DollarSign className="w-4 h-4 text-surface-400" />
                  {form.esPersonalizable ? labels.precioBaseLabel : 'Precio del Producto *'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={typeof form.precioSinPersonalizar === 'number'
                    ? formatNumber(form.precioSinPersonalizar)
                    : form.precioSinPersonalizar}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateField('precioSinPersonalizar', raw);
                    if (!form.esPersonalizable) {
                      updateField('precioPersonalizado', raw);
                    }
                  }}
                  onBlur={() => {
                    const num = parseFormattedNumber(form.precioSinPersonalizar);
                    if (num > 0) {
                      updateField('precioSinPersonalizar', num);
                      if (!form.esPersonalizable) updateField('precioPersonalizado', num);
                    }
                  }}
                  placeholder="18.000"
                  className={`w-full px-3.5 py-2.5 bg-surface-50 border rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all ${
                    errors.precioSinPersonalizar
                      ? 'border-danger-400 bg-danger-50/50'
                      : 'border-surface-200'
                  }`}
                />
                {errors.precioSinPersonalizar && (
                  <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.precioSinPersonalizar}
                  </p>
                )}
              </div>
            )}

            {form.esPersonalizable && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-surface-700 mb-1.5">
                  <DollarSign className="w-4 h-4 text-primary-400" />
                  {labels.precioPersonalizadoLabel}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={typeof form.precioPersonalizado === 'number'
                    ? formatNumber(form.precioPersonalizado)
                    : form.precioPersonalizado}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateField('precioPersonalizado', raw);
                  }}
                  onBlur={() => {
                    const num = parseFormattedNumber(form.precioPersonalizado);
                    if (num > 0) updateField('precioPersonalizado', num);
                  }}
                  placeholder="28.000"
                  className={`w-full px-3.5 py-2.5 bg-surface-50 border rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all ${
                    errors.precioPersonalizado
                      ? 'border-danger-400 bg-danger-50/50'
                      : 'border-surface-200'
                  }`}
                />
                {errors.precioPersonalizado && (
                  <p className="mt-1 text-xs text-danger-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.precioPersonalizado}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Configuración de Opciones / Servicios / Estampados */}
          {form.esPersonalizable && form.configEstampado && (
            <div className="bg-primary-50/40 rounded-2xl p-4 border border-primary-100/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-primary-900">
                  <Stamp className="w-4 h-4 text-primary-600" />
                  {labels.opcionesHeader}
                </label>
                <button
                  type="button"
                  onClick={addTamano}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary-700 bg-white hover:bg-primary-50 rounded-lg shadow-sm border border-primary-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Añadir Opción
                </button>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.configEstampado.aditivo)}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        configEstampado: { ...prev.configEstampado, aditivo: val },
                      }));
                    }}
                    className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-surface-800">
                    Sumar opciones sobre la tarifa base de Diagnóstico (Modo Aditivo / Servicio Técnico)
                  </span>
                </label>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-surface-600 mb-1 block">
                  Título de la Sección en el Cotizador (Opcional):
                </label>
                <input
                  type="text"
                  value={form.configEstampado.titulo || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      configEstampado: { ...prev.configEstampado, titulo: val },
                    }));
                  }}
                  placeholder='Ej: "Tipo de Reparación / Mantenimiento", "Tamaño de Estampado"'
                  className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-xs text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <p className="text-xs text-surface-500 leading-relaxed">
                Configura cada opción (ej: Diagnóstico $20.000, Mantenimiento $45.000, Cambio Cabezal $70.000).
              </p>

              <div className="space-y-3">
                {(form.configEstampado?.tamanos || []).map((tamano, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-3.5 border border-surface-200 shadow-sm animate-scaleIn space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={tamano.nombre}
                        onChange={(e) => updateTamano(index, 'nombre', e.target.value)}
                        placeholder='Nombre (ej: "Diagnóstico / Revisión", "Carta")'
                        className="font-bold text-sm text-surface-900 bg-transparent border-b border-surface-200 focus:border-primary-500 focus:outline-none pb-0.5 w-full mr-2"
                      />
                      {(form.configEstampado?.tamanos || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTamano(index)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:text-danger-500 hover:bg-danger-50 transition-all cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[10px] font-semibold text-surface-600 mb-1 block uppercase tracking-wider">
                          Precio 1 Ud
                        </label>
                        {renderPriceInput(
                          tamano.precioPrincipal ?? tamano.precio ?? '',
                          (val) => updateTamano(index, 'precioPrincipal', val),
                          (num) => updateTamano(index, 'precioPrincipal', num),
                          '28.000',
                          `tamano_pprincipal_${index}`
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-primary-600 mb-1 block uppercase tracking-wider">
                          Mín. Uds Mayoreo
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="999"
                          value={tamano.minUnidadesMayoreo ?? 3}
                          onChange={(e) => updateTamano(index, 'minUnidadesMayoreo', parseInt(e.target.value, 10) || 3)}
                          className="w-full px-2.5 py-2 bg-white border border-surface-200 rounded-lg text-sm text-center font-bold text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-primary-600 mb-1 block uppercase tracking-wider">
                          Precio Mayoreo
                        </label>
                        {renderPriceInput(
                          tamano.precioMayoreo ?? '',
                          (val) => updateTamano(index, 'precioMayoreo', val),
                          (num) => updateTamano(index, 'precioMayoreo', num),
                          '24.000',
                          `tamano_pmayoreo_${index}`
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-surface-600 mb-1 block uppercase tracking-wider">
                          + Extra 1 Ud
                        </label>
                        {renderPriceInput(
                          tamano.precioAdicional ?? '',
                          (val) => updateTamano(index, 'precioAdicional', val),
                          (num) => updateTamano(index, 'precioAdicional', num),
                          '5.000',
                          `tamano_padicional_${index}`
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-surface-100 text-xs">
                      <span className="text-[10px] font-semibold text-accent-700 uppercase tracking-wider shrink-0">
                        + Extra Mayoreo:
                      </span>
                      <div className="w-32">
                        {renderPriceInput(
                          tamano.precioAdicionalMayoreo ?? '',
                          (val) => updateTamano(index, 'precioAdicionalMayoreo', val),
                          (num) => updateTamano(index, 'precioAdicionalMayoreo', num),
                          '3.000',
                          `tamano_padicionalmayoreo_${index}`
                        )}
                      </div>
                      <span className="text-[10px] text-surface-400">
                        (Aplica cuando se piden {tamano.minUnidadesMayoreo || 3}+ unidades)
                      </span>
                    </div>

                    {/* Escalas de volumen específicas para esta opción */}
                    <div className="pt-2 border-t border-surface-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-surface-700">
                          Escalas por cantidad para "{tamano.nombre || 'esta opción'}":
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => {
                              const tamanos = [...(prev.configEstampado?.tamanos || [])];
                              const actualEscalas = tamanos[index].escalas || [];
                              const lastMax = actualEscalas.length > 0 ? actualEscalas[actualEscalas.length - 1].maxUnidades + 1 : 12;
                              tamanos[index].escalas = [
                                ...actualEscalas,
                                { minUnidades: lastMax, maxUnidades: lastMax + 37, precio: tamano.precioMayoreo || tamano.precioPrincipal || '' }
                              ];
                              return { ...prev, configEstampado: { ...prev.configEstampado, tamanos } };
                            });
                          }}
                          className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md cursor-pointer"
                        >
                          + Escala Extra (ej: 50+ uds)
                        </button>
                      </div>

                      {(tamano.escalas || []).length === 0 ? (
                        <p className="text-[10px] text-surface-400 italic">
                          (Opcional) Usa "+ Escala Extra" si quieres precios distintos para 12-49, 50-99, 100+ uds.
                        </p>
                      ) : (
                        <div className="space-y-1.5 mt-1">
                          {(tamano.escalas || []).map((esc, escIdx) => (
                            <div key={escIdx} className="flex items-center gap-2 bg-surface-50 p-2 rounded-lg border border-surface-200">
                              <div className="flex items-center gap-1 text-[11px] text-surface-600">
                                <span>De</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={esc.minUnidades}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1;
                                    setForm((prev) => {
                                      const tamanos = [...prev.configEstampado.tamanos];
                                      tamanos[index].escalas[escIdx].minUnidades = val;
                                      return { ...prev, configEstampado: { ...prev.configEstampado, tamanos } };
                                    });
                                  }}
                                  className="w-12 px-1 py-0.5 border text-center rounded bg-white font-bold"
                                />
                                <span>a</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={esc.maxUnidades}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 999;
                                    setForm((prev) => {
                                      const tamanos = [...prev.configEstampado.tamanos];
                                      tamanos[index].escalas[escIdx].maxUnidades = val;
                                      return { ...prev, configEstampado: { ...prev.configEstampado, tamanos } };
                                    });
                                  }}
                                  className="w-14 px-1 py-0.5 border text-center rounded bg-white font-bold"
                                />
                                <span>uds:</span>
                              </div>

                              <div className="flex-1">
                                {renderPriceInput(
                                  esc.precio ?? '',
                                  (val) => {
                                    setForm((prev) => {
                                      const tamanos = [...prev.configEstampado.tamanos];
                                      tamanos[index].escalas[escIdx].precio = val;
                                      return { ...prev, configEstampado: { ...prev.configEstampado, tamanos } };
                                    });
                                  },
                                  (num) => {
                                    setForm((prev) => {
                                      const tamanos = [...prev.configEstampado.tamanos];
                                      tamanos[index].escalas[escIdx].precio = num;
                                      return { ...prev, configEstampado: { ...prev.configEstampado, tamanos } };
                                    });
                                  },
                                  '20.000',
                                  `tamano_${index}_esc_${escIdx}`
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => {
                                    const tamanos = [...prev.configEstampado.tamanos];
                                    tamanos[index].escalas = tamanos[index].escalas.filter((_, i) => i !== escIdx);
                                    return { ...prev, configEstampado: { ...prev.configEstampado, tamanos } };
                                  });
                                }}
                                className="text-surface-400 hover:text-danger-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activar / Desactivar Precios por Volumen */}
          <div className="p-3.5 bg-surface-50 border border-surface-200 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(form.tieneDescuentoVolumen)}
                onChange={(e) => updateField('tieneDescuentoVolumen', e.target.checked)}
                className="w-4.5 h-4.5 text-primary-600 rounded border-surface-300 focus:ring-primary-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-surface-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary-500" />
                  ¿Aplica precios / descuentos por volumen?
                </span>
                <p className="text-xs text-surface-400 mt-0.5">
                  Desmarca esta casilla si este producto tiene precio fijo único sin escalas por cantidad.
                </p>
              </div>
            </label>
          </div>

          {/* Escalas de Volumen (Solo si tieneDescuentoVolumen está activo) */}
          {form.tieneDescuentoVolumen && (
            <div className="space-y-3 pt-1 border-t border-surface-100">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-surface-700">
                  <Layers className="w-4 h-4 text-surface-400" />
                  Precios por Volumen
                </label>
                <button
                  type="button"
                  onClick={addEscala}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Añadir Regla
                </button>
              </div>

              <div className="space-y-2.5">
                {form.escalasVolumen.map((escala, index) => (
                  <div
                    key={index}
                    className="bg-surface-50 rounded-xl p-3.5 border border-surface-100 animate-scaleIn"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                        Regla {index + 1}
                      </span>
                      {form.escalasVolumen.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEscala(index)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-surface-400 hover:text-danger-500 hover:bg-danger-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Rango de unidades */}
                    <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                      <div>
                        <label className="text-[10px] font-medium text-surface-400 mb-1 block uppercase tracking-wider">
                          Desde (uds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={escala.minUnidades}
                          onChange={(e) =>
                            updateEscala(index, 'minUnidades', parseInt(e.target.value, 10) || 1)
                          }
                          className={`w-full px-2.5 py-2 bg-white border rounded-lg text-sm text-center font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all ${
                            errors[`escala_min_${index}`] ? 'border-danger-400' : 'border-surface-200'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-surface-400 mb-1 block uppercase tracking-wider">
                          Hasta (uds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={escala.maxUnidades}
                          onChange={(e) =>
                            updateEscala(index, 'maxUnidades', parseInt(e.target.value, 10) || 1)
                          }
                          className={`w-full px-2.5 py-2 bg-white border rounded-lg text-sm text-center font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all ${
                            errors[`escala_max_${index}`] ? 'border-danger-400' : 'border-surface-200'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Precios directos por escala (Sin Personalizar) */}
                    <div>
                      <label className="text-[10px] font-medium text-surface-400 mb-1 block uppercase tracking-wider">
                        {form.esPersonalizable ? `Precio ${labels.sinPersonalizar} por Volumen` : 'Precio del Producto por Volumen'}
                      </label>
                      {renderPriceInput(
                        escala.precioSinPersonalizar,
                        (val) => {
                          updateEscala(index, 'precioSinPersonalizar', val);
                          updateEscala(index, 'precioPersonalizado', val);
                        },
                        (num) => {
                          updateEscala(index, 'precioSinPersonalizar', num);
                          updateEscala(index, 'precioPersonalizado', num);
                        },
                        '15.000',
                        `escala_pbase_${index}`
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 bg-surface-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-medium text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-200 cursor-pointer active:scale-[0.97]"
          >
            <Save className="w-4 h-4" />
            {editProduct ? (editProduct.id ? 'Guardar Cambios' : 'Guardar Copia') : 'Crear Producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
