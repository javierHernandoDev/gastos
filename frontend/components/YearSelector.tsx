'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  year: number
  years?: number[]
  onChange: (year: number) => void
}

export default function YearSelector({ year, years, onChange }: Props) {
  const availableYears = years && years.length > 0 ? years : [year]
  const idx = availableYears.indexOf(year)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(year - 1)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        title="Año anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <select
        value={year}
        onChange={e => onChange(Number(e.target.value))}
        className="rounded-lg border-0 bg-white py-1.5 px-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600"
      >
        {availableYears.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
        {!availableYears.includes(year) && <option value={year}>{year}</option>}
      </select>
      <button
        onClick={() => onChange(year + 1)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
        title="Año siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
