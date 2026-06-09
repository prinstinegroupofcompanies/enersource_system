import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import { nextNumber } from '../../utils/sales.js';
import {
  REQUISITION_WORKFLOW_STEPS,
  nextStep,
  type WorkflowStep,
} from '../../constants/procurement.js';
import { createAuditLog } from '../audit.service.js';

export interface ReqLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export async function listRequisitions(status?: string) {
  return prisma.purchaseRequisition.findMany({
    where: status ? { status } : undefined,
    include: {
      lines: { orderBy: { lineOrder: 'asc' } },
      approvals: { orderBy: { step: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function createRequisition(
  data: {
    title: string;
    type: string;
    description?: string;
    projectReference?: string;
    departmentId?: string;
    lines: ReqLineInput[];
  },
  requesterId: string
) {
  const totalAmount = roundMoney(
    data.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  );
  const requisitionNumber = await nextNumber('PR', prisma.purchaseRequisition);

  const requisition = await prisma.purchaseRequisition.create({
    data: {
      requisitionNumber,
      title: data.title,
      type: data.type,
      description: data.description,
      projectReference: data.projectReference,
      totalAmount,
      status: 'SUPERVISOR_REVIEW',
      requesterId,
      departmentId: data.departmentId,
      lines: {
        create: data.lines.map((l, i) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: roundMoney(l.quantity * l.unitPrice),
          lineOrder: i,
        })),
      },
      approvals: {
        create: REQUISITION_WORKFLOW_STEPS.map((step) => ({
          step,
          status: step === 'STAFF_SUBMISSION' ? 'APPROVED' : step === 'SUPERVISOR_REVIEW' ? 'PENDING' : 'PENDING',
          actedAt: step === 'STAFF_SUBMISSION' ? new Date() : undefined,
          approverId: step === 'STAFF_SUBMISSION' ? requesterId : undefined,
        })),
      },
    },
    include: { lines: true, approvals: true },
  });

  await createAuditLog({
    actorId: requesterId,
    action: 'REQUISITION_CREATED',
    entityType: 'PurchaseRequisition',
    entityId: requisition.id,
  });

  return requisition;
}

export async function approveRequisitionStep(
  id: string,
  approverId: string,
  comments?: string
) {
  const req = await prisma.purchaseRequisition.findUnique({
    where: { id },
    include: { approvals: true },
  });
  if (!req) throw new Error('Requisition not found');
  if (req.status === 'REJECTED' || req.status === 'COMPLETED') {
    throw new Error('Requisition is closed');
  }

  const currentStep = req.status as WorkflowStep;
  const approval = req.approvals.find((a) => a.step === currentStep);
  if (!approval || approval.status !== 'PENDING') {
    throw new Error('No pending approval for current step');
  }

  const following = nextStep(currentStep);
  const newStatus = following === 'COMPLETED' ? 'COMPLETED' : following;

  await prisma.requisitionApproval.update({
    where: { id: approval.id },
    data: { status: 'APPROVED', approverId, comments, actedAt: new Date() },
  });

  if (following !== 'COMPLETED') {
    const nextApproval = req.approvals.find((a) => a.step === following);
    if (nextApproval) {
      await prisma.requisitionApproval.update({
        where: { id: nextApproval.id },
        data: { status: 'PENDING' },
      });
    }
  }

  const updated = await prisma.purchaseRequisition.update({
    where: { id },
    data: { status: newStatus },
    include: { lines: true, approvals: true },
  });

  await createAuditLog({
    actorId: approverId,
    action: 'REQUISITION_APPROVED',
    entityType: 'PurchaseRequisition',
    entityId: id,
    newValue: { step: currentStep, next: newStatus },
  });

  return updated;
}

export async function rejectRequisition(id: string, approverId: string, comments?: string) {
  const req = await prisma.purchaseRequisition.findUnique({ where: { id } });
  if (!req) throw new Error('Requisition not found');

  await prisma.requisitionApproval.updateMany({
    where: { requisitionId: id, step: req.status, status: 'PENDING' },
    data: { status: 'REJECTED', approverId, comments, actedAt: new Date() },
  });

  return prisma.purchaseRequisition.update({
    where: { id },
    data: { status: 'REJECTED' },
    include: { lines: true, approvals: true },
  });
}
