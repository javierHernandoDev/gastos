'use client'

import { useState, useRef } from 'react'
import { Upload, File, X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Invoice } from '@/lib/types'
import toast from 'react-hot-toast'

interface Props {
  expenseId: number
  onUploaded: (invoice: Invoice) => void
}

export default function UploadZone({ expenseId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const inv = await api.invoices.upload(expenseId, file)
      onUploaded(inv)
      toast.success('Factura subida correctamente')
    } catch {
      toast.error('Error al subir la factura')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
        dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {uploading ? (
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      ) : (
        <Upload className="h-8 w-8 text-slate-400" />
      )}
      <p className="text-sm text-slate-600 font-medium">
        {uploading ? 'Subiendo...' : 'Arrastra o haz clic para subir factura'}
      </p>
      <p className="text-xs text-slate-400">PDF, JPG, PNG hasta 20 MB</p>
    </div>
  )
}
