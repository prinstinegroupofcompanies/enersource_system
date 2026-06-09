import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import { createAuditLog } from '../audit.service.js';

export async function listFunds() {
  return prisma.pettyCashFund.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function createFund(data: {
  name: string;
  custodianName?: string;
  allocatedAmount: number;
}) {
  return prisma.pettyCashFund.create({
    data: {
      name: data.name,
      custodianName: data.custodianName,
      allocatedAmount: data.allocatedAmount,
      balance: data.allocatedAmount,
    },
  });
}

export async function allocateFund(id: string, amount: number, actorId: string) {
  const fund = await prisma.pettyCashFund.findUnique({ where: { id } });
  if (!fund) throw new Error('Fund not found');

  const updated = await prisma.pettyCashFund.update({
    where: { id },
    data: {
      allocatedAmount: roundMoney(fund.allocatedAmount + amount),
      balance: roundMoney(fund.balance + amount),
    },
  });

  await prisma.pettyCashEntry.create({
    data: {
      fundId: id,
      type: 'REPLENISHMENT',
      amount,
      description: 'Petty cash allocation',
      recordedById: actorId,
    },
  });

  return updated;
}

export async function recordExpense(
  fundId: string,
  data: {
    amount: number;
    description: string;
    reference?: string;
    receiptName?: string;
    receiptPath?: string;
    entryDate?: string;
  },
  recordedById: string
) {
  const fund = await prisma.pettyCashFund.findUnique({ where: { id: fundId } });
  if (!fund) throw new Error('Fund not found');
  if (fund.balance < data.amount) throw new Error('Insufficient petty cash balance');

  await prisma.pettyCashFund.update({
    where: { id: fundId },
    data: { balance: roundMoney(fund.balance - data.amount) },
  });

  return prisma.pettyCashEntry.create({
    data: {
      fundId,
      type: 'EXPENSE',
      amount: data.amount,
      description: data.description,
      reference: data.reference,
      receiptName: data.receiptName,
      receiptPath: data.receiptPath,
      entryDate: data.entryDate ? new Date(data.entryDate) : new Date(),
      recordedById,
    },
  });
}

export async function requestReimbursement(
  fundId: string,
  data: { amount: number; description: string },
  requesterId: string
) {
  return prisma.pettyCashReimbursement.create({
    data: { fundId, amount: data.amount, description: data.description, requesterId },
  });
}

export async function approveReimbursement(id: string, approverId: string) {
  const req = await prisma.pettyCashReimbursement.findUnique({ where: { id } });
  if (!req || req.status !== 'PENDING') throw new Error('Invalid reimbursement');

  const fund = await prisma.pettyCashFund.findUnique({ where: { id: req.fundId } });
  if (!fund) throw new Error('Fund not found');

  await prisma.pettyCashFund.update({
    where: { id: req.fundId },
    data: { balance: roundMoney(fund.balance + req.amount) },
  });

  await prisma.pettyCashEntry.create({
    data: {
      fundId: req.fundId,
      type: 'REPLENISHMENT',
      amount: req.amount,
      description: `Reimbursement: ${req.description}`,
      recordedById: approverId,
    },
  });

  return prisma.pettyCashReimbursement.update({
    where: { id },
    data: { status: 'PAID', approvedById: approverId, approvedAt: new Date(), paidAt: new Date() },
  });
}

export async function getPettyCashReport(period: 'daily' | 'monthly' = 'monthly') {
  const from =
    period === 'daily'
      ? new Date(new Date().setHours(0, 0, 0, 0))
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const funds = await listFunds();
  const entries = await prisma.pettyCashEntry.findMany({
    where: { entryDate: { gte: from } },
    include: { fund: { select: { name: true } } },
    orderBy: { entryDate: 'desc' },
  });

  const expenses = roundMoney(
    entries.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0)
  );
  const replenishments = roundMoney(
    entries.filter((e) => e.type === 'REPLENISHMENT').reduce((s, e) => s + e.amount, 0)
  );

  return {
    period: { from: from.toISOString(), type: period },
    funds,
    totalBalance: roundMoney(funds.reduce((s, f) => s + f.balance, 0)),
    periodExpenses: expenses,
    periodReplenishments: replenishments,
    entries,
    pendingReimbursements: await prisma.pettyCashReimbursement.count({
      where: { status: 'PENDING' },
    }),
  };
}

export async function getProcurementSummary() {
  const [pendingReqs, pendingPayments, pendingReimb] = await Promise.all([
    prisma.purchaseRequisition.count({
      where: { status: { notIn: ['COMPLETED', 'REJECTED'] } },
    }),
    prisma.paymentRequest.count({ where: { status: 'PENDING' } }),
    prisma.pettyCashReimbursement.count({ where: { status: 'PENDING' } }),
  ]);

  return { pendingRequisitions: pendingReqs, pendingPayments, pendingReimbursements: pendingReimb };
}
