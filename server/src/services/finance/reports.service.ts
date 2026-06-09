import { prisma } from '../../lib/prisma.js';
import { parseDateRange, roundMoney, sumDebits, sumCredits } from '../../utils/finance.js';

export async function getTrialBalance(params: { from?: string; to?: string; period?: string }) {
  const { from, to } = parseDateRange(params);

  const accounts = await prisma.chartOfAccount.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  const lines = await prisma.journalLine.findMany({
    where: {
      journalEntry: {
        status: 'POSTED',
        entryDate: { gte: from, lte: to },
      },
    },
  });

  const byAccount = new Map<string, { debit: number; credit: number }>();
  for (const line of lines) {
    const cur = byAccount.get(line.accountId) ?? { debit: 0, credit: 0 };
    cur.debit = roundMoney(cur.debit + line.debit);
    cur.credit = roundMoney(cur.credit + line.credit);
    byAccount.set(line.accountId, cur);
  }

  const rows = accounts
    .map((acc) => {
      const totals = byAccount.get(acc.id) ?? { debit: 0, credit: 0 };
      return {
        accountId: acc.id,
        code: acc.code,
        name: acc.name,
        category: acc.category,
        debit: totals.debit,
        credit: totals.credit,
        balance: acc.balance,
      };
    })
    .filter((r) => r.debit > 0 || r.credit > 0 || r.balance !== 0);

  const totalDebit = roundMoney(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredit = roundMoney(rows.reduce((s, r) => s + r.credit, 0));
  const balanced = totalDebit === totalCredit;

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    rows,
    totalDebit,
    totalCredit,
    balanced,
    errors: balanced ? [] : [`Out of balance by ${roundMoney(Math.abs(totalDebit - totalCredit))}`],
  };
}

export async function getIncomeStatement(params: { from?: string; to?: string; period?: string }) {
  const { from, to } = parseDateRange(params);
  const tb = await getPeriodActivity(from, to);

  const revenue = sumCategory(tb, 'Revenue');
  const otherIncome = sumCategory(tb, 'Other', true);
  const costOfSales = getAccountAmount(tb, '5100');
  const expenses = sumCategory(tb, 'Expenses');
  const grossProfit = roundMoney(revenue - costOfSales);
  const operatingExpenses = roundMoney(expenses - costOfSales);
  const netProfit = roundMoney(revenue + otherIncome - expenses);

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    revenue: { total: revenue, lines: filterCategory(tb, 'Revenue') },
    costOfSales,
    grossProfit,
    operatingExpenses: { total: operatingExpenses, lines: filterCategory(tb, 'Expenses').filter((l) => l.code !== '5100') },
    otherIncome,
    netProfit,
  };
}

export async function getBalanceSheet(asOf?: string) {
  const date = asOf ? new Date(asOf) : new Date();
  const accounts = await prisma.chartOfAccount.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  const assets = accounts.filter((a) => a.category === 'Assets');
  const liabilities = accounts.filter((a) => a.category === 'Liabilities');
  const equity = accounts.filter((a) => a.category === 'Equity');

  const totalAssets = roundMoney(assets.reduce((s, a) => s + a.balance, 0));
  const totalLiabilities = roundMoney(liabilities.reduce((s, a) => s + a.balance, 0));
  const totalEquity = roundMoney(equity.reduce((s, a) => s + a.balance, 0));

  return {
    asOf: date.toISOString(),
    assets: { total: totalAssets, accounts: assets },
    liabilities: { total: totalLiabilities, accounts: liabilities },
    equity: { total: totalEquity, accounts: equity },
    totalLiabilitiesAndEquity: roundMoney(totalLiabilities + totalEquity),
    balanced: roundMoney(totalAssets) === roundMoney(totalLiabilities + totalEquity),
  };
}

export async function getCashFlowStatement(params: { from?: string; to?: string; period?: string }) {
  const { from, to } = parseDateRange(params);
  const cashCodes = ['1000', '1010', '1020'];
  const accounts = await prisma.chartOfAccount.findMany({
    where: { code: { in: cashCodes } },
  });

  const lines = await prisma.journalLine.findMany({
    where: {
      accountId: { in: accounts.map((a) => a.id) },
      journalEntry: { status: 'POSTED', entryDate: { gte: from, lte: to } },
    },
    include: {
      journalEntry: { select: { description: true, reference: true } },
      account: { select: { code: true, name: true } },
    },
  });

  const operating = roundMoney(
    lines.reduce((s, l) => s + (l.debit - l.credit), 0)
  );

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    operatingActivities: operating,
    investingActivities: 0,
    financingActivities: 0,
    netCashChange: operating,
    lines: lines.map((l) => ({
      account: l.account.code,
      description: l.description ?? l.journalEntry.description,
      debit: l.debit,
      credit: l.credit,
    })),
  };
}

async function getPeriodActivity(from: Date, to: Date) {
  const lines = await prisma.journalLine.findMany({
    where: {
      journalEntry: { status: 'POSTED', entryDate: { gte: from, lte: to } },
    },
    include: { account: true },
  });

  return lines.map((l) => ({
    code: l.account.code,
    name: l.account.name,
    category: l.account.category,
    normalBalance: l.account.normalBalance,
    debit: l.debit,
    credit: l.credit,
    amount:
      l.account.normalBalance === 'DEBIT'
        ? roundMoney(l.debit - l.credit)
        : roundMoney(l.credit - l.debit),
  }));
}

function sumCategory(
  rows: { category: string; amount: number; code: string }[],
  category: string,
  incomeOnly = false
): number {
  return roundMoney(
    rows
      .filter((r) => r.category === category && (!incomeOnly || r.amount > 0))
      .reduce((s, r) => s + Math.abs(r.amount), 0)
  );
}

function getAccountAmount(rows: { code: string; amount: number }[], code: string): number {
  return roundMoney(rows.filter((r) => r.code === code).reduce((s, r) => s + Math.abs(r.amount), 0));
}

function filterCategory(
  rows: { code: string; name: string; category: string; amount: number }[],
  category: string
) {
  const grouped = new Map<string, { code: string; name: string; amount: number }>();
  for (const r of rows.filter((x) => x.category === category)) {
    const cur = grouped.get(r.code) ?? { code: r.code, name: r.name, amount: 0 };
    cur.amount = roundMoney(cur.amount + Math.abs(r.amount));
    grouped.set(r.code, cur);
  }
  return [...grouped.values()];
}

export function formatCsv(rows: Record<string, string | number>[], headers: string[]): string {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = headers.join(',');
  const body = rows.map((r) => headers.map((h) => escape(r[h] ?? '')).join(',')).join('\n');
  return `${head}\n${body}`;
}

export { sumDebits, sumCredits };
