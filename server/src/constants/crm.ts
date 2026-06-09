export const LEAD_SOURCES = ['WEBSITE', 'REFERRAL', 'TRADE_SHOW', 'COLD_CALL', 'PARTNER', 'OTHER'] as const;

export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;

export const PIPELINE_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'] as const;

export const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'MEETING', 'SITE_VISIT', 'NOTE'] as const;

export const REMINDER_STATUSES = ['PENDING', 'DONE', 'SNOOZED'] as const;

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  TRADE_SHOW: 'Trade show',
  COLD_CALL: 'Cold call',
  PARTNER: 'Partner',
  OTHER: 'Other',
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

export const ACTIVITY_LABELS: Record<string, string> = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  SITE_VISIT: 'Site visit',
  NOTE: 'Note',
};
