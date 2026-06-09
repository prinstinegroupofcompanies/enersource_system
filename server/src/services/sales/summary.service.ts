import { prisma } from '../../lib/prisma.js';
import { refreshInvoiceStatuses } from '../../utils/sales.js';
import { roundMoney } from '../../utils/finance.js';

export async function getSalesSummary() {
  await refreshInvoiceStatuses();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [paidInvoices, sentInvoices, overdueCount, ordersConfirmed, quotesSent, customers] =
    await Promise.all([
      prisma.invoice.findMany({
        where: { status: 'PAID', paidAt: { gte: startOfMonth } },
      }),
      prisma.invoice.findMany({ where: { status: { in: ['SENT', 'OVERDUE'] } } }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      prisma.salesOrder.count({ where: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } } }),
      prisma.quotation.count({ where: { status: 'SENT' } }),
      prisma.customer.count({ where: { isActive: true } }),
    ]);

  const monthlyRevenue = roundMoney(paidInvoices.reduce((s, i) => s + i.total, 0));
  const pendingInvoices = roundMoney(
    sentInvoices.reduce((s, i) => s + (i.total - i.amountPaid), 0)
  );
  const totalSales = roundMoney(
    (await prisma.salesOrder.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }))
      ._sum.total ?? 0
  );

  return {
    totalSales,
    monthlyRevenue,
    pendingInvoices,
    overdueInvoices: overdueCount,
    activeOrders: ordersConfirmed,
    openQuotations: quotesSent,
    customerCount: customers,
    salesTarget: 100000,
    targetProgress: roundMoney((monthlyRevenue / 100000) * 100),
  };
}
