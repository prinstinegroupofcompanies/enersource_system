export interface HrSummary {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  pendingAppraisals: number;
  averageKpiScore: number;
  recentHires: {
    id: string;
    employeeNumber: string;
    name: string;
    jobTitle?: string;
    department?: string;
    hireDate?: string;
  }[];
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  employmentType: string;
  status: string;
  departmentId?: string;
  managerId?: string;
  hireDate?: string;
  department?: { id: string; name: string; code: string };
  manager?: { id: string; firstName: string; lastName: string };
}

export interface EmployeeDetail extends Employee {
  attendance?: AttendanceRecord[];
  kpis?: EmployeeKpi[];
  appraisals?: Appraisal[];
  directReports?: { id: string; firstName: string; lastName: string; jobTitle?: string }[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  notes?: string;
  employee?: { id: string; employeeNumber: string; firstName: string; lastName: string };
}

export interface EmployeeKpi {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  periodLabel: string;
  targetValue: number;
  actualValue: number;
  unit: string;
  status: string;
  progressPercent?: number;
  employee?: { id: string; employeeNumber: string; firstName: string; lastName: string };
}

export interface Appraisal {
  id: string;
  employeeId: string;
  reviewPeriod: string;
  overallRating: number;
  strengths?: string;
  improvements?: string;
  goals?: string;
  status: string;
  reviewDate?: string;
  employee?: { id: string; employeeNumber: string; firstName: string; lastName: string; jobTitle?: string };
}
