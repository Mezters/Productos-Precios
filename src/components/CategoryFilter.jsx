import { LayoutGrid, Settings2 } from 'lucide-react';

export default function CategoryFilter({
  categorias,
  categoriaActiva,
  onSelectCategoria,
  onCategoriaChange,
  onOpenManageModal,
}) {
  if (!categorias || categorias.length === 0) return null;

  const handleSelect = (cat) => {
    if (onSelectCategoria) onSelectCategoria(cat);
    if (onCategoriaChange) onCategoriaChange(cat);
  };

  const actCatNorm = categoriaActiva ? categoriaActiva.trim().toLowerCase() : '';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-surface-400" strokeWidth={2} />
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
            Categorías
          </span>
        </div>

        {/* Botón para abrir modal de gestión */}
        <button
          onClick={onOpenManageModal}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-surface-500 hover:text-surface-800 bg-surface-100 hover:bg-surface-200 rounded-lg transition-all cursor-pointer"
          title="Gestionar categorías"
        >
          <Settings2 className="w-3 h-3" />
          Gestionar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Botón "Todas" */}
        <button
          id="category-all"
          onClick={() => handleSelect(null)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer border ${
            !actCatNorm
              ? 'bg-surface-900 text-white border-surface-900 shadow-lg shadow-surface-900/20'
              : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50 hover:border-surface-300 hover:text-surface-800'
          }`}
        >
          Todas
        </button>

        {/* Botones de categoría */}
        {categorias.map((cat) => {
          const catNorm = cat.trim().toLowerCase();
          const isSelected = actCatNorm === catNorm;
          return (
            <button
              key={cat}
              id={`category-${catNorm.replace(/\s+/g, '-')}`}
              onClick={() => handleSelect(isSelected ? null : cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer border ${
                isSelected
                  ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
