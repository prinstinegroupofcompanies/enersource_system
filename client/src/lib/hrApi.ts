import { api } from './api';
import type { Appraisal, AttendanceRecord, Employee, EmployeeDetail, EmployeeKpi, HrSummary } from '../types/hr';

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

export const hrApi = {
  summary: (token: string) => api.get<HrSummary>('/hr/summary', token),
  employees: (token: string, params?: { status?: string; departmentId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.departmentId) q.set('departmentId', params.departmentId);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return api.get<Employee[]>(`/hr/employees${qs ? `?${qs}` : ''}`, token);
  },
  getEmployee: (token: string, id: string) => api.get<EmployeeDetail>(`/hr/employees/${id}`, token),
  createEmployee: (token: string, body: unknown) => api.post<Employee>('/hr/employees', body, token),
  updateEmployee: (token: string, id: string, body: unknown) =>
    api.patch<Employee>(`/hr/employees/${id}`, body, token),
  attendance: (token: string, params?: { date?: string; employeeId?: string }) => {
    const q = new URLSearchParams();
    if (params?.date) q.set('date', params.date);
    if (params?.employeeId) q.set('employeeId', params.employeeId);
    const qs = q.toString();
    return api.get<AttendanceRecord[]>(`/hr/attendance${qs ? `?${qs}` : ''}`, token);
  },
  recordAttendance: (token: string, body: unknown) =>
    api.post<AttendanceRecord>('/hr/attendance', body, token),
  kpis: (token: string, params?: { employeeId?: string; periodLabel?: string }) => {
    const q = new URLSearchParams();
    if (params?.employeeId) q.set('employeeId', params.employeeId);
    if (params?.periodLabel) q.set('periodLabel', params.periodLabel);
    const qs = q.toString();
    return api.get<EmployeeKpi[]>(`/hr/kpis${qs ? `?${qs}` : ''}`, token);
  },
  createKpi: (token: string, body: unknown) => api.post<EmployeeKpi>('/hr/kpis', body, token),
  updateKpi: (token: string, id: string, body: unknown) =>
    api.patch<EmployeeKpi>(`/hr/kpis/${id}`, body, token),
  appraisals: (token: string, params?: { employeeId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.employeeId) q.set('employeeId', params.employeeId);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return api.get<Appraisal[]>(`/hr/appraisals${qs ? `?${qs}` : ''}`, token);
  },
  createAppraisal: (token: string, body: unknown) => api.post<Appraisal>('/hr/appraisals', body, token),
  updateAppraisal: (token: string, id: string, body: unknown) =>
    api.patch<Appraisal>(`/hr/appraisals/${id}`, body, token),
  completeAppraisal: (token: string, id: string) =>
    api.post<Appraisal>(`/hr/appraisals/${id}/complete`, {}, token),
  departments: (token: string) => api.get<{ id: string; name: string; code: string }[]>('/hr/meta/departments', token),
  employeeOptions: (token: string) =>
    api.get<{ id: string; employeeNumber: string; firstName: string; lastName: string }[]>(
      '/hr/meta/employees',
      token
    ),
};
