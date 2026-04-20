export interface Category {
  id: number
  name: string
  color: string
  icon: string
}

export interface Invoice {
  id: number
  expenseId: number
  expenseName: string
  filename: string
  originalName: string
  fileSize: number
  contentType: string
  year: number
  downloadUrl: string
  uploadedAt: string
}

export interface Expense {
  id: number
  name: string
  amount: number
  date: string
  year: number
  month: number
  category: Category | null
  description: string
  createdAt: string
  updatedAt: string
  invoices: Invoice[]
}

export interface MonthStat {
  month: number
  monthName: string
  amount: number
  count: number
}

export interface YearStats {
  year: number
  totalAmount: number
  totalExpenses: number
  monthlyStats: MonthStat[]
}

export interface ExpenseRequest {
  name: string
  amount: number
  date: string
  categoryId?: number
  description?: string
}

export interface MoveExpenseRequest {
  year: number
  month: number
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  name: string
  email: string
}
