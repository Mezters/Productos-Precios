import { useState } from 'react';
import {
  ShoppingBag,
  X,
  Trash2,
  Copy,
  MessageCircle,
  Check,
} from 'lucide-react';
import { formatCurrency, formatNumber, getCategoryLabels } from '../utils/helpers';

export default function CartDrawer({
  cartItems,
  onRemoveItem,
  onClearCart,
  onClose,
  isOpen,
}) {
  const [copied, setCopied] = useState(false);

  const items = Array.isArray(cartItems) ? cartItems : [];
  const grandTotal = items.reduce((sum, item) => sum + (item?.precioTotal || 0), 0);
  const totalUnidades = items.reduce((sum, item) => sum + (item?.cantidad || 0), 0);

  // Formatear texto limpio para WhatsApp
  const generarTextoWhatsApp = () => {
    let msg = `📋 *COTIZACIÓN - CENTRO TINTAS*\n`;
    msg += `-----------------------------------\n\n`;

    items.forEach((item, index) => {
      const itemLabels = getCategoryLabels(item.categoria);
      msg += `*${index + 1}. ${item.nombre}*\n`;
      msg += `   • Cantidad: ${formatNumber(item.cantidad)} uds\n`;
      if (item.personalizado) {
        msg += `   • Tipo: ${itemLabels.personalizado}\n`;
        if (item.estampadoPrincipal) {
          msg += `   • Diseño Principal: ${item.estampadoPrincipal.nombre}\n`;
        }
        if (item.estampadosAdicionales?.length > 0) {
          msg += `   • Extras: ${item.estampadosAdicionales.map((e) => e.nombre).join(', ')}\n`;
        }
        if (item.costoDiseno > 0) {
          msg += `   • Elaboración de Diseño: Sí (+${formatCurrency(item.costoDiseno, item.moneda)})\n`;
        }
      } else {
        msg += `   • Tipo: ${itemLabels.sinPersonalizar}\n`;
      }
      msg += `   • Precio Unitario: ${formatCurrency(item.precioUnitario, item.moneda)}\n`;
      msg += `   • Subtotal Item: *${formatCurrency(item.precioTotal, item.moneda)}*\n\n`;
    });

    msg += `-----------------------------------\n`;
    msg += `💲 *GRAN TOTAL: ${formatCurrency(grandTotal, 'COP')}*\n`;
    msg += `📦 Total Unidades: ${formatNumber(totalUnidades)} uds\n\n`;
    msg += `_¡Quedamos atentos a tu confirmación!_`;

    return msg;
  };

  const handleCopyText = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const texto = generarTextoWhatsApp();
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end animate-fadeIn">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slideLeft z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-100 bg-surface-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900 leading-tight">
                Cotización Multiproducto
              </h3>
              <p className="text-xs text-surface-400 mt-0.5">
                {cartItems.length} ítem{cartItems.length !== 1 ? 's' : ''} cargados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-200 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Ítems */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-surface-400">
              <ShoppingBag className="w-12 h-12 mb-3 stroke-[1.5] text-surface-300" />
              <p className="text-sm font-semibold text-surface-600">
                Tu cotización está vacía
              </p>
              <p className="text-xs mt-1 max-w-xs text-surface-400">
                Selecciona cualquier producto y presiona "+ Añadir a la Cotización" para ir acumulando.
              </p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div
                key={item.cartItemId || index}
                className="bg-surface-50 rounded-2xl p-4 border border-surface-200/80 shadow-sm relative group animate-fadeIn"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider block mb-0.5">
                      Ítem #{index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-surface-900 leading-snug">
                      {item.nombre}
                    </h4>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.cartItemId)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all cursor-pointer shrink-0"
                    title="Eliminar de la cotización"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Detalles de la configuración */}
                <div className="mt-2 text-xs text-surface-600 space-y-1 bg-white p-2.5 rounded-xl border border-surface-100">
                  <div className="flex justify-between">
                    <span className="text-surface-400">Tipo:</span>
                    <span className="font-semibold">
                      {item.personalizado
                        ? getCategoryLabels(item.categoria).personalizado
                        : getCategoryLabels(item.categoria).sinPersonalizar}
                    </span>
                  </div>
                  {item.personalizado && item.estampadoPrincipal && (
                    <div className="flex justify-between">
                      <span className="text-surface-400">Principal:</span>
                      <span className="font-semibold text-primary-600">
                        {item.estampadoPrincipal.nombre}
                      </span>
                    </div>
                  )}
                  {item.estampadosAdicionales?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-surface-400">Extras ({item.estampadosAdicionales.length}):</span>
                      <span className="font-semibold text-accent-600">
                        {item.estampadosAdicionales.map((e) => e.nombre).join(', ')}
                      </span>
                    </div>
                  )}
                  {item.costoDiseno > 0 && (
                    <div className="flex justify-between text-primary-700">
                      <span>Diseño:</span>
                      <span className="font-bold">+{formatCurrency(item.costoDiseno, item.moneda)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-surface-100 pt-1 mt-1">
                    <span className="text-surface-400">Cantidad:</span>
                    <span className="font-bold text-surface-900">
                      {formatNumber(item.cantidad)} uds @ {formatCurrency(item.precioUnitario, item.moneda)}
                    </span>
                  </div>

                  {item.aplicaDescuentoAcumulado && (
                    <div className="mt-1.5 px-2 py-1 bg-accent-50 text-accent-700 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-accent-200/60">
                      ✨ ¡Precio x Mayor aplicado! ({formatNumber(item.cantidadAcumuladaGrupo)} uds acumuladas en cotización)
                    </div>
                  )}
                </div>

                <div className="mt-2.5 flex items-center justify-between pt-1">
                  <span className="text-xs text-surface-400">Subtotal Ítem</span>
                  <span className="text-sm font-extrabold text-surface-900">
                    {formatCurrency(item.precioTotal, item.moneda)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer y Acciones de exportación */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-surface-100 bg-gradient-to-br from-surface-800 to-surface-900 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-surface-400 block uppercase tracking-wider">
                  Gran Total Cotización
                </span>
                <span className="text-xs text-surface-300">
                  {formatNumber(totalUnidades)} unidades acumuladas
                </span>
              </div>
              <span className="text-2xl font-black text-white">
                {formatCurrency(grandTotal, 'COP')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-accent-300" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar Texto'}
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>

            <button
              onClick={() => {
                if (confirm('¿Vaciar toda la cotización actual?')) {
                  onClearCart();
                }
              }}
              className="w-full text-center text-xs text-surface-400 hover:text-danger-300 transition-colors py-1 cursor-pointer"
            >
              Vaciar Cotización
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
