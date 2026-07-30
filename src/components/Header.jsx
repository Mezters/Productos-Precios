import { Search, X } from 'lucide-react';

export default function Header({ searchQuery, onSearchChange, totalProductos }) {
  const isPruebas =
    import.meta.env.VITE_IS_PRUEBAS === 'true' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('pruebas'));

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-surface-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="Centro Tintas"
              className="h-9 sm:h-10 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            {/* Fallback si no existe /logo.png */}
            <div
              className="hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center shadow-lg shadow-primary-500/20"
              style={{ display: 'none' }}
            >
              <span className="text-white font-bold text-sm">CT</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-surface-900 tracking-tight leading-tight">
                Centro Tintas
              </h1>
              <p className="text-[11px] text-surface-400 font-medium -mt-0.5">
                Cotizador de productos{isPruebas ? ' (Pruebas 🧪)' : ''}
              </p>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search
                  className="w-4.5 h-4.5 text-surface-400 group-focus-within:text-primary-500 transition-colors duration-200"
                  strokeWidth={2}
                />
              </div>
              <input
                id="search-input"
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-surface-100/80 border border-surface-200/60 rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* Contador */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg">
              {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
