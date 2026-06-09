import path from 'path';
import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import { nextNumber } from '../../utils/sales.js';
import { PAYMENT_WORKFLOW_STEPS } from '../../constants/procurement.js';
import { createAuditLog } from '../audit.service.js';

export async function listPaymentRequests(status?: string) {
  return prisma.paymentRequest.findMany({
    where: status ? { status } : undefined,
    include: {
      requisition: { select: { requisitionNumber: true, title: true } },
      approvals: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function createPaymentRequest(
  data: {
    title: string;
    amount: number;
    description?: string;
    requisitionId?: string;
    attachmentName?: string;
    attachmentPath?: string;
  },
  requesterId: string
) {
  const requestNumber = await nextNumber('PAY', prisma.paymentRequest);

  return prisma.paymentRequest.create({
    data: {
      requestNumber,
      title: data.title,
      amount: roundMoney(data.amount),
      description: data.description,
      requisitionId: data.requisitionId,
      attachmentName: data.attachmentName,
      attachmentPath: data.attachmentPath,
      requesterId,
      status: 'PENDING',
      approvals: {
        create: PAYMENT_WORKFLOW_STEPS.map((step) => ({
          step,
          status: 'PENDING',
        })),
      },
    },
    include: { approvals: true, requisition: true },
  });
}

export async function approvePaymentRequest(id: string, approverId: string, step: string) {
  const payment = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { approvals: true },
  });
  if (!payment) throw new Error('Payment request not found');
  if (['REJECTED', 'PAID'].includes(payment.status)) throw new Error('Request is closed');

  const approval = payment.approvals.find((a) => a.step === step && a.status === 'PENDING');
  if (!approval) throw new Error('Invalid approval step');

  await prisma.paymentApproval.update({
    where: { id: approval.id },
    data: { status: 'APPROVED', approverId, actedAt: new Date() },
  });

  const refreshed = await prisma.paymentApproval.findMany({ where: { paymentRequestId: id } });
  const supervisorDone = refreshed.find((a) => a.step === 'SUPERVISOR_REVIEW')?.status === 'APPROVED';
  const financeDone = refreshed.find((a) => a.step === 'FINANCE_APPROVAL')?.status === 'APPROVED';

  if (supervisorDone && financeDone) {
    await prisma.paymentRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
    });
  }

  return prisma.paymentRequest.findUnique({
    where: { id },
    include: { approvals: true, requisition: true },
  });
}

export async function rejectPaymentRequest(id: string, approverId: string, comments?: string) {
  await prisma.paymentApproval.updateMany({
    where: { paymentRequestId: id, status: 'PENDING' },
    data: { status: 'REJECTED', approverId, comments, actedAt: new Date() },
  });
  return prisma.paymentRequest.update({
    where: { id },
    data: { status: 'REJECTED' },
    include: { approvals: true },
  });
}

export async function markPaymentPaid(id: string, paidById: string) {
  const payment = await prisma.paymentRequest.update({
    where: { id },
    data: { status: 'PAID', paidById, paidAt: new Date() },
    include: { approvals: true },
  });
  await createAuditLog({
    actorId: paidById,
    action: 'PAYMENT_PAID',
    entityType: 'PaymentRequest',
    entityId: id,
  });
  return payment;
}

export function attachmentPublicPath(storedPath: string): string {
  return `/api/uploads/${path.basename(storedPath)}`;
}
