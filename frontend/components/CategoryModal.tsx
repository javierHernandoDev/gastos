'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Category } from '@/lib/types'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#64748b', '#78716c',
]

const ICONS = [
  '🏠', '⚡', '💧', '🔥', '🏦', '🛡️', '🔧', '🏗️',
  '📱', '🚗', '🛒', '🍽️', '🎓', '💊', '✈️', '🎮',
  '👕', '🌿', '💡', '🔑', '📦', '💰', '🏋️', '🎵',
]

interface Props {
  category?: Category | null
  onSaved: () => void
  onClose: () => void
}

export default function CategoryModal({ category, onSaved, onClose }: Props) {
  const isEditing = !!category
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(category?.name ?? '')
  const [color, setColor] = useState(category?.color ?? COLORS[0])
  const [icon, setIcon] = useState(category?.icon ?? ICONS[0])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      if (isEditing) {
        await api.categories.update(category.id, { name: name.trim(), color, icon })
        toast.success('Categoría actualizada')
      } else {
        await api.categories.create({ name: name.trim(), color, icon })
        toast.success('Categoría creada')
      }
      onSaved()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: color + '20', border: `2px solid ${color}` }}
            >
              {icon}
            </div>
            <span className="font-medium text-slate-800">{name || 'Nombre de categoría'}</span>
          </div>

          {/* Name */}
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Suministros"
              autoFocus
            />
          </div>

          {/* Color */}
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="label">Icono</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className="h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors hover:bg-slate-100"
                  style={icon === ic ? { backgroundColor: color + '20', outline: `2px solid ${color}` } : {}}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : isEditing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
