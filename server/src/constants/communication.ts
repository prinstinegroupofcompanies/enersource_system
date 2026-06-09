export const CHANNEL_TYPES = ['DEPARTMENT', 'GENERAL', 'ANNOUNCEMENT'] as const;

export const CHANNEL_TYPE_LABELS: Record<string, string> = {
  DEPARTMENT: 'Department',
  GENERAL: 'General',
  ANNOUNCEMENT: 'Announcement',
};

export const DOCUMENT_CATEGORIES = [
  'GENERAL',
  'POLICY',
  'CONTRACT',
  'TECHNICAL',
  'FINANCE',
  'HR',
  'PROJECT',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  POLICY: 'Policy',
  CONTRACT: 'Contract',
  TECHNICAL: 'Technical',
  FINANCE: 'Finance',
  HR: 'Human Resources',
  PROJECT: 'Project',
};
