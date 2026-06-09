export const EMPLOYMENT_TYPES = ['FULL_TIME', 'CONTRACT', 'INTERN', 'PART_TIME'] as const;

export const EMPLOYEE_STATUSES = ['ACTIVE', 'ON_LEAVE', 'TERMINATED'] as const;

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'REMOTE'] as const;

export const KPI_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED'] as const;

export const APPRAISAL_STATUSES = ['DRAFT', 'SUBMITTED', 'COMPLETED'] as const;

export const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
  PART_TIME: 'Part-time',
};

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On leave',
  TERMINATED: 'Terminated',
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  HALF_DAY: 'Half day',
  REMOTE: 'Remote',
};

export const KPI_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
};

export const APPRAISAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
};

export function kpiProgress(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
