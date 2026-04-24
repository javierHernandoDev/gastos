'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Loader2, Bell, Mail, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getStoredUser } from '@/lib/auth'

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [budget, setBudget] = useState<string>('')
  const user = getStoredUser()

  useEffect(() => {
    api.settings.get()
      .then(s => setBudget(s.monthlyBudget != null ? String(s.monthlyBudget) : ''))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const value = budget.trim() === '' ? null : parseFloat(budget)
      await api.settings.update({ monthlyBudget: value })
      toast.success('Configuración guardada')
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ajustes de tu cuenta</p>
      </div>

      {loading ? (
        <div className="card h-40 animate-pulse bg-slate-100" />
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Alerta de presupuesto mensual</p>
              <p className="text-sm text-slate-500">Recibe un correo cuando superes el límite</p>
            </div>
          </div>

          {/* Email info */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>Las alertas se enviarán a <strong>{user?.email}</strong></span>
          </div>

          {/* Budget input */}
          <div>
            <label className="label">Límite mensual (€)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">€</span>
              <input
                className="input pl-7"
                type="number"
                min="1"
                step="0.01"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="Ej. 2000"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Deja el campo vacío para desactivar las alertas.
            </p>
          </div>

          {/* Resend notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
            <p className="font-medium">⚙️ Requiere API key de Resend</p>
            <p>Para que el correo funcione añade esta variable en Railway:</p>
            <ul className="mt-1 space-y-0.5 font-mono text-xs">
              <li><span className="font-semibold">RESEND_API_KEY</span> — tu API key de resend.com</li>
            </ul>
            <p className="text-xs mt-1">
              Regístrate gratis en <span className="font-mono">resend.com</span> → API Keys → Create API Key
            </p>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : <><CheckCircle className="h-4 w-4" /> Guardar configuración</>
              }
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
