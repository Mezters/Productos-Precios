/**
 * Genera un UUID v4 simple
 */
export function generateId() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

/**
 * Formatea un número con separadores de miles y símbolo de moneda
 * @param {number} value
 * @param {string} currency - Código de moneda (COP, USD, etc.)
 * @returns {string}
 */
export function formatCurrency(value, currency = 'COP') {
  if (value == null || isNaN(value)) return '$0';
  
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return formatted;
}

/**
 * Formatea un número con separadores de miles (sin símbolo de moneda)
 * @param {number|string} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value == null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('es-CO').format(num);
}

/**
 * Parsea un string formateado con separadores a número
 * @param {string} formattedValue
 * @returns {number}
 */
export function parseFormattedNumber(formattedValue) {
  if (!formattedValue) return 0;
  const cleaned = String(formattedValue).replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Formatea una fecha a formato amigable en español (ej: "26 jul 2026, 8:20 PM")
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return 'Fecha no disponible';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Calcula el precio final basado en cantidad, personalización, opciones principales,
 * opciones adicionales, elaboración de diseño y escalas de volumen.
 */
export function calcularPrecio(
  producto,
  cantidad,
  personalizado,
  estampadoPrincipal = null,
  estampadosAdicionales = [],
  requiereDiseno = false
) {
  if (!producto || cantidad <= 0) {
    return {
      precioUnitario: 0,
      precioSubtotal: 0,
      precioTotal: 0,
      escalaAplicada: null,
      precioBaseOriginal: 0,
      costoEstampadosAdicionales: 0,
      precioUnitarioBase: 0,
      costoDiseno: 0,
    };
  }

  const esAditivo = Boolean(
    producto.configEstampado?.aditivo ||
    producto.opcionesAditivas ||
    (producto.nombre && (
      producto.nombre.toLowerCase().includes('servicio tecnico') ||
      producto.nombre.toLowerCase().includes('servicio técnico') ||
      producto.nombre.toLowerCase().includes('tecnico impresoras') ||
      producto.nombre.toLowerCase().includes('técnico impresoras')
    ))
  );

  // 1. Determinar el precio base original (para 1 unidad)
  let precioBaseOriginal = producto.precioSinPersonalizar;

  if (personalizado) {
    if (esAditivo) {
      // En modo aditivo (Servicios), la tarifa base (ej: Diagnóstico $20.000) se mantiene fija
      precioBaseOriginal = producto.precioPersonalizado || producto.precioSinPersonalizar || 0;
    } else {
      // En modo sustitutivo (Camisetas), la opción elegida reemplaza el precio base
      if (estampadoPrincipal && (estampadoPrincipal.precioPrincipal || estampadoPrincipal.precio)) {
        precioBaseOriginal = estampadoPrincipal.precioPrincipal || estampadoPrincipal.precio;
      } else {
        precioBaseOriginal = producto.precioPersonalizado;
      }
    }
  }

  // 2. Buscar la escala de volumen aplicable y determinar el precio unitario final
  let precioUnitarioBase = precioBaseOriginal;
  let escalaAplicada = null;

  if (personalizado && estampadoPrincipal) {
    if (estampadoPrincipal.escalas && estampadoPrincipal.escalas.length > 0) {
      for (const esc of estampadoPrincipal.escalas) {
        if (cantidad >= esc.minUnidades && cantidad <= esc.maxUnidades) {
          precioUnitarioBase = esc.precio;
          escalaAplicada = { minUnidades: esc.minUnidades, maxUnidades: esc.maxUnidades, precioPersonalizado: esc.precio };
          break;
        }
      }
    } else if (estampadoPrincipal.precioMayoreo && estampadoPrincipal.precioMayoreo > 0 && cantidad >= 3) {
      precioUnitarioBase = estampadoPrincipal.precioMayoreo;
      escalaAplicada = { minUnidades: 3, maxUnidades: 999, precioPersonalizado: estampadoPrincipal.precioMayoreo };
    }
  }

  if (!escalaAplicada && producto.escalasVolumen && producto.escalasVolumen.length > 0) {
    for (const escala of producto.escalasVolumen) {
      if (cantidad >= escala.minUnidades && cantidad <= escala.maxUnidades) {
        if (personalizado) {
          const precioReferencia1Ud = producto.precioPersonalizado || precioBaseOriginal;
          const descuentoPesos = Math.max(0, precioReferencia1Ud - (escala.precioPersonalizado || precioReferencia1Ud));
          precioUnitarioBase = Math.max(0, precioBaseOriginal - descuentoPesos);
        } else {
          precioUnitarioBase = escala.precioSinPersonalizar || precioBaseOriginal;
        }
        escalaAplicada = escala;
        break;
      }
    }
  }

  // 3. Calcular costo de opciones principales y adicionales (extras por unidad)
  let costoEstampadosAdicionales = 0;

  if (personalizado) {
    // En modo aditivo (Servicios), si se elige una opción principal diferente a "Ninguno" o "Diagnóstico solo", se suma a la tarifa base
    if (esAditivo && estampadoPrincipal) {
      const pPrincipal = estampadoPrincipal.precioPrincipal || estampadoPrincipal.precio || 0;
      const pNombre = (estampadoPrincipal.nombre || '').toLowerCase();

      // Si la opción no se llama "diagnóstico", sumamos su costo al diagnóstico base
      if (!pNombre.includes('diagnóstico') && !pNombre.includes('diagnostico') && pPrincipal !== precioBaseOriginal) {
        costoEstampadosAdicionales += pPrincipal;
      }
    }

    // Estampados/Servicios adicionales (Extras)
    if (estampadosAdicionales.length > 0) {
      costoEstampadosAdicionales += estampadosAdicionales.reduce(
        (sum, est) => sum + (est.precioPrincipal || est.precioAdicional || est.precio || 0),
        0
      );
    }
  }

  const precioUnitario = precioUnitarioBase + costoEstampadosAdicionales;
  const precioSubtotal = precioUnitario * cantidad;

  // 4. Costo de elaboración de diseño (+ $25.000 único al total)
  const costoDiseno = requiereDiseno ? 25000 : 0;
  const precioTotal = precioSubtotal + costoDiseno;

  return {
    precioUnitario,
    precioSubtotal,
    precioTotal,
    escalaAplicada,
    precioBaseOriginal,
    costoEstampadosAdicionales,
    precioUnitarioBase,
    costoDiseno,
  };
}

/**
 * Recalcula todos los ítems de una cotización acumulando la cantidad EXCLUSIVAMENTE
 * para productos de la familia/categoría 'PD' para otorgar el precio al por mayor
 * a todas las prendas combinadas aunque sean de diferente talla o referencia.
 * Para demás productos (ej: Mugs), cada referencia calcula su precio según su cantidad individual.
 */
export function recalcularCarritoConAcumulacion(cartItems = [], productos = []) {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) return [];

  // 1. Sumar cantidad total acumulada EXCLUSIVAMENTE para prendas/productos PD
  let acumuladoTotalPD = 0;

  cartItems.forEach((item) => {
    if (!item) return;
    const catLower = (item.categoria || '').toLowerCase().trim();
    const nombreLower = (item.nombre || '').toLowerCase().trim();

    const esPD = nombreLower.includes('pd') || catLower.includes('pd');
    if (esPD) {
      acumuladoTotalPD += (item.cantidad || 1);
    }
  });

  // 2. Recalcular precio unitario y total de cada ítem
  return cartItems.map((item) => {
    if (!item) return item;
    const prodOriginal = (productos || []).find((p) => p && p.id === item.productoId);

    if (!prodOriginal) return item;

    const catLower = (item.categoria || '').toLowerCase().trim();
    const nombreLower = (item.nombre || '').toLowerCase().trim();
    const esPD = nombreLower.includes('pd') || catLower.includes('pd');

    // Si es producto PD, aplica la cantidad acumulada de la familia PD.
    // Si no es PD, aplica estrictamente su propia cantidad individual.
    const cantidadParaEscala = esPD ? acumuladoTotalPD : (item.cantidad || 1);

    const resAcumulado = calcularPrecio(
      prodOriginal,
      cantidadParaEscala,
      item.personalizado,
      item.estampadoPrincipal,
      item.estampadosAdicionales,
      item.requiereDiseno
    );

    const precioUnitarioEscala = resAcumulado?.precioUnitario || item.precioUnitario || 0;
    const costoDiseno = item.costoDiseno || 0;
    const precioTotalItem = (precioUnitarioEscala * (item.cantidad || 1)) + costoDiseno;

    const aplicaDescuentoAcumulado = esPD && cantidadParaEscala > (item.cantidad || 1) && Boolean(resAcumulado?.escalaAplicada);

    return {
      ...item,
      precioUnitario: precioUnitarioEscala,
      precioTotal: precioTotalItem,
      aplicaDescuentoAcumulado,
      cantidadAcumuladaGrupo: cantidadParaEscala,
      escalaAplicada: resAcumulado?.escalaAplicada || null,
    };
  });
}

/**
 * Calcula el porcentaje de ahorro entre el precio original y el precio de la escala
 */
export function calcularDescuento(precioOriginal, precioEscala) {
  if (!precioOriginal || precioOriginal <= 0 || !precioEscala || precioEscala <= 0) return 0;
  if (precioEscala >= precioOriginal) return 0;
  return Math.round(((precioOriginal - precioEscala) / precioOriginal) * 100);
}
