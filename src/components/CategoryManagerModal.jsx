import { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Check, FolderOpen, Layers } from 'lucide-react';

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categorias,
  productos,
  onEliminarCategoria,
  onRenombrarCategoria,
}) {
  const [editingCat, setEditingCat] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setEditingCat(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const getProductCount = (catName) => {
    return productos.filter((p) => p.categoria === catName).length;
  };

  const handleStartEdit = (cat) => {
    setEditingCat(cat);
    setNewName(cat);
  };

  const handleSaveRename = (oldName) => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== oldName) {
      onRenombrarCategoria(oldName, trimmed);
    }
    setEditingCat(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slideUp flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-900">
                Gestionar Categorías
              </h3>
              <p className="text-xs text-surface-400">
                Edita o elimina las categorías de tu catálogo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 scrollbar-thin">
          {categorias.length === 0 ? (
            <p className="text-sm text-surface-400 py-8 text-center">
              No hay categorías creadas aún.
            </p>
          ) : (
            categorias.map((cat) => {
              const count = getProductCount(cat);
              const isEditing = editingCat === cat;

              return (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-100 hover:border-surface-200 transition-all"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-primary-300 rounded-lg text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(cat);
                          if (e.key === 'Escape') setEditingCat(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveRename(cat)}
                        className="w-7 h-7 rounded-lg bg-accent-500 text-white flex items-center justify-center hover:bg-accent-600 transition-all cursor-pointer shrink-0"
                        title="Guardar nombre"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCat(null)}
                        className="w-7 h-7 rounded-lg bg-surface-200 text-surface-600 flex items-center justify-center hover:bg-surface-300 transition-all cursor-pointer shrink-0"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm font-semibold text-surface-800">
                          {cat}
                        </span>
                        <span className="ml-2 text-xs text-surface-400">
                          ({count} producto{count !== 1 ? 's' : ''})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-all cursor-pointer"
                          title="Renombrar categoría"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `¿Eliminar la categoría "${cat}"? Los ${count} productos en ella quedarán sin categoría.`
                              )
                            ) {
                              onEliminarCategoria(cat);
                            }
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-all cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-surface-100 bg-surface-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-900 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
