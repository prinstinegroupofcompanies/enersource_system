import { prisma } from '../../lib/prisma.js';
import {
  applyLineToBalance,
  isBalanced,
  nextEntryNumber,
  roundMoney,
} from '../../utils/finance.js';
import type { NormalBalance } from '../../constants/chartOfAccounts.js';
import { createAuditLog } from '../audit.service.js';

export interface JournalLineInput {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
}

export async function listJournals(filters?: {
  status?: string;
  from?: string;
  to?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.from || filters?.to) {
    where.entryDate = {
      ...(filters.from && { gte: new Date(filters.from) }),
      ...(filters.to && { lte: new Date(filters.to) }),
    };
  }

  return prisma.journalEntry.findMany({
    where,
    include: {
      lines: { include: { account: { select: { code: true, name: true } } } },
      createdBy: { select: { firstName: true, lastName: true, email: true } },
      approvedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { entryDate: 'desc' },
    take: 200,
  });
}

export async function getJournal(id: string) {
  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: {
      lines: {
        include: { account: true },
        orderBy: { lineOrder: 'asc' },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
      postedBy: { select: { id: true, firstName: true, lastName: true } },
      reversedFrom: { select: { id: true, entryNumber: true } },
      reversals: { select: { id: true, entryNumber: true, status: true } },
    },
  });
  if (!entry) throw new Error('Journal entry not found');
  return entry;
}

export async function createJournal(
  data: {
    entryDate: string;
    reference?: string;
    description: string;
    isRecurring?: boolean;
    recurringRule?: string;
    lines: JournalLineInput[];
  },
  createdById: string
) {
  validateLines(data.lines);

  const entryNumber = await nextEntryNumber(prisma);

  const entry = await prisma.journalEntry.create({
    data: {
      entryNumber,
      entryDate: new Date(data.entryDate),
      reference: data.reference,
      description: data.description,
      status: 'DRAFT',
      isRecurring: data.isRecurring ?? false,
      recurringRule: data.recurringRule,
      createdById,
      lines: {
        create: data.lines.map((line, i) => ({
          accountId: line.accountId,
          description: line.description,
          debit: roundMoney(line.debit),
          credit: roundMoney(line.credit),
          lineOrder: i,
        })),
      },
    },
    include: { lines: { include: { account: true } } },
  });

  await createAuditLog({
    actorId: createdById,
    action: 'JOURNAL_CREATED',
    entityType: 'JournalEntry',
    entityId: entry.id,
    newValue: { entryNumber: entry.entryNumber },
  });

  return entry;
}

export async function updateJournal(
  id: string,
  data: {
    entryDate?: string;
    reference?: string;
    description?: string;
    lines?: JournalLineInput[];
  },
  actorId: string
) {
  const entry = await prisma.journalEntry.findUnique({ where: { id } });
  if (!entry) throw new Error('Journal entry not found');
  if (entry.status !== 'DRAFT') throw new Error('Only draft entries can be edited');

  if (data.lines) {
    validateLines(data.lines);
    await prisma.journalLine.deleteMany({ where: { journalEntryId: id } });
    await prisma.journalLine.createMany({
      data: data.lines.map((line, i) => ({
        journalEntryId: id,
        accountId: line.accountId,
        description: line.description,
        debit: roundMoney(line.debit),
        credit: roundMoney(line.credit),
        lineOrder: i,
      })),
    });
  }

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: {
      ...(data.entryDate && { entryDate: new Date(data.entryDate) }),
      ...(data.reference !== undefined && { reference: data.reference }),
      ...(data.description && { description: data.description }),
    },
    include: { lines: { include: { account: true } } },
  });

  await createAuditLog({
    actorId,
    action: 'JOURNAL_UPDATED',
    entityType: 'JournalEntry',
    entityId: id,
  });

  return updated;
}

export async function submitJournal(id: string, actorId: string) {
  const entry = await getJournal(id);
  if (entry.status !== 'DRAFT') throw new Error('Only draft entries can be submitted');
  if (!isBalanced(entry.lines)) throw new Error('Journal must balance before submission');

  return prisma.journalEntry.update({
    where: { id },
    data: { status: 'PENDING_APPROVAL', submittedAt: new Date() },
    include: { lines: { include: { account: true } } },
  });
}

