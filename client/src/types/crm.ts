export interface CrmSummary {
  openLeads: number;
  wonLeads: number;
  totalLeads: number;
  pipelineValue: number;
  conversionRate: number;
  activeClients: number;
  pendingReminders: number;
  overdueReminders: number;
  pipeline: { stage: string; count: number; value: number }[];
  recentActivities: {
    id: string;
    type: string;
    subject: string;
    activityDate: string;
    lead?: string;
    customer?: string;
  }[];
}

export interface Lead {
  id: string;
  leadNumber: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  estimatedValue: number;
  notes?: string;
  assignedToId?: string;
  customerId?: string;
  nextFollowUpAt?: string;
  _count?: { activities: number; reminders: number };
}

export interface LeadDetail extends Lead {
  activities: CrmActivity[];
  reminders: CrmReminder[];
  customer?: { id: string; companyName: string };
}

export interface CrmActivity {
  id: string;
  type: string;
  subject: string;
  notes?: string;
  activityDate: string;
  leadId?: string;
  customerId?: string;
  lead?: { leadNumber: string; companyName: string };
  customer?: { companyName: string };
}

export interface CrmReminder {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  leadId?: string;
  customerId?: string;
  lead?: { leadNumber: string; companyName: string };
  customer?: { companyName: string };
}

export interface CrmClient {
  id: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  _count?: { invoices: number; quotations: number; projects: number; activities: number };
  activities?: CrmActivity[];
  reminders?: CrmReminder[];
}

export interface PipelineColumn {
  stage: string;
  leads: Lead[];
  totalValue: number;
}
