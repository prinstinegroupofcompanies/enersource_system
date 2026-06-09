import { PrismaClient } from '@prisma/client';

export async function seedProjects(prisma: PrismaClient, adminUserId: string) {
  if ((await prisma.project.count()) > 0) return;

  const customer = await prisma.customer.findFirst({ where: { isActive: true } });
  const panel = await prisma.inventoryItem.findFirst({ where: { sku: { contains: 'PNL' } } });

  const endActive = new Date();
  endActive.setMonth(endActive.getMonth() + 2);

  const pastDue = new Date();
  pastDue.setDate(pastDue.getDate() - 14);

  const active = await prisma.project.create({
    data: {
      projectNumber: `PRJ-${new Date().getFullYear()}-00001`,
      title: 'Sunrise Homes — 8kW Rooftop Install',
      type: 'INSTALLATION',
      status: 'ACTIVE',
      description: 'Residential grid-tied system with battery backup',
      location: 'Nairobi, Westlands',
      customerId: customer?.id,
      managerId: adminUserId,
      budget: 42000,
      actualCost: 12800,
      progressPercent: 45,
      startDate: new Date(),
      targetEndDate: endActive,
      members: { create: [{ userId: adminUserId, role: 'MANAGER' }] },
      tasks: {
        create: [
          { title: 'Site survey & design sign-off', status: 'DONE', priority: 'HIGH' },
          { title: 'Panel rail installation', status: 'IN_PROGRESS', priority: 'MEDIUM' },
          { title: 'Inverter commissioning', status: 'TODO', priority: 'HIGH' },
        ],
      },
      milestones: {
        create: [
          { title: 'Permits approved', status: 'COMPLETED', completedAt: new Date() },
          { title: 'Grid connection', dueDate: endActive },
        ],
      },
      ...(panel
        ? {
            materialUsage: {
              create: {
                inventoryItemId: panel.id,
                description: `${panel.name} — initial allocation`,
                quantity: 16,
                unitCost: panel.unitCost,
                amount: 16 * panel.unitCost,
                recordedById: adminUserId,
              },
            },
          }
        : {}),
    },
  });

  await prisma.project.create({
    data: {
      projectNumber: `PRJ-${new Date().getFullYear()}-00002`,
      title: 'Industrial Park — Preventive Maintenance',
      type: 'MAINTENANCE',
      status: 'ACTIVE',
      location: 'Thika Road',
      managerId: adminUserId,
      budget: 8500,
      actualCost: 2100,
      progressPercent: 60,
      targetEndDate: pastDue,
      members: { create: [{ userId: adminUserId, role: 'MANAGER' }] },
      tasks: {
        create: [{ title: 'String voltage audit', status: 'IN_PROGRESS' }],
      },
      milestones: {
        create: [{ title: 'Client handover report', dueDate: pastDue }],
      },
    },
  });

  console.log(`  Projects seeded (${active.projectNumber}, PRJ-${new Date().getFullYear()}-00002)`);
}
