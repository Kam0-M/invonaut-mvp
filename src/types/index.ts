export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: 'active' | 'inactive'
  total_invoices: number
  total_amount: number
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client?: Client
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  invoice_date: string
  due_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateInvoiceData {
  client_id: string
  items: Omit<InvoiceItem, 'id'>[]
  invoice_date: string
  due_date: string
  notes?: string
  tax_rate?: number
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  status?: Invoice['status']
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: User
  token?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export type InvoiceStatus = Invoice['status']
export type ClientStatus = Client['status']
