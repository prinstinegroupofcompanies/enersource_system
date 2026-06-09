export const REQUISITION_TYPES = ['PURCHASE', 'OPERATIONAL_EXPENSE', 'PROJECT_MATERIALS'] as const;

export const REQUISITION_WORKFLOW_STEPS = [
  'STAFF_SUBMISSION',
  'SUPERVISOR_REVIEW',
  'FINANCE_APPROVAL',
  'MANAGEMENT_APPROVAL',
  'PROCUREMENT_PROCESSING',
] as const;

export type WorkflowStep = (typeof REQUISITION_WORKFLOW_STEPS)[number];

export function nextStep(current: string): WorkflowStep | 'COMPLETED' {
  const idx = REQUISITION_WORKFLOW_STEPS.indexOf(current as WorkflowStep);
  if (idx < 0 || idx >= REQUISITION_WORKFLOW_STEPS.length - 1) return 'COMPLETED';
  return REQUISITION_WORKFLOW_STEPS[idx + 1];
}

export const PAYMENT_WORKFLOW_STEPS = ['SUPERVISOR_REVIEW', 'FINANCE_APPROVAL', 'PAYMENT'] as const;

export const PAYMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'] as const;

export const PETTY_ENTRY_TYPES = ['EXPENSE', 'REPLENISHMENT'] as const;
