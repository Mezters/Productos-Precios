import { supabase, isSupabaseConfigured } from './supabase';

// Clave permanente de caché local
const STORAGE_KEY = 'centro_tintas_productos_cache_permanente';
const OLD_STORAGE_KEYS = [
  'centro-titnas-productos-v5',
  'centro-titnas-productos-v4',
  'centro-titnas-productos-v3',
  'centro-titnas-productos-v2',
  'centro-titnas-productos-v1',
  'centro-titnas-productos',
];

export const CATEGORIAS_CON_ESTAMPADO = ['Camisetas', 'Servicios'];

export const TAMANOS_ESTAMPADO_DEFAULT = [
  { id: 'bolsillo', nombre: 'Bolsillo', precioPrincipal: 22000, precioAdicional: 3000 },
  { id: 'carta', nombre: 'Carta', precioPrincipal: 28000, precioAdicional: 5000 },
  { id: 'tabloide', nombre: 'Tabloide', precioPrincipal: 35000, precioAdicional: 8000 },
];

/**
 * Productos de ejemplo iniciales solo para la primera instalación pura
 */
const productosIniciales = [
  {
    id: 'demo-001',
    nombre: 'Mug Blanco 11oz',
    categoria: 'Mugs',
    imagen: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop',
    esPersonalizable: true,
    precioSinPersonalizar: 8000,
    precioPersonalizado: 15000,
    moneda: 'COP',
    escalasVolumen: [
      { minUnidades: 1, maxUnidades: 11, precioSinPersonalizar: 8000, precioPersonalizado: 15000 },
      { minUnidades: 12, maxUnidades: 50, precioSinPersonalizar: 7200, precioPersonalizado: 13500 },
      { minUnidades: 51, maxUnidades: 999, precioSinPersonalizar: 6400, precioPersonalizado: 12000 },
    ],
  },
  {
    id: 'demo-002',
    nombre: 'Camiseta Algodón Blanca',
    categoria: 'Camisetas',
    imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    esPersonalizable: true,
    precioSinPersonalizar: 18000,
    precioPersonalizado: 28000,
    moneda: 'COP',
    escalasVolumen: [
      { minUnidades: 1, maxUnidades: 11, precioSinPersonalizar: 18000, precioPersonalizado: 28000 },
      { minUnidades: 12, maxUnidades: 50, precioSinPersonalizar: 15800, precioPersonalizado: 24600 },
      { minUnidades: 51, maxUnidades: 999, precioSinPersonalizar: 14000, precioPersonalizado: 21800 },
    ],
    configEstampado: {
      tamanos: [
        { id: 'bolsillo', nombre: 'Bolsillo', precioPrincipal: 22000, precioAdicional: 3000 },
        { id: 'carta', nombre: 'Carta', precioPrincipal: 28000, precioAdicional: 5000 },
        { id: 'tabloide', nombre: 'Tabloide', precioPrincipal: 35000, precioAdicional: 8000 },
      ],
    },
  },
];

/**
 * Obtiene la última copia en caché del almacenamiento local
 */
export function getProductosLocales() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    for (const oldKey of OLD_STORAGE_KEYS) {
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        const parsed = JSON.parse(oldData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProductosLocales(parsed);
          return parsed;
        }
      }
    }

    setProductosLocales(productosIniciales);
    return productosIniciales;
  } catch {
    return productosIniciales;
  }
}

/**
 * Guarda los productos en el caché permanente del dispositivo
 */
export function setProductosLocales(productos) {
  try {
    if (Array.isArray(productos)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    }
  } catch (err) {
    console.error('Error guardando en caché local:', err);
  }
}

/**
 * Convierte un producto de la App al formato de fila para Supabase.
 * NO incluye "es_personalizable" como columna separada; lo guardamos
 * dentro del JSON config_estampado para no depender de columnas nuevas.
 */
function productoAFilaSupabase(producto) {
  const configEstampado = producto.configEstampado
    ? { ...producto.configEstampado }
    : {};

  configEstampado.esPersonalizable = producto.esPersonalizable !== undefined ? producto.esPersonalizable : true;
  configEstampado.soloPersonalizado = Boolean(producto.soloPersonalizado);
  configEstampado.tieneDescuentoVolumen = producto.tieneDescuentoVolumen !== undefined ? Boolean(producto.tieneDescuentoVolumen) : (Array.isArray(producto.escalasVolumen) && producto.escalasVolumen.length > 0);
  configEstampado.ultimaActualizacion = producto.ultimaActualizacion || new Date().toISOString();
  configEstampado.responsable = producto.responsable || 'Administrador';
  configEstampado.historialPrecios = producto.historialPrecios || [];

  return {
    id: producto.id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    imagen: producto.imagen,
    precio_sin_personalizar: producto.precioSinPersonalizar,
    precio_personalizado: producto.precioPersonalizado,
    moneda: producto.moneda || 'COP',
    escalas_volumen: producto.escalasVolumen || [],
    config_estampado: configEstampado,
  };
}

/**
 * Convierte una fila de Supabase al formato de la App.
 */
