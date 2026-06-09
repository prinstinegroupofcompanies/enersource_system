import { prisma } from '../../lib/prisma.js';
import { nextNumber } from '../../utils/sales.js';
import { recordMovement } from './stock.service.js';
import { createAuditLog } from '../audit.service.js';

export async function listTransfers() {
  return prisma.stockTransfer.findMany({
    include: {
      fromWarehouse: { select: { name: true, code: true } },
      toWarehouse: { select: { name: true, code: true } },
      lines: { include: { item: { select: { sku: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function createTransfer(
  data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    notes?: string;
    lines: { itemId: string; quantity: number }[];
  },
  createdById: string
) {
  if (data.fromWarehouseId === data.toWarehouseId) {
    throw new Error('Source and destination must differ');
  }
  if (!data.lines.length) throw new Error('At least one line required');

  const transferNumber = await nextNumber('ST', prisma.stockTransfer);

  return prisma.stockTransfer.create({
    data: {
      transferNumber,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      notes: data.notes,
      createdById,
      lines: {
        create: data.lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
        })),
      },
    },
    include: {
      lines: { include: { item: true } },
      fromWarehouse: true,
      toWarehouse: true,
    },
  });
}

export async function completeTransfer(id: string, actorId: string) {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!transfer) throw new Error('Transfer not found');
  if (transfer.status !== 'DRAFT') throw new Error('Transfer already processed');

  await prisma.$transaction(async () => {
    for (const line of transfer.lines) {
      await recordMovement({
        type: 'TRANSFER_OUT',
        itemId: line.itemId,
        warehouseId: transfer.fromWarehouseId,
        relatedWarehouseId: transfer.toWarehouseId,
        quantity: line.quantity,
        reference: transfer.transferNumber,
        notes: `Transfer to ${transfer.toWarehouseId}`,
        createdById: actorId,
        transferId: transfer.id,
      });
      await recordMovement({
        type: 'TRANSFER_IN',
        itemId: line.itemId,
        warehouseId: transfer.toWarehouseId,
        relatedWarehouseId: transfer.fromWarehouseId,
        quantity: line.quantity,
        reference: transfer.transferNumber,
        notes: `Transfer from ${transfer.fromWarehouseId}`,
        createdById: actorId,
        transferId: transfer.id,
      });
    }

    await prisma.stockTransfer.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  });

  await createAuditLog({
    actorId,
    action: 'STOCK_TRANSFER_COMPLETED',
    entityType: 'StockTransfer',
    entityId: id,
  });

  return prisma.stockTransfer.findUnique({
    where: { id },
    include: { lines: { include: { item: true } }, fromWarehouse: true, toWarehouse: true },
  });
}
