import { prisma } from '../../lib/prisma.js';
import { nextNumber } from '../../utils/sales.js';
import { kpiProgress, startOfDay } from '../../constants/hr.js';
import { createAuditLog } from '../audit.service.js';

const employeeInclude = {
  department: { select: { id: true, name: true, code: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
  user: { select: { id: true, email: true } },
};

export async function getDashboardSummary() {
  const today = startOfDay(new Date());
  const [employees, active, onLeave, todayAttendance, pendingAppraisals, kpis] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
    prisma.attendanceRecord.findMany({
      where: { date: today },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
    }),
    prisma.appraisal.count({ where: { status: { in: ['DRAFT', 'SUBMITTED'] } } }),
    prisma.employeeKpi.findMany({ where: { status: 'APPROVED' }, take: 50 }),
  ]);

  const presentToday = todayAttendance.filter((a) => ['PRESENT', 'LATE', 'REMOTE'].includes(a.status)).length;
  const absentToday = todayAttendance.filter((a) => a.status === 'ABSENT').length;
  const avgKpi =
    kpis.length > 0
      ? Math.round(kpis.reduce((s, k) => s + kpiProgress(k.actualValue, k.targetValue), 0) / kpis.length)
      : 0;

  const recentHires = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { hireDate: 'desc' },
    take: 5,
    include: { department: { select: { name: true } } },
  });

  return {
    totalEmployees: employees,
    activeEmployees: active,
    onLeave,
    presentToday,
    absentToday,
    attendanceRate: active > 0 ? Math.round((presentToday / active) * 100) : 0,
    pendingAppraisals,
    averageKpiScore: avgKpi,
    recentHires: recentHires.map((e) => ({
      id: e.id,
      employeeNumber: e.employeeNumber,
      name: `${e.firstName} ${e.lastName}`,
      jobTitle: e.jobTitle,
      department: e.department?.name,
      hireDate: e.hireDate,
    })),
  };
}

export async function listEmployees(filters?: { status?: string; departmentId?: string; search?: string }) {
  return prisma.employee.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.departmentId && { departmentId: filters.departmentId }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search } },
          { lastName: { contains: filters.search } },
          { employeeNumber: { contains: filters.search } },
          { email: { contains: filters.search } },
        ],
      }),
    },
    include: employeeInclude,
    orderBy: { lastName: 'asc' },
    take: 200,
  });
}

export async function getEmployee(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      ...employeeInclude,
      attendance: { orderBy: { date: 'desc' }, take: 14 },
      kpis: { orderBy: { updatedAt: 'desc' } },
      appraisals: { orderBy: { createdAt: 'desc' } },
      directReports: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
    },
  });
  if (!employee) throw new Error('Employee not found');
  return employee;
}

export async function createEmployee(
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    employmentType?: string;
    departmentId?: string;
    managerId?: string;
    hireDate?: string;
    userId?: string;
    emergencyContact?: string;
  },
  actorId: string
) {
  const employeeNumber = await nextNumber('EMP', prisma.employee);

  const employee = await prisma.employee.create({
    data: {
      employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      employmentType: data.employmentType ?? 'FULL_TIME',
      departmentId: data.departmentId,
      managerId: data.managerId,
      userId: data.userId,
      hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
      emergencyContact: data.emergencyContact,
      status: 'ACTIVE',
    },
    include: employeeInclude,
  });

  await createAuditLog({
    actorId,
    action: 'EMPLOYEE_CREATED',
    entityType: 'Employee',
    entityId: employee.id,
  });

  return employee;
}

export async function updateEmployee(
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
    employmentType: string;
    status: string;
    departmentId: string;
    managerId: string | null;
    hireDate: string;
    terminationDate: string;
    emergencyContact: string;
  }>,
  actorId: string
) {
  const updates: Record<string, unknown> = { ...data };
  if (data.hireDate) updates.hireDate = new Date(data.hireDate);
  if (data.terminationDate) updates.terminationDate = new Date(data.terminationDate);
  if (data.status === 'TERMINATED' && !data.terminationDate) updates.terminationDate = new Date();

  const employee = await prisma.employee.update({
    where: { id },
    data: updates,
    include: employeeInclude,
  });

  await createAuditLog({ actorId, action: 'EMPLOYEE_UPDATED', entityType: 'Employee', entityId: id });
  return employee;
}

