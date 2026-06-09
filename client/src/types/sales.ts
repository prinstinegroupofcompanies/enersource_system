export interface Customer {
  id: string;
  companyName: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  _count?: { invoices: number; quotations: number };
}

export interface SalesSummary {
  totalSales: number;
  monthlyRevenue: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeOrders: number;
  openQuotations: number;
  customerCount: number;
  salesTarget: number;
  targetProgress: number;
}

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  total: number;
  validUntil?: string | null;
  customer: { id: string; companyName: string };
  lines: LineItem[];
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  title: string;
  status: string;
  total: number;
  orderDate: string;
  customer: { id: string; companyName: string };
  lines: LineItem[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  amountPaid: number;
  dueDate: string;
  customer: { id: string; companyName: string; email?: string | null };
  lines: LineItem[];
}
