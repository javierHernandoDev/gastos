'use client'

import { AlertTriangle, X } from 'lucide-react'

interface Props {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteConfirmModal({ title, message, onConfirm, onCancel, loading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onCancel} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn-danger" disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
