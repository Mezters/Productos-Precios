import { PackageOpen, Plus } from 'lucide-react';

export default function EmptyState({ isSearch, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 animate-fadeIn">
      <div className="w-20 h-20 rounded-2xl bg-surface-100 flex items-center justify-center mb-5">
        <PackageOpen className="w-10 h-10 text-surface-300" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-surface-700 mb-2">
        {isSearch ? 'Sin resultados' : 'Sin productos'}
      </h3>
      <p className="text-sm text-surface-400 text-center max-w-xs mb-6 leading-relaxed">
        {isSearch
          ? 'No se encontraron productos que coincidan con tu búsqueda. Intenta con otro término.'
          : 'Comienza añadiendo tu primer producto al catálogo para empezar a cotizar.'}
      </p>
      {!isSearch && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-200 cursor-pointer active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          Añadir Producto
        </button>
      )}
    </div>
  );
}
