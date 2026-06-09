import { api } from './api';
import type { Customer, Invoice, Quotation, SalesOrder, SalesSummary } from '../types/sales';

export const salesApi = {
  summary: (token: string) => api.get<SalesSummary>('/sales/summary', token),
  customers: (token: string, search?: string) =>
    api.get<Customer[]>(`/sales/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`, token),
  createCustomer: (token: string, body: unknown) =>
    api.post<Customer>('/sales/customers', body, token),
  quotations: (token: string, status?: string) =>
    api.get<Quotation[]>(`/sales/quotations${status ? `?status=${status}` : ''}`, token),
  createQuotation: (token: string, body: unknown) =>
    api.post<Quotation>('/sales/quotations', body, token),
  updateQuoteStatus: (token: string, id: string, status: string) =>
    api.patch<Quotation>(`/sales/quotations/${id}/status`, { status }, token),
  convertQuote: (token: string, id: string) =>
    api.post<SalesOrder>(`/sales/quotations/${id}/convert`, {}, token),
  orders: (token: string, status?: string) =>
    api.get<SalesOrder[]>(`/sales/orders${status ? `?status=${status}` : ''}`, token),
  createOrder: (token: string, body: unknown) => api.post<SalesOrder>('/sales/orders', body, token),
  updateOrderStatus: (token: string, id: string, status: string) =>
    api.patch<SalesOrder>(`/sales/orders/${id}/status`, { status }, token),
  invoices: (token: string, status?: string) =>
    api.get<Invoice[]>(`/sales/invoices${status ? `?status=${status}` : ''}`, token),
  createInvoice: (token: string, body: unknown) => api.post<Invoice>('/sales/invoices', body, token),
  invoiceFromOrder: (token: string, orderId: string, dueDate: string) =>
    api.post<Invoice>(`/sales/orders/${orderId}/invoice`, { dueDate }, token),
  sendInvoice: (token: string, id: string) => api.post<Invoice>(`/sales/invoices/${id}/send`, {}, token),
  payInvoice: (token: string, id: string, amount: number) =>
    api.post<Invoice>(`/sales/invoices/${id}/payment`, { amount, method: 'Bank' }, token),
  receivables: (token: string) => api.get<Record<string, unknown>>('/sales/receivables', token),
  payables: (token: string) => api.get<Record<string, unknown>>('/sales/payables', token),
  payVendorBill: (token: string, id: string, amount: number) =>
    api.post(`/sales/vendor-invoices/${id}/pay`, { amount }, token),
  contracts: (token: string) => api.get<Record<string, unknown>[]>('/sales/contracts', token),
  createContract: (token: string, body: unknown) =>
    api.post('/sales/contracts', body, token),
};

export { formatMoney } from './financeApi';
