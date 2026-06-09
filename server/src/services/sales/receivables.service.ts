import { prisma } from '../../lib/prisma.js';
import { refreshInvoiceStatuses } from '../../utils/sales.js';
import { roundMoney } from '../../utils/finance.js';

function agingBucket(daysPast: number): string {
  if (daysPast <= 0) return 'current';
  if (daysPast <= 30) return 'days30';
  if (daysPast <= 60) return 'days60';
  if (daysPast <= 90) return 'days90';
  return 'over90';
}

export async function getReceivablesAging() {
  await refreshInvoiceStatuses();

  const open = await prisma.invoice.findMany({
    where: { status: { in: ['SENT', 'OVERDUE'] } },
    include: { customer: { select: { id: true, companyName: true } } },
    orderBy: { dueDate: 'asc' },
  });

  const now = new Date();
  const bucketTotals: Record<string, number> = {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    over90: 0,
  };

  const invoices = open.map((inv) => {
    const balance = roundMoney(inv.total - inv.amountPaid);
    const daysPast = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const bucket = agingBucket(daysPast);
    bucketTotals[bucket] = roundMoney(bucketTotals[bucket] + balance);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customer.companyName,
      customerId: inv.customer.id,
      dueDate: inv.dueDate,
      total: inv.total,
      amountPaid: inv.amountPaid,
      balance,
      daysPast,
      bucket,
      status: inv.status,
    };
  });

  const customerMap = new Map<string, { companyName: string; outstanding: number; invoiceCount: number }>();
  for (const inv of invoices) {
    const cur = customerMap.get(inv.customerId) ?? {
      companyName: inv.customer,
      outstanding: 0,
      invoiceCount: 0,
    };
    cur.outstanding = roundMoney(cur.outstanding + inv.balance);
    cur.invoiceCount += 1;
    customerMap.set(inv.customerId, cur);
  }

  const totalOutstanding = roundMoney(invoices.reduce((s, i) => s + i.balance, 0));

  return {
    summary: {
      totalOutstanding,
      ...bucketTotals,
      invoiceCount: open.length,
    },
    invoices,
    customerBalances: [...customerMap.entries()].map(([customerId, v]) => ({
      customerId,
      companyName: v.companyName,
      outstanding: v.outstanding,
      invoiceCount: v.invoiceCount,
    })),
  };
}
