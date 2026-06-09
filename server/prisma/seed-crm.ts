import { PrismaClient } from '@prisma/client';

export async function seedCrm(prisma: PrismaClient, adminUserId: string) {
  if ((await prisma.lead.count()) > 0) return;

  const followUp = new Date();
  followUp.setDate(followUp.getDate() + 3);

  const overdue = new Date();
  overdue.setDate(overdue.getDate() - 2);

  const lead1 = await prisma.lead.create({
    data: {
      leadNumber: `LD-${new Date().getFullYear()}-00001`,
      companyName: 'Greenfield Estates',
      contactPerson: 'David Kimani',
      email: 'david@greenfield.example',
      phone: '+254 722 111 222',
      source: 'REFERRAL',
      status: 'QUALIFIED',
      estimatedValue: 65000,
      notes: 'Interested in 15kW commercial rooftop system',
      assignedToId: adminUserId,
      createdById: adminUserId,
      nextFollowUpAt: followUp,
      activities: {
        create: [
          {
            type: 'CALL',
            subject: 'Initial discovery call',
            notes: 'Budget confirmed, site visit scheduled',
            createdById: adminUserId,
          },
        ],
      },
      reminders: {
        create: {
          title: 'Send proposal draft',
          dueAt: followUp,
          assignedToId: adminUserId,
          createdById: adminUserId,
        },
      },
    },
  });

  await prisma.lead.create({
    data: {
      leadNumber: `LD-${new Date().getFullYear()}-00002`,
      companyName: 'Lakeview School',
      contactPerson: 'Grace Wanjiru',
      email: 'admin@lakeview.example',
      source: 'WEBSITE',
      status: 'PROPOSAL',
      estimatedValue: 120000,
      assignedToId: adminUserId,
      createdById: adminUserId,
      activities: {
        create: {
          type: 'MEETING',
          subject: 'Board presentation',
          createdById: adminUserId,
        },
      },
    },
  });

  await prisma.lead.create({
    data: {
      leadNumber: `LD-${new Date().getFullYear()}-00003`,
      companyName: 'Metro Cold Storage',
      contactPerson: 'James Otieno',
      phone: '+254 700 999 888',
      source: 'COLD_CALL',
      status: 'CONTACTED',
      estimatedValue: 28000,
      assignedToId: adminUserId,
      createdById: adminUserId,
      reminders: {
        create: {
          title: 'Follow up on quote request',
          dueAt: overdue,
          assignedToId: adminUserId,
          createdById: adminUserId,
        },
      },
    },
  });

  const customer = await prisma.customer.findFirst();
  if (customer) {
    await prisma.crmActivity.create({
      data: {
        type: 'EMAIL',
        subject: 'Quarterly check-in',
        notes: 'Confirmed satisfaction with installation',
        customerId: customer.id,
        createdById: adminUserId,
      },
    });
    await prisma.crmReminder.create({
      data: {
        title: 'Annual maintenance reminder',
        dueAt: followUp,
        customerId: customer.id,
        assignedToId: adminUserId,
        createdById: adminUserId,
      },
    });
  }

  console.log(`  CRM seeded (${lead1.leadNumber} + 2 leads, activities & reminders)`);
}
