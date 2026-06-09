import { prisma } from '../../lib/prisma.js';
import { parseDateRange, roundMoney } from '../../utils/finance.js';

export async function getGeneralLedger(params: {
  accountId?: string;
  from?: string;
  to?: string;
  period?: string;
}) {
  const { from, to } = parseDateRange(params);

  const accounts = await prisma.chartOfAccount.findMany({
    where: {
      isActive: true,
      ...(params.accountId && { id: params.accountId }),
    },
    orderBy: { code: 'asc' },
  });

  const postedEntries = await prisma.journalEntry.findMany({
    where: {
      status: 'POSTED',
      entryDate: { gte: from, lte: to },
    },
    include: {
      lines: {
        include: { account: { select: { id: true, code: true, name: true } } },
      },
    },
    orderBy: { entryDate: 'asc' },
  });

  const ledger = accounts.map((account) => {
    const movements: {
      date: string;
      entryNumber: string;
      journalId: string;
      reference: string | null;
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }[] = [];

    let running = 0;

    for (const entry of postedEntries) {
      for (const line of entry.lines.filter((l) => l.accountId === account.id)) {
        if (account.normalBalance === 'DEBIT') {
          running = roundMoney(running + line.debit - line.credit);
        } else {
          running = roundMoney(running + line.credit - line.debit);
        }
        movements.push({
          date: entry.entryDate.toISOString(),
          entryNumber: entry.entryNumber,
          journalId: entry.id,
          reference: entry.reference,
          description: line.description ?? entry.description,
          debit: line.debit,
          credit: line.credit,
          balance: running,
        });
      }
    }

    const periodDebit = roundMoney(movements.reduce((s, m) => s + m.debit, 0));
    const periodCredit = roundMoney(movements.reduce((s, m) => s + m.credit, 0));

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        category: account.category,
        normalBalance: account.normalBalance,
        currentBalance: account.balance,
      },
      openingBalance: roundMoney(account.balance - (account.normalBalance === 'DEBIT' ? periodDebit - periodCredit : periodCredit - periodDebit)),
      periodDebit,
      periodCredit,
      closingBalance: running || account.balance,
      movements,
    };
  });

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    accounts: ledger.filter((a) => a.movements.length > 0 || params.accountId),
  };
}

export async function getAccountHistory(accountId: string, from?: string, to?: string) {
  const result = await getGeneralLedger({ accountId, from, to });
  const account = result.accounts[0];
  if (!account) throw new Error('No ledger data for account');
  return account;
}
