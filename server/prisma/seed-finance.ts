import { PrismaClient } from '@prisma/client';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../src/constants/chartOfAccounts.js';
import { roundMoney } from '../src/utils/finance.js';

export async function seedFinance(prisma: PrismaClient, adminUserId?: string) {
  for (const tpl of DEFAULT_CHART_OF_ACCOUNTS) {
    await prisma.chartOfAccount.upsert({
      where: { code: tpl.code },
      update: {
        name: tpl.name,
        category: tpl.category,
        subCategory: tpl.subCategory,
        normalBalance: tpl.normalBalance,
      },
      create: {
        code: tpl.code,
        name: tpl.name,
        category: tpl.category,
        subCategory: tpl.subCategory,
        normalBalance: tpl.normalBalance,
      },
    });
  }

  if (!adminUserId) return;

  const existingPosted = await prisma.journalEntry.count({ where: { status: 'POSTED' } });
  if (existingPosted > 0) return;

  const bank = await prisma.chartOfAccount.findUnique({ where: { code: '1010' } });
  const revenue = await prisma.chartOfAccount.findUnique({ where: { code: '4000' } });
  const salaries = await prisma.chartOfAccount.findUnique({ where: { code: '5000' } });
  const ap = await prisma.chartOfAccount.findUnique({ where: { code: '2000' } });

  if (!bank || !revenue || !salaries || !ap) return;

  const amount = 15000;

  // Sample posted journal: solar installation revenue received
  const je1 = await prisma.journalEntry.create({
    data: {
      entryNumber: `JE-${new Date().getFullYear()}-00001`,
      entryDate: new Date(),
      reference: 'INV-2026-001',
      description: 'Solar installation payment — sample seed',
      status: 'POSTED',
      createdById: adminUserId,
      approvedById: adminUserId,
      postedById: adminUserId,
      submittedAt: new Date(),
      approvedAt: new Date(),
      postedAt: new Date(),
      lines: {
        create: [
          { accountId: bank.id, debit: amount, credit: 0, lineOrder: 0, description: 'Bank deposit' },
          { accountId: revenue.id, debit: 0, credit: amount, lineOrder: 1, description: 'Installation revenue' },
        ],
      },
    },
  });

  await prisma.chartOfAccount.update({
    where: { id: bank.id },
    data: { balance: roundMoney(bank.balance + amount) },
  });
  await prisma.chartOfAccount.update({
    where: { id: revenue.id },
    data: { balance: roundMoney(revenue.balance + amount) },
  });

  // Sample draft: salaries accrual
  await prisma.journalEntry.create({
    data: {
      entryNumber: `JE-${new Date().getFullYear()}-00002`,
      entryDate: new Date(),
      reference: 'PAY-MAR-2026',
      description: 'Monthly salaries accrual — sample draft',
      status: 'DRAFT',
      createdById: adminUserId,
      lines: {
        create: [
          { accountId: salaries.id, debit: 8500, credit: 0, lineOrder: 0 },
          { accountId: ap.id, debit: 0, credit: 8500, lineOrder: 1, description: 'Salaries payable' },
        ],
      },
    },
  });

  void je1;
}
