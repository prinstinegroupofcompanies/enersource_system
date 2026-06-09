import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ROLE_DEFINITIONS } from '../src/constants/roles.js';
import { ALL_PERMISSIONS, permissionsForRole } from '../src/constants/permissions.js';
import { seedFinance } from './seed-finance.js';
import { seedSales } from './seed-sales.js';
import { seedInventory } from './seed-inventory.js';
import { seedProcurement } from './seed-procurement.js';
import { seedProjects } from './seed-projects.js';
import { seedCrm } from './seed-crm.js';
import { seedHr } from './seed-hr.js';
import { seedPhase9 } from './seed-phase9.js';
import { seedPhase10 } from './seed-phase10.js';
import { seedDemoUsers } from './seed-demo-users.js';

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Executive', code: 'EXEC', description: 'Leadership and strategy' },
  { name: 'Finance', code: 'FIN', description: 'Accounting and treasury' },
  { name: 'Operations', code: 'OPS', description: 'Solar installations and maintenance' },
  { name: 'Sales & Marketing', code: 'SALES', description: 'Revenue and client acquisition' },
  { name: 'Human Resources', code: 'HR', description: 'People operations' },
  { name: 'Procurement', code: 'PROC', description: 'Purchasing and vendors' },
  { name: 'Inventory & Warehouse', code: 'INV', description: 'Stock management' },
  { name: 'Customer Support', code: 'CS', description: 'Client service' },
  { name: 'IT & Systems', code: 'IT', description: 'Technology support' },
];

async function main() {
  console.log('Seeding Enersource ERP...');

  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }

  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: {},
      create: perm,
    });
  }

  for (const roleDef of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: { name: roleDef.name, description: roleDef.description },
      create: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: true,
      },
    });

    const perms = permissionsForRole(roleDef.slug);
    for (const p of perms) {
      const permission = await prisma.permission.findUnique({
        where: { module_action: { module: p.module, action: p.action } },
      });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: permission.id },
          },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        });
      }
    }
  }

  const execDept = await prisma.department.findUnique({ where: { code: 'EXEC' } });
  const superRole = await prisma.role.findUnique({ where: { slug: 'super-administrator' } });

  if (superRole && execDept) {
    const passwordHash = await bcrypt.hash('Admin@Enersource2026!', 12);
    await prisma.user.upsert({
      where: { email: 'admin@enersource.local' },
      update: {},
      create: {
        email: 'admin@enersource.local',
        passwordHash,
        firstName: 'System',
        lastName: 'Administrator',
        roleId: superRole.id,
        departmentId: execDept.id,
        mustChangePassword: false,
        mfaEnabled: false,
      },
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: 'admin@enersource.local' } });
  await seedFinance(prisma, admin?.id);
  if (admin?.id) await seedSales(prisma, admin.id);
  await seedInventory(prisma);
  if (admin?.id) await seedProcurement(prisma, admin.id);
  if (admin?.id) await seedProjects(prisma, admin.id);
  if (admin?.id) await seedCrm(prisma, admin.id);
  if (admin?.id) await seedHr(prisma, admin.id);
  if (admin?.id) await seedPhase9(prisma, admin.id);
  if (admin?.id) await seedPhase10(prisma, admin.id);
  await seedDemoUsers(prisma);
  if (admin) {
    const existing = await prisma.notification.count({ where: { userId: admin.id } });
    if (existing === 0) {
      await prisma.notification.createMany({
        data: [
          {
            userId: admin.id,
            title: 'Welcome to Enersource ERP',
            message: 'Phase 1 is complete. User management, MFA, and RBAC are active.',
            type: 'success',
            module: 'dashboard',
          },
          {
            userId: admin.id,
            title: 'Phase 2 — Financial Module',
            message: 'Financial management is live: COA, journals, ledger, trial balance, and reports.',
            type: 'info',
            module: 'finance',
          },
        ],
      });
    }
  }

  console.log('Seed complete.');
  console.log('Default login: admin@enersource.local / Admin@Enersource2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
