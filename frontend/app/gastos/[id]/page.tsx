'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Expense } from '@/lib/types'
import { ArrowLeft, Pencil, Trash2, ArrowRightLeft, Calendar, Tag, FileText, Euro, AlignLeft, Download } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import ExpenseModal from '@/components/ExpenseModal'
import MoveExpenseModal from '@/components/MoveExpenseModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import toast from 'react-hot-toast'

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [expense, setExpense] = useState<Expense | null>(null)
  const [categories, setCategories] = useState<import('@/lib/types').Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showMove, setShowMove] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { api.categories.list().then(setCategories).catch(() => {}) }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.expenses.get(Number(id))
      setExpense(data)
    } catch {
      toast.error('No se pudo cargar el gasto')
      router.push('/gastos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleDelete() {
    if (!expense) return
    setDeleting(true)
    try {
      await api.expenses.delete(expense.id)
      toast.success('Gasto eliminado')
      router.push('/gastos')
    } catch {
      toast.error('Error al eliminar')
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-slate-100 animate-pulse" />
        <div className="card h-48 animate-pulse bg-slate-100" />
        <div className="card h-32 animate-pulse bg-slate-100" />
      </div>
    )
  }

  if (!expense) return null

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      {/* Title + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{expense.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {MONTH_NAMES[expense.month]} {expense.year}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowMove(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200 bg-white"
            title="Mover"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 bg-white"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors border border-red-200 bg-white"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Details card */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">
          Detalles del gasto
        </h2>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <Euro className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Importe</p>
              <p className="text-base font-semibold text-slate-900">{formatEur(expense.amount)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50">
              <Calendar className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Fecha</p>
              <p className="text-sm font-medium text-slate-900">{formatDate(expense.date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50">
              <Tag className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Categoría</p>
              {expense.category ? (
                <span
                  className="mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: expense.category.color + '20',
                    color: expense.category.color || '#6366f1',
                  }}
                >
                  {expense.category.name}
                </span>
              ) : (
                <p className="text-sm text-slate-400">Sin categoría</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50">
              <Calendar className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Período</p>
              <p className="text-sm font-medium text-slate-900">
                {MONTH_NAMES[expense.month]} {expense.year}
              </p>
            </div>
          </div>
        </div>

        {expense.description && (
          <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50">
              <AlignLeft className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Descripción</p>
              <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{expense.description}</p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 flex gap-4">
          <span>Creado: {formatDateTime(expense.createdAt)}</span>
          {expense.updatedAt !== expense.createdAt && (
            <span>Actualizado: {formatDateTime(expense.updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Invoices card */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            Facturas
            {expense.invoices.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {expense.invoices.length}
              </span>
            )}
          </h2>
        </div>

        {expense.invoices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No hay facturas adjuntas</p>
        ) : (
          <div className="space-y-2">
            {expense.invoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                  <FileText className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{inv.filename}</p>
                  <p className="text-xs text-slate-500">
                    {inv.originalName} · {formatSize(inv.fileSize)}
                    {inv.uploadedAt && ` · ${formatDateTime(inv.uploadedAt)}`}
                  </p>
                </div>
                <a
                  href={inv.downloadUrl}
                  download={inv.originalName}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors flex-shrink-0"
                  title="Descargar"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </a>
              </div>
            ))}
          </div>
        )}

        <UploadZone
          expenseId={expense.id}
          onUploaded={inv => setExpense(e => e ? { ...e, invoices: [...e.invoices, inv] } : e)}
        />
      </div>

      {showEdit && (
        <ExpenseModal
          expense={expense}
          categories={categories}
          onSaved={() => { setShowEdit(false); load() }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showMove && (
        <MoveExpenseModal
          expense={expense}
          onMoved={() => { setShowMove(false); load() }}
          onClose={() => setShowMove(false)}
        />
      )}

      {showDelete && (
        <DeleteConfirmModal
          title="Eliminar gasto"
          message={`¿Seguro que quieres eliminar "${expense.name}"? También se eliminarán sus facturas.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
    </div>
  )
}
