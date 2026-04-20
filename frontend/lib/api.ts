import { Category, Expense, ExpenseRequest, Invoice, InvoiceAnalysis, LoginRequest, MoveExpenseRequest, RegisterRequest, AuthResponse, YearStats } from './types'
import { getToken, removeToken } from './auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'

async function request<T>(path: string, options?: RequestInit, skipAuthRedirect = false): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })
  if (!skipAuthRedirect && (res.status === 401 || res.status === 403)) {
    removeToken()
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Error ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    register: (data: RegisterRequest) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }, true),
    login: (data: LoginRequest) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }, true),
    me: () => request<AuthResponse>('/auth/me'),
  },

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
      const token = getToken()
      const res = await fetch(`${BASE_URL}/invoices/upload/${expenseId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (res.status === 401 || res.status === 403) {
        removeToken()
        window.location.href = '/login'
        throw new Error('Sesión expirada')
      }
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return res.json()
    },
    delete: (id: number) =>
      request<void>(`/invoices/${id}`, { method: 'DELETE' }),
    analyze: async (file: File): Promise<InvoiceAnalysis> => {
      const form = new FormData()
      form.append('file', file)
      const token = getToken()
      const res = await fetch(`${BASE_URL}/invoices/analyze`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return res.json()
    },
  },
}
