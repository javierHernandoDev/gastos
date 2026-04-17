'use client'

import clsx from 'clsx'

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

interface Props {
  selected: number | null
  onChange: (month: number | null) => void
}

export default function MonthTabs({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={clsx(
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          selected === null
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'
        )}
      >
        Todos
      </button>
      {MONTHS.map((name, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            selected === i + 1
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'
          )}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
