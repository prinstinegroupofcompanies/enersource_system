import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ROLE_SLUGS } from '../src/constants/roles.js';

const DEMO_PASSWORD = 'Demo@Enersource2026!';

const DEMO_USERS: { email: string; firstName: string; lastName: string; roleSlug: string; deptCode: string }[] = [
  { email: 'director@enersource.local', firstName: 'Mary', lastName: 'Kamau', roleSlug: ROLE_SLUGS.MANAGING_DIRECTOR, deptCode: 'EXEC' },
  { email: 'finance@enersource.local', firstName: 'James', lastName: 'Ochieng', roleSlug: ROLE_SLUGS.FINANCE_MANAGER, deptCode: 'FIN' },
  { email: 'accountant@enersource.local', firstName: 'Grace', lastName: 'Muthoni', roleSlug: ROLE_SLUGS.ACCOUNTANT, deptCode: 'FIN' },
  { email: 'procurement@enersource.local', firstName: 'Peter', lastName: 'Njoroge', roleSlug: ROLE_SLUGS.PROCUREMENT_OFFICER, deptCode: 'PROC' },
  { email: 'hr@enersource.local', firstName: 'Sarah', lastName: 'Wambui', roleSlug: ROLE_SLUGS.HR_MANAGER, deptCode: 'HR' },
  { email: 'inventory@enersource.local', firstName: 'David', lastName: 'Kiprop', roleSlug: ROLE_SLUGS.INVENTORY_OFFICER, deptCode: 'INV' },
  { email: 'projects@enersource.local', firstName: 'Lucy', lastName: 'Akinyi', roleSlug: ROLE_SLUGS.PROJECT_MANAGER, deptCode: 'OPS' },
  { email: 'sales@enersource.local', firstName: 'Michael', lastName: 'Otieno', roleSlug: ROLE_SLUGS.SALES_OFFICER, deptCode: 'SALES' },
  { email: 'support@enersource.local', firstName: 'Faith', lastName: 'Chebet', roleSlug: ROLE_SLUGS.CUSTOMER_SUPPORT, deptCode: 'CS' },
  { email: 'staff@enersource.local', firstName: 'John', lastName: 'Mwangi', roleSlug: ROLE_SLUGS.STAFF, deptCode: 'OPS' },
];

export async function seedDemoUsers(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const u of DEMO_USERS) {
    const role = await prisma.role.findUnique({ where: { slug: u.roleSlug } });
    const dept = await prisma.department.findUnique({ where: { code: u.deptCode } });
    if (!role || !dept) continue;

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: role.id,
        departmentId: dept.id,
        passwordHash,
        isActive: true,
        mfaEnabled: false,
        mustChangePassword: false,
      },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: role.id,
        departmentId: dept.id,
        passwordHash,
        isActive: true,
        mfaEnabled: false,
        mustChangePassword: false,
      },
    });
  }

  console.log(`  Demo users seeded (${DEMO_USERS.length} roles, password: ${DEMO_PASSWORD})`);
}
