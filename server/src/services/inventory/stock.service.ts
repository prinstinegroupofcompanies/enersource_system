import { prisma } from '../../lib/prisma.js';
import { roundMoney } from '../../utils/finance.js';
import { nextNumber } from '../../utils/sales.js';

export async function getOrCreateBalance(itemId: string, warehouseId: string) {
  const existing = await prisma.stockBalance.findUnique({
    where: { itemId_warehouseId: { itemId, warehouseId } },
  });
  if (existing) return existing;
  return prisma.stockBalance.create({
    data: { itemId, warehouseId, quantity: 0 },
  });
}

export async function adjustBalance(itemId: string, warehouseId: string, delta: number) {
  const balance = await getOrCreateBalance(itemId, warehouseId);
  const newQty = roundMoney(balance.quantity + delta);
  if (newQty < 0) throw new Error('Insufficient stock at warehouse');
  return prisma.stockBalance.update({
    where: { id: balance.id },
    data: { quantity: newQty },
  });
}

export async function recordMovement(params: {
  type: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  relatedWarehouseId?: string;
  unitCost?: number;
  reference?: string;
  notes?: string;
  createdById: string;
  transferId?: string;
}) {
  const qty = Math.abs(params.quantity);
  if (qty <= 0) throw new Error('Quantity must be positive');

  const movementNumber = await nextNumber('SM', prisma.stockMovement);

  if (params.type === 'RECEIPT') {
    await adjustBalance(params.itemId, params.warehouseId, qty);
  } else if (params.type === 'ISSUE') {
    await adjustBalance(params.itemId, params.warehouseId, -qty);
  } else if (params.type === 'ADJUSTMENT') {
    await adjustBalance(params.itemId, params.warehouseId, params.quantity);
  } else if (params.type === 'TRANSFER_OUT' && params.relatedWarehouseId) {
    await adjustBalance(params.itemId, params.warehouseId, -qty);
  } else if (params.type === 'TRANSFER_IN' && params.relatedWarehouseId) {
    await adjustBalance(params.itemId, params.warehouseId, qty);
  } else {
    throw new Error('Invalid movement type');
  }

  return prisma.stockMovement.create({
    data: {
      movementNumber,
      type: params.type,
      itemId: params.itemId,
      warehouseId: params.warehouseId,
      relatedWarehouseId: params.relatedWarehouseId,
      quantity: params.type === 'ADJUSTMENT' ? params.quantity : qty,
      unitCost: params.unitCost,
      reference: params.reference,
      notes: params.notes,
      createdById: params.createdById,
      transferId: params.transferId,
    },
    include: {
      item: { select: { sku: true, name: true } },
      warehouse: { select: { name: true, code: true } },
    },
  });
}