export async function listAttendance(filters?: { date?: string; employeeId?: string; status?: string }) {
  const day = filters?.date ? startOfDay(new Date(filters.date)) : undefined;

  return prisma.attendanceRecord.findMany({
    where: {
      ...(day && { date: day }),
      ...(filters?.employeeId && { employeeId: filters.employeeId }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  });
}

export async function recordAttendance(
  data: {
    employeeId: string;
    date?: string;
    checkIn?: string;
    checkOut?: string;
    status?: string;
    notes?: string;
  },
  actorId: string
) {
  const date = data.date ? startOfDay(new Date(data.date)) : startOfDay(new Date());

  const record = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: data.employeeId, date } },
    create: {
      employeeId: data.employeeId,
      date,
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      status: data.status ?? 'PRESENT',
      notes: data.notes,
    },
    update: {
      checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
      checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
      status: data.status,
      notes: data.notes,
    },
    include: {
      employee: { select: { employeeNumber: true, firstName: true, lastName: true } },
    },
  });

  await createAuditLog({
    actorId,
    action: 'ATTENDANCE_RECORDED',
    entityType: 'AttendanceRecord',
    entityId: record.id,
  });

  return record;
}

export async function listKpis(filters?: { employeeId?: string; periodLabel?: string }) {
  const kpis = await prisma.employeeKpi.findMany({
    where: {
      ...(filters?.employeeId && { employeeId: filters.employeeId }),
      ...(filters?.periodLabel && { periodLabel: filters.periodLabel }),
    },
    include: {
      employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return kpis.map((k) => ({
    ...k,
    progressPercent: kpiProgress(k.actualValue, k.targetValue),
  }));
}

export async function createKpi(
  data: {
    employeeId: string;
    title: string;
    description?: string;
    periodLabel: string;
    targetValue: number;
    actualValue?: number;
    unit?: string;
  },
  actorId: string
) {
  const kpi = await prisma.employeeKpi.create({
    data: {
      employeeId: data.employeeId,
      title: data.title,
      description: data.description,
      periodLabel: data.periodLabel,
      targetValue: data.targetValue,
      actualValue: data.actualValue ?? 0,
      unit: data.unit ?? '%',
    },
    include: {
      employee: { select: { employeeNumber: true, firstName: true, lastName: true } },
    },
  });

  await createAuditLog({ actorId, action: 'KPI_CREATED', entityType: 'EmployeeKpi', entityId: kpi.id });
  return { ...kpi, progressPercent: kpiProgress(kpi.actualValue, kpi.targetValue) };
}

export async function updateKpi(
  id: string,
  data: Partial<{ actualValue: number; targetValue: number; status: string; description: string }>,
  actorId: string
) {
  const kpi = await prisma.employeeKpi.update({
    where: { id },
    data,
    include: {
      employee: { select: { employeeNumber: true, firstName: true, lastName: true } },
    },
  });

  await createAuditLog({ actorId, action: 'KPI_UPDATED', entityType: 'EmployeeKpi', entityId: id });
  return { ...kpi, progressPercent: kpiProgress(kpi.actualValue, kpi.targetValue) };
}

export async function listAppraisals(filters?: { employeeId?: string; status?: string }) {
  return prisma.appraisal.findMany({
    where: {
      ...(filters?.employeeId && { employeeId: filters.employeeId }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      employee: { select: { id: true, employeeNumber: true, firstName: true, lastName: true, jobTitle: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function createAppraisal(
  data: {
    employeeId: string;
    reviewPeriod: string;
    overallRating?: number;
    strengths?: string;
    improvements?: string;
    goals?: string;
  },
  actorId: string
) {
  return prisma.appraisal.create({
    data: {
      employeeId: data.employeeId,
      reviewPeriod: data.reviewPeriod,
      overallRating: data.overallRating ?? 3,
      strengths: data.strengths,
      improvements: data.improvements,
      goals: data.goals,
      reviewedById: actorId,
    },
    include: {
      employee: { select: { employeeNumber: true, firstName: true, lastName: true } },
    },
  });
}

export async function updateAppraisal(
  id: string,
  data: Partial<{
    overallRating: number;
    strengths: string;
    improvements: string;
    goals: string;
    status: string;
  }>,
  actorId: string
) {
  const updates: Record<string, unknown> = { ...data };
  if (data.status === 'COMPLETED') {
    updates.reviewDate = new Date();
    updates.reviewedById = actorId;
  }

  return prisma.appraisal.update({
    where: { id },
    data: updates,
    include: {
      employee: { select: { employeeNumber: true, firstName: true, lastName: true } },
    },
  });
}
