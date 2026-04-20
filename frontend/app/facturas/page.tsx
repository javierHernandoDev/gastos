'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Invoice } from '@/lib/types'
import YearSelector from '@/components/YearSelector'
import InvoiceCard from '@/components/InvoiceCard'
import { FileText } from 'lucide-react'

export default function FacturasPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [years, setYears] = useState<number[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.expenses.years().then(setYears).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api.invoices
      .byYear(year)
      .then(setInvoices)
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }, [year])

  // Agrupar por nombre de gasto
  const grouped = invoices.reduce<Record<string, Invoice[]>>((acc, inv) => {
    const key = inv.expenseName
    acc[key] = acc[key] ? [...acc[key], inv] : [inv]
    return acc
  }, {})

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {invoices.length} factura{invoices.length !== 1 ? 's' : ''} en {year}
          </p>
        </div>
        <YearSelector year={year} years={years} onChange={setYear} />
      </div>

      {loading ? (
        <div className="card h-48 animate-pulse bg-slate-100" />
      ) : invoices.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No hay facturas en {year}</p>
          <p className="text-sm text-slate-400 mt-1">Sube facturas desde la sección de Gastos</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([expenseName, invs]) => (
            <div key={expenseName} className="card space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
                {expenseName}
              </h2>
              {invs.map(inv => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  onDeleted={id => setInvoices(i => i.filter(x => x.id !== id))}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
