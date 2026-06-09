export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory?: string | null;
  normalBalance: string;
  description?: string | null;
  isActive: boolean;
  balance: number;
}

export interface JournalLine {
  id: string;
  accountId: string;
  description?: string | null;
  debit: number;
  credit: number;
  account?: { code: string; name: string };
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  reference?: string | null;
  description: string;
  status: string;
  isRecurring: boolean;
  lines: JournalLine[];
  createdBy?: { firstName: string; lastName: string; email: string };
  approvedBy?: { firstName: string; lastName: string } | null;
}

export interface TrialBalance {
  period: { from: string; to: string };
  rows: { code: string; name: string; category: string; debit: number; credit: number; balance: number }[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  errors: string[];
}

export interface FinanceSummary {
  totalAccounts: number;
  pendingApproval: number;
  monthlyRevenue: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  cashBalance: number;
}
