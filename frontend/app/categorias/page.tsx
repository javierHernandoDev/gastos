'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Category } from '@/lib/types'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import CategoryModal from '@/components/CategoryModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import toast from 'react-hot-toast'

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    api.categories.list()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleDelete(id: number) {
    try {
      await api.categories.delete(id)
      toast.success('Categoría eliminada')
      refresh()
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Categorías</h1>
          <p className="text-sm text-slate-500 mt-0.5">{categories.length} categorías</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva categoría</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Tag className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500 font-medium">No tienes categorías todavía</p>
          <p className="text-sm text-slate-400">Crea categorías para clasificar tus gastos</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
            <Plus className="h-4 w-4" /> Crear primera categoría
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="card flex items-center gap-4 py-4">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: (cat.color ?? '#6366f1') + '20', border: `2px solid ${cat.color ?? '#6366f1'}` }}
              >
                {cat.icon ?? '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{cat.name}</p>
                <div
                  className="inline-block mt-0.5 h-1.5 w-10 rounded-full"
                  style={{ backgroundColor: cat.color ?? '#6366f1' }}
                />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditing(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <CategoryModal
          category={editing}
          onSaved={() => { setShowCreate(false); setEditing(null); refresh() }}
          onClose={() => { setShowCreate(false); setEditing(null) }}
        />
      )}

      {deleting && (
        <DeleteConfirmModal
          title="Eliminar categoría"
          message={`¿Eliminar "${deleting.name}"? Los gastos asociados quedarán sin categoría.`}
          onConfirm={() => { handleDelete(deleting.id); setDeleting(null) }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
