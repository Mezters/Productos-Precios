import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Cloud, CloudOff, WifiOff, LayoutList, LayoutGrid } from 'lucide-react';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import CategoryManagerModal from './components/CategoryManagerModal';
import ProductCard from './components/ProductCard';
import ProductListItem from './components/ProductListItem';
import ProductModal from './components/ProductModal';
import QuoterModal from './components/QuoterModal';
import CartDrawer from './components/CartDrawer';
import PriceHistoryModal from './components/PriceHistoryModal';
import ConfirmDialog from './components/ConfirmDialog';
import EmptyState from './components/EmptyState';
import {
  cargarProductos,
  addProducto,
  updateProducto,
  deleteProducto,
  eliminarCategoria,
  renombrarCategoria,
  getCategoriasFromProductos,
  suscribirCambiosTiempoReal,
} from './utils/storage';
import { isSupabaseConfigured } from './utils/supabase';
import { formatCurrency, recalcularCarritoConAcumulacion } from './utils/helpers';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  
  // Vista: 'list' (por defecto) o 'grid'
  const [viewMode, setViewMode] = useState('list');

  // Carrito de Cotización Activa (Multiproducto)
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [quoteTarget, setQuoteTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Detectar cambios en el estado de la conexión a internet
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar productos al inicio
  useEffect(() => {
    async function init() {
      setCargando(true);
      const data = await cargarProductos();
      setProductos(data);
      setCargando(false);
    }
    init();
  }, []);

  // Suscribirse a actualizaciones en TIEMPO REAL desde Supabase
  useEffect(() => {
    const unsubscribe = suscribirCambiosTiempoReal((productosActualizados) => {
      setProductos(productosActualizados);
    });
    return () => unsubscribe();
  }, []);

  // Categorías derivadas dinámicamente de los productos
  const categorias = useMemo(() => {
    return getCategoriasFromProductos(productos);
  }, [productos]);

  // Mostrar notificación breve
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Agregar al Carrito de Cotización
  const handleAddToCart = (item) => {
    setCartItems((prev) => [...prev, item]);
    showToast(`🛒 "${item.nombre}" añadido a la cotización`);
  };

  const handleRemoveFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Recalcular ítems del carrito acumulando volumen por categoría/familia (ej: prendas PD)
  const cartItemsProcesados = useMemo(() => {
    return recalcularCarritoConAcumulacion(cartItems, productos);
  }, [cartItems, productos]);

  const cartGrandTotal = useMemo(() => {
    return cartItemsProcesados.reduce((sum, item) => sum + (item.precioTotal || 0), 0);
  }, [cartItemsProcesados]);

  // Guardar (crear o actualizar)
  const handleSave = async (productoData) => {
    if (editProduct) {
      const actualizados = await updateProducto(productoData);
      setProductos(actualizados);
      showToast('Producto actualizado correctamente');
    } else {
      const actualizados = await addProducto(productoData);
      setProductos(actualizados);
      showToast('Producto creado correctamente');
    }
  };

  // Abrir modal para nuevo
  const handleOpenNew = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (producto) => {
    setEditProduct(producto);
    setModalOpen(true);
  };

  // Abrir modal prellenado para duplicar producto
  const handleDuplicate = (producto) => {
    if (!producto) return;
    const copia = JSON.parse(JSON.stringify(producto));
    delete copia.id;
    copia.nombre = `${producto.nombre} (Copia)`;
    setEditProduct(copia);
    setModalOpen(true);
  };

  // Abrir cotizador rápido
  const handleQuote = (producto) => {
    setQuoteTarget(producto);
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const actualizados = await deleteProducto(deleteTarget);
    setProductos(actualizados);
    setDeleteTarget(null);
    showToast('Producto eliminado', 'danger');
  };

  // Eliminar categoría
  const handleEliminarCategoria = async (nombreCategoria) => {
    const actualizados = await eliminarCategoria(nombreCategoria);
    setProductos(actualizados);
    showToast(`Categoría "${nombreCategoria}" eliminada`);
  };

  // Renombrar categoría
  const handleRenombrarCategoria = async (nombreAntiguo, nombreNuevo) => {
    const actualizados = await renombrarCategoria(nombreAntiguo, nombreNuevo);
    setProductos(actualizados);
    showToast(`Categoría renombrada a "${nombreNuevo}"`);
  };

  // Productos filtrados por búsqueda y categoría
  const productosFiltrados = useMemo(() => {
    const actCatNorm = categoriaActiva ? categoriaActiva.trim().toLowerCase() : '';
    const searchNorm = searchQuery ? searchQuery.trim().toLowerCase() : '';

    return productos.filter((p) => {
      const pCatNorm = p.categoria ? p.categoria.trim().toLowerCase() : '';
      const pNombreNorm = p.nombre ? p.nombre.toLowerCase() : '';

      const matchesSearch =
        !searchNorm ||
        pNombreNorm.includes(searchNorm) ||
        pCatNorm.includes(searchNorm);

      const matchesCategory = !actCatNorm || pCatNorm === actCatNorm;

      return matchesSearch && matchesCategory;
    });
  }, [productos, searchQuery, categoriaActiva]);

  const isFiltering = Boolean(searchQuery.trim() || categoriaActiva);

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col font-sans text-surface-900 selection:bg-primary-500 selection:text-white pb-28">
      {/* Indicador Offline Amigable */}
      {isOffline && (
        <div className="bg-amber-500 text-surface-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          <span>Modo Offline (Modo Local activo - Tus cotizaciones y productos se guardan en el dispositivo)</span>
        </div>
      )}

      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalProductos={productosFiltrados.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra superior de Categorías y Controles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <CategoryFilter
            categorias={categorias}
            categoriaActiva={categoriaActiva}
            onSelectCategoria={setCategoriaActiva}
            onOpenManageModal={() => setManageCategoriesOpen(true)}
          />

          <div className="flex items-center gap-3 shrink-0">
            {/* Toggle de Vista: Lista vs Tarjetas */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-surface-200 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                }`}
                title="Vista en Lista compacta"
              >
                <LayoutList className="w-3.5 h-3.5" />
                Lista
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                }`}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Tarjetas
              </button>
            </div>
          </div>
        </div>

        {/* Info de estado de sincronización */}
        <div className="flex items-center justify-between gap-2 mb-4 text-xs">
          <div className="text-surface-500">
            Mostrando <strong className="text-surface-900 font-semibold">{productosFiltrados.length}</strong> {productosFiltrados.length === 1 ? 'producto' : 'productos'}
          </div>

          <div className="flex items-center gap-1.5">
            {isSupabaseConfigured ? (
              <span className="flex items-center gap-1.5 text-accent-700 bg-accent-50 px-2.5 py-1 rounded-lg border border-accent-200/60 font-medium">
                <Cloud className="w-3.5 h-3.5 text-accent-600" /> Nube Supabase Sincronizada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-surface-500 bg-surface-100 px-2.5 py-1 rounded-lg border border-surface-200">
                <CloudOff className="w-3.5 h-3.5" /> Modo Local (Dispositivo actual)
              </span>
            )}
          </div>
        </div>

        {/* Lista / Cuadrícula de Productos */}
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : productosFiltrados.length > 0 ? (
          viewMode === 'list' ? (
            <div className="space-y-2.5">
              {productosFiltrados.map((producto) => (
                <ProductListItem
                  key={producto.id}
                  producto={producto}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={setDeleteTarget}
                  onQuote={handleQuote}
                  onViewHistory={(p) => setHistoryTarget(p)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {productosFiltrados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={setDeleteTarget}
                  onQuote={handleQuote}
                  onViewHistory={(p) => setHistoryTarget(p)}
                />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            isSearch={isFiltering}
            onAdd={handleOpenNew}
          />
        )}
      </main>

      {/* Barra flotante de Cotización Multiproducto */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl animate-slideUp">
          <div
            onClick={() => setCartOpen(true)}
            className="bg-gradient-to-r from-surface-900 to-surface-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-surface-700/60 flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary-500/30 shrink-0">
                {cartItems.length}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-primary-300 uppercase tracking-wider block">
                  Cotización Multiproducto Activa
                </span>
                <span className="text-xs text-surface-300 truncate block">
                  {cartItems.map((i) => i.nombre).join(', ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-surface-400 block uppercase">Total Acumulado</span>
                <span className="text-base font-black text-white">
                  {formatCurrency(cartGrandTotal, 'COP')}
                </span>
              </div>
              <button className="px-3.5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-md transition-all">
                Ver Resumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante añadir nuevo producto */}
      <button
        id="fab-add-product"
        onClick={handleOpenNew}
        className={`fixed ${
          cartItems.length > 0 ? 'bottom-24 sm:bottom-28' : 'bottom-6 sm:bottom-8'
        } right-6 sm:right-8 w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-2xl shadow-xl shadow-primary-500/30 hover:shadow-primary-500/40 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-30 group`}
        title="Añadir nuevo producto"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
      </button>

      {/* Modal de Crear / Editar Producto */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditProduct(null);
        }}
        onSave={handleSave}
        editProduct={editProduct}
        categoriasExistentes={categorias}
      />

      {/* Modal de Cotización Limpio */}
      <QuoterModal
        isOpen={!!quoteTarget}
        onClose={() => setQuoteTarget(null)}
        producto={quoteTarget}
        onAddToCart={handleAddToCart}
      />

      {/* Drawer / Resumen de Cotización Multiproducto (Carrito) */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItemsProcesados}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Modal de Historial de Precios y Auditoría */}
      <PriceHistoryModal
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        producto={historyTarget}
      />

      {/* Modal de gestión de categorías */}
      <CategoryManagerModal
        isOpen={manageCategoriesOpen}
        onClose={() => setManageCategoriesOpen(false)}
        categorias={categorias}
        productos={productos}
        onEliminarCategoria={handleEliminarCategoria}
        onRenombrarCategoria={handleRenombrarCategoria}
      />

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar producto?"
        message="Esta acción no se puede deshacer. El producto será eliminado permanentemente del catálogo."
      />

      {/* Toast de notificación */}
      {toast && (
        <div
          className={`fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl animate-slideUp ${
            toast.type === 'danger'
              ? 'bg-surface-800 text-white'
              : 'bg-surface-800 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
