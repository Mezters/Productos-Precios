export function generateId() {
  return 'prod_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Retorna las etiquetas dinámicas según la categoría del producto.
 * Para la categoría "Toner" / "Tóner", reemplaza "Personalizado" por "Recarga".
 */
export function getCategoryLabels(categoria) {
  const normCat = String(categoria || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isToner = normCat.includes('toner');

  if (isToner) {
    return {
      isToner: true,
      personalizado: 'Recarga',
      personalizadoLower: 'recarga',
      sinPersonalizar: 'Sin Recarga',
      soloPersonalizado: 'Solo Recarga',
      base: 'Sin Recarga',
      personalizableTitle: '¿Este producto tiene opción de recarga?',
      personalizableDesc: 'Desmarca esta casilla si es solo venta de producto terminado sin servicio de recarga.',
      ocultarSinPersonalizarLabel: 'Ocultar opción "Sin Recarga" (Solo servicio de recarga)',
      precioBaseLabel: 'Precio Producto (Sin Recarga) *',
      precioPersonalizadoLabel: 'Precio Recarga Base *',
      precioPersonalizadoSimple: 'Precio Recarga',
      opcionesHeader: 'Opciones de Recarga',
      mayoreoHeader: 'Precios por Volumen de Recarga',
    };
  }

  return {
    isToner: false,
    personalizado: 'Personalizado',
    personalizadoLower: 'personalizado',
    sinPersonalizar: 'Sin Personalizar',
    soloPersonalizado: 'Solo Personalizado',
    base: 'Base',
    personalizableTitle: '¿Este producto es personalizable?',
    personalizableDesc: 'Desmarca esta casilla para productos estándar (insumos, tintas, productos terminados) que no requieren estampado ni personalización.',
    ocultarSinPersonalizarLabel: 'Ocultar opción "Sin Personalizar" (Servicio o producto 100% personalizado)',
    precioBaseLabel: 'Precio Base (Sin personalizar) *',
    precioPersonalizadoLabel: 'Precio Personalizado Base *',
    precioPersonalizadoSimple: 'Precio Personalizado',
    opcionesHeader: 'Configuración de Opciones / Servicios / Estampados',
    mayoreoHeader: 'Precios por Volumen',
  };
}

export function formatCurrency(amount, currency = 'COP') {
  if (amount === undefined || amount === null || isNaN(amount)) return '$ 0';
  const num = Number(amount);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('COP', '').trim();
}

export function formatNumber(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return new Intl.NumberFormat('es-CO').format(Number(amount));
}

export function parseFormattedNumber(input) {
  if (typeof input === 'number') return input;
  if (!input) return 0;
  const clean = String(input).replace(/[^\d]/g, '');
  return parseInt(clean, 10) || 0;
}

export function formatDate(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
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
  requiereDiseno = false,
  precioDisenoCustom = null
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
      precioBaseOriginal = producto.precioPersonalizado || producto.precioSinPersonalizar || 0;
    } else {
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
    } else if (estampadoPrincipal.precioMayoreo && estampadoPrincipal.precioMayoreo > 0) {
      const minMay = estampadoPrincipal.minUnidadesMayoreo || 3;
      if (cantidad >= minMay) {
        precioUnitarioBase = estampadoPrincipal.precioMayoreo;
        escalaAplicada = { minUnidades: minMay, maxUnidades: 999, precioPersonalizado: estampadoPrincipal.precioMayoreo };
      }
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
    if (esAditivo && estampadoPrincipal) {
      const pPrincipal = estampadoPrincipal.precioPrincipal || estampadoPrincipal.precio || 0;
      const pNombre = (estampadoPrincipal.nombre || '').toLowerCase();
      if (!pNombre.includes('diagnóstico') && !pNombre.includes('diagnostico') && pPrincipal !== precioBaseOriginal) {
        costoEstampadosAdicionales += pPrincipal;
      }
    }

    if (estampadosAdicionales.length > 0) {
      costoEstampadosAdicionales += estampadosAdicionales.reduce((sum, est) => {
        const minMayEst = est.minUnidadesMayoreo || 3;
        const pExtra = (cantidad >= minMayEst && est.precioAdicionalMayoreo && est.precioAdicionalMayoreo > 0)
          ? est.precioAdicionalMayoreo
          : (est.precioPrincipal || est.precioAdicional || est.precio || 0);
        return sum + pExtra;
      }, 0);
    }
  }

  const precioUnitario = precioUnitarioBase + costoEstampadosAdicionales;
  const precioSubtotal = precioUnitario * cantidad;

  // 4. Costo de elaboración de diseño (configurable o $25.000 por defecto)
  let costoDiseno = 0;
  if (requiereDiseno) {
    if (precioDisenoCustom !== null && precioDisenoCustom !== undefined && precioDisenoCustom !== '') {
      costoDiseno = Number(precioDisenoCustom) || 0;
    } else if (producto.precioDiseno !== undefined && producto.precioDiseno !== null && producto.precioDiseno !== '') {
      costoDiseno = Number(producto.precioDiseno) || 0;
    } else {
      costoDiseno = 25000;
    }
  }

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
 */
export function recalcularCarritoConAcumulacion(cartItems = [], productos = []) {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) return [];

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

  return cartItems.map((item) => {
    if (!item) return item;
    const prodOriginal = (productos || []).find((p) => p && p.id === item.productoId);

    if (!prodOriginal) return item;

    const catLower = (item.categoria || '').toLowerCase().trim();
    const nombreLower = (item.nombre || '').toLowerCase().trim();
    const esPD = nombreLower.includes('pd') || catLower.includes('pd');

    const cantidadParaEscala = esPD ? acumuladoTotalPD : (item.cantidad || 1);

    const resAcumulado = calcularPrecio(
      prodOriginal,
      cantidadParaEscala,
      item.personalizado,
      item.estampadoPrincipal,
      item.estampadosAdicionales,
      item.requiereDiseno,
      item.precioDisenoCustom
    );

    const precioUnitarioEscala = resAcumulado?.precioUnitario || item.precioUnitario || 0;
    const costoDiseno = resAcumulado?.costoDiseno !== undefined ? resAcumulado.costoDiseno : (item.costoDiseno || 0);
    const precioTotalItem = (precioUnitarioEscala * (item.cantidad || 1)) + costoDiseno;

    const aplicaDescuentoAcumulado = esPD && cantidadParaEscala > (item.cantidad || 1) && Boolean(resAcumulado?.escalaAplicada);

    return {
      ...item,
      precioUnitario: precioUnitarioEscala,
      precioTotal: precioTotalItem,
      costoDiseno: costoDiseno,
      aplicaDescuentoAcumulado,
      cantidadAcumuladaGrupo: cantidadParaEscala,
      escalaAplicada: resAcumulado?.escalaAplicada || null,
    };
  });
}

export function calcularDescuento(precioOriginal, precioEscala) {
  if (!precioOriginal || precioOriginal <= 0 || !precioEscala || precioEscala <= 0) return 0;
  if (precioEscala >= precioOriginal) return 0;
  return Math.round(((precioOriginal - precioEscala) / precioOriginal) * 100);
}
