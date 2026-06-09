export type AccountCategory =
  | 'Assets'
  | 'Liabilities'
  | 'Equity'
  | 'Revenue'
  | 'Expenses'
  | 'Other';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface CoaTemplate {
  code: string;
  name: string;
  category: AccountCategory;
  subCategory: string;
  normalBalance: NormalBalance;
}

export const DEFAULT_CHART_OF_ACCOUNTS: CoaTemplate[] = [
  // Assets
  { code: '1000', name: 'Cash', category: 'Assets', subCategory: 'Cash', normalBalance: 'DEBIT' },
  { code: '1010', name: 'Bank Accounts', category: 'Assets', subCategory: 'Bank Accounts', normalBalance: 'DEBIT' },
  { code: '1020', name: 'Petty Cash', category: 'Assets', subCategory: 'Petty Cash', normalBalance: 'DEBIT' },
  { code: '1100', name: 'Inventory', category: 'Assets', subCategory: 'Inventory', normalBalance: 'DEBIT' },
  { code: '1200', name: 'Accounts Receivable', category: 'Assets', subCategory: 'Accounts Receivable', normalBalance: 'DEBIT' },
  { code: '1500', name: 'Fixed Assets', category: 'Assets', subCategory: 'Fixed Assets', normalBalance: 'DEBIT' },
  // Liabilities
  { code: '2000', name: 'Accounts Payable', category: 'Liabilities', subCategory: 'Accounts Payable', normalBalance: 'CREDIT' },
  { code: '2100', name: 'Loans', category: 'Liabilities', subCategory: 'Loans', normalBalance: 'CREDIT' },
  { code: '2200', name: 'Taxes Payable', category: 'Liabilities', subCategory: 'Taxes Payable', normalBalance: 'CREDIT' },
  { code: '2300', name: 'Accrued Expenses', category: 'Liabilities', subCategory: 'Accrued Expenses', normalBalance: 'CREDIT' },
  // Equity
  { code: '3000', name: 'Capital', category: 'Equity', subCategory: 'Capital', normalBalance: 'CREDIT' },
  { code: '3100', name: 'Retained Earnings', category: 'Equity', subCategory: 'Retained Earnings', normalBalance: 'CREDIT' },
  { code: '3200', name: 'Drawings', category: 'Equity', subCategory: 'Drawings', normalBalance: 'DEBIT' },
  // Revenue
  { code: '4000', name: 'Solar Installation Revenue', category: 'Revenue', subCategory: 'Solar Installation Revenue', normalBalance: 'CREDIT' },
  { code: '4010', name: 'Maintenance Revenue', category: 'Revenue', subCategory: 'Maintenance Revenue', normalBalance: 'CREDIT' },
  { code: '4020', name: 'Service Revenue', category: 'Revenue', subCategory: 'Service Revenue', normalBalance: 'CREDIT' },
  { code: '4030', name: 'Product Sales', category: 'Revenue', subCategory: 'Product Sales', normalBalance: 'CREDIT' },
  // Expenses
  { code: '5000', name: 'Salaries', category: 'Expenses', subCategory: 'Salaries', normalBalance: 'DEBIT' },
  { code: '5010', name: 'Fuel', category: 'Expenses', subCategory: 'Fuel', normalBalance: 'DEBIT' },
  { code: '5020', name: 'Rent', category: 'Expenses', subCategory: 'Rent', normalBalance: 'DEBIT' },
  { code: '5030', name: 'Utilities', category: 'Expenses', subCategory: 'Utilities', normalBalance: 'DEBIT' },
  { code: '5040', name: 'Marketing', category: 'Expenses', subCategory: 'Marketing', normalBalance: 'DEBIT' },
  { code: '5050', name: 'Repairs & Maintenance', category: 'Expenses', subCategory: 'Repairs & Maintenance', normalBalance: 'DEBIT' },
  { code: '5100', name: 'Cost of Sales', category: 'Expenses', subCategory: 'Cost of Sales', normalBalance: 'DEBIT' },
  // Other
  { code: '4900', name: 'Miscellaneous Income', category: 'Other', subCategory: 'Miscellaneous Income', normalBalance: 'CREDIT' },
  { code: '5900', name: 'Miscellaneous Expenses', category: 'Other', subCategory: 'Miscellaneous Expenses', normalBalance: 'DEBIT' },
];

export const JOURNAL_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REVERSED', 'CANCELLED'] as const;
export type JournalStatus = (typeof JOURNAL_STATUSES)[number];
