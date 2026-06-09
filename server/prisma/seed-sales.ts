import { PrismaClient } from '@prisma/client';

export async function seedSales(prisma: PrismaClient, adminUserId: string) {
  const existing = await prisma.customer.count();
  if (existing > 0) return;

  const customer = await prisma.customer.create({
    data: {
      companyName: 'Sunrise Homes Ltd',
      contactPerson: 'Jane Mbeki',
      email: 'billing@sunrisehomes.example',
      phone: '+254 712 345 678',
      address: '12 Solar Avenue, Nairobi',
      createdById: adminUserId,
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: 'VoltTech Distributors',
      contactPerson: 'Peter Ochieng',
      email: 'accounts@volttech.example',
      phone: '+254 733 000 111',
    },
  });

  const quote = await prisma.quotation.create({
    data: {
      quoteNumber: `QT-${new Date().getFullYear()}-00001`,
      customerId: customer.id,
      title: '10kW Residential Solar Installation',
      status: 'ACCEPTED',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 42000,
      taxRate: 16,
      taxAmount: 6720,
      total: 48720,
      createdById: adminUserId,
      lines: {
        create: [
          { description: 'Solar panels (10kW)', quantity: 1, unitPrice: 28000, amount: 28000, lineOrder: 0 },
          { description: 'Inverter & mounting kit', quantity: 1, unitPrice: 9000, amount: 9000, lineOrder: 1 },
          { description: 'Installation labour', quantity: 1, unitPrice: 5000, amount: 5000, lineOrder: 2 },
        ],
      },
    },
  });

  const quoteLines = await prisma.quotationLine.findMany({ where: { quotationId: quote.id } });
  const order = await prisma.salesOrder.create({
    data: {
      orderNumber: `SO-${new Date().getFullYear()}-00001`,
      customerId: customer.id,
      quotationId: quote.id,
      title: quote.title,
      status: 'CONFIRMED',
      subtotal: 42000,
      taxRate: 16,
      taxAmount: 6720,
      total: 48720,
      createdById: adminUserId,
      lines: {
        create: quoteLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
          lineOrder: l.lineOrder,
        })),
      },
    },
  });

  await prisma.contract.create({
    data: {
      contractNumber: `CT-${new Date().getFullYear()}-00001`,
      customerId: customer.id,
      salesOrderId: order.id,
      title: 'Solar installation service agreement',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      value: 48720,
      terms: '12-month workmanship warranty; payment per milestone.',
      createdById: adminUserId,
    },
  });

  const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${new Date().getFullYear()}-00001`,
      customerId: customer.id,
      salesOrderId: order.id,
      status: 'SENT',
      dueDate: due,
      sentAt: new Date(),
      subtotal: 42000,
      taxRate: 16,
      taxAmount: 6720,
      total: 48720,
      amountPaid: 20000,
      createdById: adminUserId,
      lines: {
        create: [
          { description: 'Deposit — solar installation', quantity: 1, unitPrice: 48720, amount: 48720, lineOrder: 0 },
        ],
      },
      payments: {
        create: {
          amount: 20000,
          method: 'Bank transfer',
          reference: 'DEP-001',
          recordedById: adminUserId,
        },
      },
    },
  });

  const overdueDue = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${new Date().getFullYear()}-00002`,
      customerId: customer.id,
      status: 'OVERDUE',
      dueDate: overdueDue,
      sentAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      subtotal: 8500,
      taxAmount: 0,
      total: 8500,
      amountPaid: 0,
      createdById: adminUserId,
      lines: {
        create: [
          { description: 'Annual maintenance service', quantity: 1, unitPrice: 8500, amount: 8500, lineOrder: 0 },
        ],
      },
    },
  });

  await prisma.vendorInvoice.create({
    data: {
      billNumber: `BILL-${new Date().getFullYear()}-00001`,
      supplierId: supplier.id,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      subtotal: 18500,
      taxAmount: 2960,
      total: 21460,
      description: 'Panel shipment — batch #442',
      createdById: adminUserId,
    },
  });
}
