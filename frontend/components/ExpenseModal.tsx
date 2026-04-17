'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import { Category, Expense, ExpenseRequest } from '@/lib/types'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import UploadZone from './UploadZone'
import InvoiceCard from './InvoiceCard'

interface Props {
  expense?: Expense | null
  categories: Category[]
  onSaved: () => void
  onClose: () => void
}

export default function ExpenseModal({ expense, categories, onSaved, onClose }: Props) {
  const isEditing = !!expense
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState(expense?.invoices ?? [])
  const [form, setForm] = useState<ExpenseRequest>({
    name: expense?.name ?? '',
    amount: expense?.amount ?? ('' as any),
    date: expense?.date ?? new Date().toISOString().split('T')[0],
    categoryId: expense?.category?.id ?? undefined,
    description: expense?.description ?? '',
  })

  function set(field: keyof ExpenseRequest, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditing) {
        await api.expenses.update(expense.id, form)
        toast.success('Gasto actualizado')
      } else {
        await api.expenses.create(form)
        toast.success('Gasto creado')
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Editar gasto' : 'Nuevo gasto'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej. Hipoteca enero"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Importe (€) *</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={e => set('amount', parseFloat(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Fecha *</label>
                <input
                  className="input"
                  type="date"
                  required
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Categoría</label>
              <select
                className="input"
                value={form.categoryId ?? ''}
                onChange={e => set('categoryId', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Sin categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
          </form>

          {isEditing && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-slate-700">Facturas adjuntas</h3>
              {invoices.map(inv => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  onDeleted={id => setInvoices(i => i.filter(x => x.id !== id))}
                />
              ))}
              <UploadZone
                expenseId={expense.id}
                onUploaded={inv => setInvoices(i => [...i, inv])}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="btn-secondary" type="button">
            Cancelar
          </button>
          <button
            form="expense-form"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear gasto'}
          </button>
        </div>
      </div>
    </div>
  )
}
