import { PrismaClient } from '@prisma/client';
import { REQUISITION_WORKFLOW_STEPS } from '../src/constants/procurement.js';
import { PAYMENT_WORKFLOW_STEPS } from '../src/constants/procurement.js';

export async function seedProcurement(prisma: PrismaClient, adminUserId: string) {
  if ((await prisma.purchaseRequisition.count()) > 0) return;

  const req = await prisma.purchaseRequisition.create({
    data: {
      requisitionNumber: `PR-${new Date().getFullYear()}-00001`,
      title: 'Solar panel batch — Q2 project',
      type: 'PROJECT_MATERIALS',
      description: 'Restock panels for Site A installations',
      totalAmount: 18500,
      status: 'FINANCE_APPROVAL',
      projectReference: 'PRJ-SITE-A',
      requesterId: adminUserId,
      lines: {
        create: [
          { description: '450W panels x50', quantity: 50, unitPrice: 185, amount: 9250, lineOrder: 0 },
          { description: 'Delivery & handling', quantity: 1, unitPrice: 9250, amount: 9250, lineOrder: 1 },
        ],
      },
      approvals: {
        create: REQUISITION_WORKFLOW_STEPS.map((step) => ({
          step,
          status:
            step === 'STAFF_SUBMISSION' || step === 'SUPERVISOR_REVIEW'
              ? 'APPROVED'
              : step === 'FINANCE_APPROVAL'
                ? 'PENDING'
                : 'PENDING',
          approverId:
            step === 'STAFF_SUBMISSION' || step === 'SUPERVISOR_REVIEW' ? adminUserId : undefined,
          actedAt:
            step === 'STAFF_SUBMISSION' || step === 'SUPERVISOR_REVIEW' ? new Date() : undefined,
        })),
      },
    },
  });

  await prisma.paymentRequest.create({
    data: {
      requestNumber: `PAY-${new Date().getFullYear()}-00001`,
      title: 'Vendor deposit — panel shipment',
      amount: 10000,
      description: 'Linked to requisition',
      requisitionId: req.id,
      requesterId: adminUserId,
      status: 'PENDING',
      approvals: {
        create: PAYMENT_WORKFLOW_STEPS.map((step) => ({
          step,
          status: step === 'SUPERVISOR_REVIEW' ? 'PENDING' : 'PENDING',
        })),
      },
    },
  });

  const fund = await prisma.pettyCashFund.create({
    data: {
      name: 'Office Petty Cash',
      custodianName: 'Finance Desk',
      allocatedAmount: 5000,
      balance: 3200,
    },
  });

  await prisma.pettyCashEntry.createMany({
    data: [
      {
        fundId: fund.id,
        type: 'REPLENISHMENT',
        amount: 5000,
        description: 'Initial float',
        recordedById: adminUserId,
      },
      {
        fundId: fund.id,
        type: 'EXPENSE',
        amount: 450,
        description: 'Courier — site documents',
        reference: 'PC-001',
        recordedById: adminUserId,
      },
      {
        fundId: fund.id,
        type: 'EXPENSE',
        amount: 1350,
        description: 'Office supplies & PPE',
        reference: 'PC-002',
        recordedById: adminUserId,
      },
    ],
  });
}
