export interface AssetsSummary {
  totalAssets: number;
  totalCost: number;
  totalBookValue: number;
  totalDepreciation: number;
  byCategory: { category: string; count: number }[];
}

export interface Asset {
  id: string;
  assetNumber: string;
  name: string;
  description?: string;
  category: string;
  status: string;
  purchaseDate?: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  accumulatedDepreciation: number;
  location?: string;
  bookValue?: number;
  monthlyDepreciation?: number;
  monthsElapsed?: number;
}

export interface SupportSummary {
  openTickets: number;
  inProgressTickets: number;
  customerOpenTickets: number;
  urgentTickets: number;
  recent: {
    id: string;
    ticketNumber: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    customer?: string;
    createdAt: string;
  }[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  customerId?: string;
  customer?: { companyName: string };
  assignedToId?: string;
  createdAt: string;
  _count?: { comments: number };
}

export interface SupportTicketDetail extends SupportTicket {
  comments: { id: string; body: string; authorId: string; createdAt: string }[];
}
