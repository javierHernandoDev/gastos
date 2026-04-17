'use client'

import { Invoice } from '@/lib/types'
import { FileText, Download, Trash2, Image } from 'lucide-react'
import { useState } from 'react'
import DeleteConfirmModal from './DeleteConfirmModal'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Props {
  invoice: Invoice
  onDeleted: (id: number) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function InvoiceCard({ invoice, onDeleted }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isImage = invoice.contentType?.startsWith('image/')

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.invoices.delete(invoice.id)
      onDeleted(invoice.id)
      toast.success('Factura eliminada')
    } catch {
      toast.error('Error al eliminar la factura')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
          {isImage ? (
            <Image className="h-5 w-5 text-indigo-600" />
          ) : (
            <FileText className="h-5 w-5 text-indigo-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{invoice.filename}</p>
          <p className="text-xs text-slate-500">
            {invoice.originalName} · {formatSize(invoice.fileSize)}
          </p>
        </div>
        <div className="flex gap-1">
          <a
            href={invoice.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <DeleteConfirmModal
          title="Eliminar factura"
          message={`¿Seguro que quieres eliminar "${invoice.filename}"?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
    </>
  )
}