export async function approveJournal(id: string, approverId: string) {
  const entry = await prisma.journalEntry.findUnique({ where: { id } });
  if (!entry) throw new Error('Journal entry not found');
  if (entry.status !== 'PENDING_APPROVAL') throw new Error('Entry is not pending approval');

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: {
      approvedById: approverId,
      approvedAt: new Date(),
    },
    include: { lines: { include: { account: true } } },
  });

  await createAuditLog({
    actorId: approverId,
    action: 'JOURNAL_APPROVED',
    entityType: 'JournalEntry',
    entityId: id,
  });

  return updated;
}

export async function postJournal(id: string, postedById: string) {
  const entry = await getJournal(id);
  if (entry.status !== 'PENDING_APPROVAL') {
    throw new Error('Only approved (pending) entries can be posted');
  }
  if (!entry.approvedById) {
    throw new Error('Entry must be approved before posting');
  }
  if (!isBalanced(entry.lines)) throw new Error('Journal must balance');

  await prisma.$transaction(async (tx) => {
    for (const line of entry.lines) {
      const account = await tx.chartOfAccount.findUnique({ where: { id: line.accountId } });
      if (!account?.isActive) throw new Error(`Account ${account?.code ?? line.accountId} is inactive`);

      const newBalance = applyLineToBalance(
        account.balance,
        account.normalBalance as NormalBalance,
        line.debit,
        line.credit
      );

      await tx.chartOfAccount.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
    }

    await tx.journalEntry.update({
      where: { id },
      data: {
        status: 'POSTED',
        postedById,
        postedAt: new Date(),
      },
    });
  });

  await createAuditLog({
    actorId: postedById,
    action: 'JOURNAL_POSTED',
    entityType: 'JournalEntry',
    entityId: id,
  });

  return getJournal(id);
}

export async function reverseJournal(id: string, actorId: string, entryDate?: string) {
  const original = await getJournal(id);
  if (original.status !== 'POSTED') throw new Error('Only posted entries can be reversed');

  const lines: JournalLineInput[] = original.lines.map((l) => ({
    accountId: l.accountId,
    description: `Reversal: ${l.description ?? ''}`.trim(),
    debit: l.credit,
    credit: l.debit,
  }));

  const entryNumber = await nextEntryNumber(prisma);
  const reversal = await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        entryNumber,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        reference: `REV-${original.entryNumber}`,
        description: `Reversal of ${original.entryNumber}: ${original.description}`,
        status: 'POSTED',
        reversedFromId: original.id,
        createdById: actorId,
        approvedById: actorId,
        postedById: actorId,
        approvedAt: new Date(),
        postedAt: new Date(),
        submittedAt: new Date(),
        lines: {
          create: lines.map((line, i) => ({
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            lineOrder: i,
          })),
        },
      },
      include: { lines: true },
    });

    for (const line of entry.lines) {
      const account = await tx.chartOfAccount.findUnique({ where: { id: line.accountId } });
      if (!account) continue;
      const newBalance = applyLineToBalance(
        account.balance,
        account.normalBalance as NormalBalance,
        line.debit,
        line.credit
      );
      await tx.chartOfAccount.update({
        where: { id: account.id },
        data: { balance: newBalance },
      });
    }

    await tx.journalEntry.update({
      where: { id: original.id },
      data: { status: 'REVERSED' },
    });

    return entry;
  });

  await createAuditLog({
    actorId,
    action: 'JOURNAL_REVERSED',
    entityType: 'JournalEntry',
    entityId: id,
    newValue: { reversalId: reversal.id },
  });

  return getJournal(reversal.id);
}

export async function cancelJournal(id: string, actorId: string) {
  const entry = await prisma.journalEntry.findUnique({ where: { id } });
  if (!entry) throw new Error('Journal entry not found');
  if (!['DRAFT', 'PENDING_APPROVAL'].includes(entry.status)) {
    throw new Error('Only draft or pending entries can be cancelled');
  }

  const updated = await prisma.journalEntry.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  await createAuditLog({
    actorId,
    action: 'JOURNAL_CANCELLED',
    entityType: 'JournalEntry',
    entityId: id,
  });

  return updated;
}

function validateLines(lines: JournalLineInput[]) {
  if (!lines.length || lines.length < 2) {
    throw new Error('At least two journal lines are required');
  }
  for (const line of lines) {
    if (line.debit < 0 || line.credit < 0) throw new Error('Amounts cannot be negative');
    if (line.debit > 0 && line.credit > 0) throw new Error('Line cannot have both debit and credit');
    if (line.debit === 0 && line.credit === 0) throw new Error('Line must have a debit or credit amount');
  }
  if (!isBalanced(lines)) throw new Error('Total debits must equal total credits');
}