function filaSupabaseAProducto(item) {
  const configRaw = item.config_estampado || {};
  const esPersonalizable = configRaw.esPersonalizable !== undefined
    ? configRaw.esPersonalizable
    : true;
  const soloPersonalizado = Boolean(configRaw.soloPersonalizado);
  const tieneDescuentoVolumen = configRaw.tieneDescuentoVolumen !== undefined
    ? Boolean(configRaw.tieneDescuentoVolumen)
    : (Array.isArray(item.escalas_volumen) && item.escalas_volumen.length > 0);

  const tieneEstampado = configRaw.tamanos && configRaw.tamanos.length > 0;
  const configEstampado = tieneEstampado
    ? {
        titulo: configRaw.titulo || '',
        aditivo: Boolean(configRaw.aditivo),
        tamanos: configRaw.tamanos,
      }
    : null;

  return {
    id: item.id,
    nombre: item.nombre,
    categoria: item.categoria,
    imagen: item.imagen,
    esPersonalizable,
    soloPersonalizado,
    tieneDescuentoVolumen,
    precioSinPersonalizar: Number(item.precio_sin_personalizar) || 0,
    precioPersonalizado: Number(item.precio_personalizado) || 0,
    moneda: item.moneda || 'COP',
    escalasVolumen: item.escalas_volumen || [],
    configEstampado,
    ultimaActualizacion: configRaw.ultimaActualizacion || item.created_at || new Date().toISOString(),
    responsable: configRaw.responsable || 'Administrador',
    historialPrecios: Array.isArray(configRaw.historialPrecios) ? configRaw.historialPrecios : [],
  };
}

/**
 * Carga los productos (desde Supabase si hay internet, o de la memoria local si está offline).
 */
export async function cargarProductos() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('⚠️ Error consultando Supabase, usando caché local:', error.message);
      } else if (data) {
        if (data.length === 0) {
          await sembrarProductosInicialesSupabase();
          return productosIniciales;
        }

        const productosProcesados = data.map(filaSupabaseAProducto);
        setProductosLocales(productosProcesados);
        return productosProcesados;
      }
    } catch (e) {
      console.warn('Sin conexión a Supabase, usando caché del dispositivo:', e.message);
    }
  }

  return getProductosLocales();
}

/**
 * Poblar la base de datos inicial si está vacía en Supabase
 */
async function sembrarProductosInicialesSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const filas = productosIniciales.map(productoAFilaSupabase);
    const { error } = await supabase.from('productos').upsert(filas);
    if (error) console.error('Error poblando Supabase:', error);
    setProductosLocales(productosIniciales);
  } catch (e) {
    console.error('Error poblando productos iniciales:', e);
  }
}

/**
 * Guardar/Añadir producto (Supabase + LocalStorage)
 */
export async function addProducto(producto) {
  const actuales = getProductosLocales();
  const nuevos = [...actuales, producto];
  setProductosLocales(nuevos);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('productos').upsert([productoAFilaSupabase(producto)]);
      if (error) {
        console.error('Error al guardar en Supabase:', error.message);
      }
    } catch (e) {
      console.error('Error de red al guardar en Supabase:', e);
    }
  }
  return nuevos;
}

/**
 * Actualizar producto (Supabase + LocalStorage)
 */
export async function updateProducto(productoActualizado) {
  const actuales = getProductosLocales();
  const nuevos = actuales.map((p) => (p.id === productoActualizado.id ? productoActualizado : p));
  setProductosLocales(nuevos);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('productos').upsert([productoAFilaSupabase(productoActualizado)]);
      if (error) {
        console.error('Error al actualizar en Supabase:', error.message);
      }
    } catch (e) {
      console.error('Error de red al actualizar en Supabase:', e);
    }
  }
  return nuevos;
}

/**
 * Eliminar producto (Supabase + LocalStorage)
 */
export async function deleteProducto(id) {
  const actuales = getProductosLocales();
  const nuevos = actuales.filter((p) => p.id !== id);
  setProductosLocales(nuevos);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) console.warn('Error al eliminar en Supabase:', error.message);
    } catch (e) {
      console.error('Error al eliminar de Supabase:', e);
    }
  }
  return nuevos;
}

/**
 * Eliminar una categoría completa (desasigna los productos que la tenían)
 */
export async function eliminarCategoria(nombreCategoria) {
  const actuales = getProductosLocales();
  const nuevos = actuales.map((p) => (p.categoria === nombreCategoria ? { ...p, categoria: '' } : p));
  setProductosLocales(nuevos);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('productos').update({ categoria: '' }).eq('categoria', nombreCategoria);
    } catch (e) {
      console.error('Error al eliminar categoría en Supabase:', e);
    }
  }
  return nuevos;
}

/**
 * Renombrar una categoría existente en todos los productos
 */
export async function renombrarCategoria(nombreAntiguo, nombreNuevo) {
  const actuales = getProductosLocales();
  const nuevos = actuales.map((p) => (p.categoria === nombreAntiguo ? { ...p, categoria: nombreNuevo } : p));
  setProductosLocales(nuevos);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('productos').update({ categoria: nombreNuevo }).eq('categoria', nombreAntiguo);
    } catch (e) {
      console.error('Error al renombrar categoría en Supabase:', e);
    }
  }
  return nuevos;
}

/**
 * Suscribirse a cambios en TIEMPO REAL desde Supabase
 */
export function suscribirCambiosTiempoReal(onUpdate) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('realtime_productos_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'productos' },
      async () => {
        const productosActualizados = await cargarProductos();
        onUpdate(productosActualizados);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Obtener categorías de la lista de productos
 */
export function getCategoriasFromProductos(productos) {
  const categorias = new Set();
  (productos || []).forEach((p) => {
    if (p && p.categoria && p.categoria.trim()) {
      categorias.add(p.categoria.trim());
    }
  });
  return Array.from(categorias).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}
