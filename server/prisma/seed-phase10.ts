import { PrismaClient } from '@prisma/client';

export async function seedPhase10(prisma: PrismaClient, adminUserId: string) {
  if ((await prisma.asset.count()) > 0) return;

  await prisma.asset.createMany({
    data: [
      {
        assetNumber: `AST-${new Date().getFullYear()}-00001`,
        name: 'Toyota Hilux — Field Service',
        description: 'Installation crew vehicle',
        category: 'VEHICLE',
        purchaseDate: new Date('2023-03-15'),
        purchaseCost: 28500,
        salvageValue: 8000,
        usefulLifeMonths: 84,
        location: 'Nairobi HQ',
        createdById: adminUserId,
      },
      {
        assetNumber: `AST-${new Date().getFullYear()}-00002`,
        name: 'Fluke 1577 Insulation Tester',
        category: 'TOOL',
        purchaseDate: new Date('2024-01-10'),
        purchaseCost: 1200,
        salvageValue: 200,
        usefulLifeMonths: 60,
        location: 'Ops warehouse',
        createdById: adminUserId,
      },
      {
        assetNumber: `AST-${new Date().getFullYear()}-00003`,
        name: 'Dell Latitude Laptop',
        category: 'IT',
        purchaseDate: new Date('2025-06-01'),
        purchaseCost: 1450,
        salvageValue: 150,
        usefulLifeMonths: 36,
        location: 'Finance office',
        createdById: adminUserId,
      },
    ],
  });

  const customer = await prisma.customer.findFirst();

  const t1 = await prisma.supportTicket.create({
    data: {
      ticketNumber: `TKT-${new Date().getFullYear()}-00001`,
      title: 'VPN access for remote site engineers',
      description: 'Need VPN credentials for Thika Road project team',
      type: 'INTERNAL',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      requesterId: adminUserId,
      assignedToId: adminUserId,
      comments: {
        create: {
          authorId: adminUserId,
          body: 'IT ticket raised — awaiting network team confirmation.',
        },
      },
    },
  });

  if (customer) {
    await prisma.supportTicket.create({
      data: {
        ticketNumber: `TKT-${new Date().getFullYear()}-00002`,
        title: 'Inverter fault alert — Sunrise Homes',
        description: 'Client reports intermittent shutdown on Sunny Boy inverter',
        type: 'CUSTOMER',
        priority: 'URGENT',
        status: 'OPEN',
        customerId: customer.id,
        requesterId: adminUserId,
        comments: {
          create: {
            authorId: adminUserId,
            body: 'Scheduled site visit for tomorrow AM.',
          },
        },
      },
    });
  }

  console.log(`  Phase 10 seeded (3 assets, tickets including ${t1.ticketNumber})`);
}
