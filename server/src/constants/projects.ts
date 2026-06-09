export const PROJECT_TYPES = ['INSTALLATION', 'MAINTENANCE', 'ENGINEERING'] as const;

export const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'DELAYED',
  'CANCELLED',
] as const;

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

export const MILESTONE_STATUSES = ['PENDING', 'COMPLETED', 'OVERDUE'] as const;

export function isProjectDelayed(targetEndDate: Date | null, status: string): boolean {
  if (!targetEndDate || status === 'COMPLETED' || status === 'CANCELLED') return false;
  return new Date() > targetEndDate && status !== 'COMPLETED';
}
