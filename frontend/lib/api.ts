import { Category, Expense, ExpenseRequest, Invoice, MoveExpenseRequest, YearStats } from './types'

const BASE_URL = 'http://localhost:8080/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Error ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Categories
export const api = {
  categories: {
    list: () => request<Category[]>('/categories'),
    create: (data: Omit<Category, 'id'>) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Omit<Category, 'id'>) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  expenses: {
    list: (params?: { year?: number; month?: number; categoryId?: number }) => {
      const q = new URLSearchParams()
      if (params?.year) q.set('year', String(params.year))
      if (params?.month) q.set('month', String(params.month))
      if (params?.categoryId) q.set('categoryId', String(params.categoryId))
      return request<Expense[]>(`/expenses?${q}`)
    },
    years: () => request<number[]>('/expenses/years'),
    stats: (year: number) => request<YearStats>(`/expenses/stats?year=${year}`),
    get: (id: number) => request<Expense>(`/expenses/${id}`),
    create: (data: ExpenseRequest) =>
      request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: ExpenseRequest) =>
      request<Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    move: (id: number, data: MoveExpenseRequest) =>
      request<Expense>(`/expenses/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<void>(`/expenses/${id}`, { method: 'DELETE' }),
  },

  invoices: {
    byExpense: (expenseId: number) => request<Invoice[]>(`/invoices/expense/${expenseId}`),
    byYear: (year: number) => request<Invoice[]>(`/invoices/year/${year}`),
    upload: async (expenseId: number, file: File): Promise<Invoice> => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BASE_URL}/invoices/upload/${expenseId}`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return res.json()
    },
    delete: (id: number) =>
      request<void>(`/invoices/${id}`, { method: 'DELETE' }),
  },
}
