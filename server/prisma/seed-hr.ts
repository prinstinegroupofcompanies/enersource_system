import { PrismaClient } from '@prisma/client';
import { startOfDay } from '../src/constants/hr.js';

export async function seedHr(prisma: PrismaClient, adminUserId: string) {
  if ((await prisma.employee.count()) > 0) return;

  const execDept = await prisma.department.findUnique({ where: { code: 'EXEC' } });
  const opsDept = await prisma.department.findUnique({ where: { code: 'OPS' } });
  const salesDept = await prisma.department.findUnique({ where: { code: 'SALES' } });

  const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

  const manager = await prisma.employee.create({
    data: {
      employeeNumber: `EMP-${new Date().getFullYear()}-00001`,
      userId: adminUserId,
      firstName: adminUser?.firstName ?? 'System',
      lastName: adminUser?.lastName ?? 'Administrator',
      email: adminUser?.email,
      jobTitle: 'Managing Director',
      employmentType: 'FULL_TIME',
      departmentId: execDept?.id,
      hireDate: new Date('2024-01-15'),
      status: 'ACTIVE',
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      employeeNumber: `EMP-${new Date().getFullYear()}-00002`,
      firstName: 'Alice',
      lastName: 'Wanjiku',
      email: 'alice.wanjiku@enersource.local',
      phone: '+254 711 222 333',
      jobTitle: 'Senior Solar Engineer',
      employmentType: 'FULL_TIME',
      departmentId: opsDept?.id,
      managerId: manager.id,
      hireDate: new Date('2024-06-01'),
      status: 'ACTIVE',
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      employeeNumber: `EMP-${new Date().getFullYear()}-00003`,
      firstName: 'Brian',
      lastName: 'Omondi',
      email: 'brian.omondi@enersource.local',
      jobTitle: 'Sales Officer',
      employmentType: 'FULL_TIME',
      departmentId: salesDept?.id,
      managerId: manager.id,
      hireDate: new Date('2025-02-10'),
      status: 'ACTIVE',
    },
  });

  const today = startOfDay(new Date());
  const yesterday = startOfDay(new Date(Date.now() - 86400000));

  for (const emp of [manager, emp2, emp3]) {
    await prisma.attendanceRecord.create({
      data: {
        employeeId: emp.id,
        date: today,
        checkIn: new Date(today.getTime() + 8 * 3600000 + 15 * 60000),
        status: emp.id === emp3.id ? 'LATE' : 'PRESENT',
      },
    });
    await prisma.attendanceRecord.create({
      data: {
        employeeId: emp.id,
        date: yesterday,
        checkIn: new Date(yesterday.getTime() + 8 * 3600000),
        checkOut: new Date(yesterday.getTime() + 17 * 3600000),
        status: 'PRESENT',
      },
    });
  }

  await prisma.employeeKpi.createMany({
    data: [
      {
        employeeId: emp2.id,
        title: 'Installations completed',
        periodLabel: '2026 Q1',
        targetValue: 12,
        actualValue: 9,
        unit: 'projects',
        status: 'APPROVED',
      },
      {
        employeeId: emp3.id,
        title: 'Sales revenue target',
        periodLabel: '2026 Q1',
        targetValue: 150000,
        actualValue: 98000,
        unit: 'KES',
        status: 'SUBMITTED',
      },
    ],
  });

  await prisma.appraisal.create({
    data: {
      employeeId: emp2.id,
      reviewPeriod: '2025 Annual',
      overallRating: 4,
      strengths: 'Strong technical leadership on site projects',
      improvements: 'Documentation turnaround time',
      goals: 'Mentor two junior engineers in Q2',
      status: 'COMPLETED',
      reviewedById: adminUserId,
      reviewDate: new Date(),
    },
  });

  await prisma.appraisal.create({
    data: {
      employeeId: emp3.id,
      reviewPeriod: '2026 Q1',
      overallRating: 3,
      strengths: 'Excellent client rapport',
      goals: 'Close 3 commercial deals',
      status: 'DRAFT',
      reviewedById: adminUserId,
    },
  });

  console.log(`  HR seeded (${manager.employeeNumber}, ${emp2.employeeNumber}, ${emp3.employeeNumber})`);
}
