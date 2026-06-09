import type { NormalBalance } from '../constants/chartOfAccounts.js';

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumDebits(lines: { debit: number; credit: number }[]): number {
  return roundMoney(lines.reduce((s, l) => s + l.debit, 0));
}

export function sumCredits(lines: { debit: number; credit: number }[]): number {
  return roundMoney(lines.reduce((s, l) => s + l.credit, 0));
}

export function isBalanced(lines: { debit: number; credit: number }[]): boolean {
  return sumDebits(lines) === sumCredits(lines) && sumDebits(lines) > 0;
}

export function applyLineToBalance(
  currentBalance: number,
  normalBalance: NormalBalance,
  debit: number,
  credit: number
): number {
  if (normalBalance === 'DEBIT') {
    return roundMoney(currentBalance + debit - credit);
  }
  return roundMoney(currentBalance + credit - debit);
}

export function parseDateRange(query: {
  from?: string;
  to?: string;
  period?: string;
}): { from: Date; to: Date } {
  const now = new Date();
  if (query.from && query.to) {
    return {
      from: new Date(query.from),
      to: endOfDay(new Date(query.to)),
    };
  }

  const period = query.period ?? 'monthly';
  const to = endOfDay(now);

  if (period === 'daily') {
    const from = startOfDay(now);
    return { from, to };
  }
  if (period === 'quarterly') {
    const q = Math.floor(now.getMonth() / 3);
    const from = new Date(now.getFullYear(), q * 3, 1);
    return { from, to };
  }
  if (period === 'annual') {
    const from = new Date(now.getFullYear(), 0, 1);
    return { from, to };
  }
  // monthly default
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function nextEntryNumber(prisma: {
  journalEntry: { count: () => Promise<number> };
}): Promise<string> {
  const count = await prisma.journalEntry.count();
  const year = new Date().getFullYear();
  return `JE-${year}-${String(count + 1).padStart(5, '0')}`;
}
