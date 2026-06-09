import { prisma } from '../../lib/prisma.js';
import { DEFAULT_ITEMS, DEFAULT_WAREHOUSES } from '../../constants/inventory.js';
import { roundMoney } from '../../utils/finance.js';

export async function listItems(filters?: { category?: string; search?: string; lowStock?: boolean }) {
  const items = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.search && {
        OR: [
          { sku: { contains: filters.search } },
          { name: { contains: filters.search } },
        ],
      }),
    },
    include: {
      balances: { include: { warehouse: { select: { id: true, name: true, code: true } } } },
    },
    orderBy: { sku: 'asc' },
  });

  return items.map((item) => {
    const quantityOnHand = roundMoney(item.balances.reduce((s, b) => s + b.quantity, 0));
    const valuation = roundMoney(quantityOnHand * item.unitCost);
    const isLowStock = quantityOnHand <= item.reorderLevel;
    return { ...item, quantityOnHand, valuation, isLowStock };
  }).filter((item) => !filters?.lowStock || item.isLowStock);
}

export async function createItem(data: {
  sku: string;
  name: string;
  category: string;
  unit?: string;
  unitCost?: number;
  reorderLevel?: number;
  expiryDate?: string;
  description?: string;
}) {
  const existing = await prisma.inventoryItem.findUnique({ where: { sku: data.sku } });
  if (existing) throw new Error('SKU already exists');

  const item = await prisma.inventoryItem.create({ data: {
    sku: data.sku,
    name: data.name,
    category: data.category,
    unit: data.unit ?? 'pcs',
    unitCost: data.unitCost ?? 0,
    reorderLevel: data.reorderLevel ?? 0,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    description: data.description,
  }});

  const main = await prisma.warehouse.findFirst({ where: { code: 'MAIN' } });
  if (main) {
    await prisma.stockBalance.create({
      data: { itemId: item.id, warehouseId: main.id, quantity: 0 },
    });
  }

  return item;
}

export async function updateItem(
  id: string,
  data: Partial<{
    name: string;
    unitCost: number;
    reorderLevel: number;
    expiryDate: string | null;
    description: string;
    isActive: boolean;
  }>
) {
  return prisma.inventoryItem.update({
    where: { id },
    data: {
      ...data,
      expiryDate: data.expiryDate === null ? null : data.expiryDate ? new Date(data.expiryDate) : undefined,
    },
  });
}

export async function listWarehouses() {
  return prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}

export async function seedInventoryDefaults() {
  for (const wh of DEFAULT_WAREHOUSES) {
    await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: { name: wh.name, location: wh.location },
      create: wh,
    });
  }

  const main = await prisma.warehouse.findUnique({ where: { code: 'MAIN' } });
  const siteA = await prisma.warehouse.findUnique({ where: { code: 'SITE-A' } });
  if (!main) return { imported: 0 };

  let count = 0;
  const seedQty: Record<string, { main: number; siteA?: number }> = {
    'PNL-450W': { main: 85, siteA: 12 },
    'BAT-5KWH': { main: 18, siteA: 2 },
    'INV-5KW': { main: 24 },
    'MNT-RAIL': { main: 120, siteA: 30 },
    'CBL-DC-6MM': { main: 8 },
    'SPF-CONNECT': { main: 15, siteA: 5 },
  };

  for (const tpl of DEFAULT_ITEMS) {
    const item = await prisma.inventoryItem.upsert({
      where: { sku: tpl.sku },
      update: {
        name: tpl.name,
        category: tpl.category,
        unit: tpl.unit,
        unitCost: tpl.unitCost,
        reorderLevel: tpl.reorderLevel,
      },
      create: {
        sku: tpl.sku,
        name: tpl.name,
        category: tpl.category,
        unit: tpl.unit,
        unitCost: tpl.unitCost,
        reorderLevel: tpl.reorderLevel,
      },
    });

    const qty = seedQty[tpl.sku] ?? { main: 10 };
    await prisma.stockBalance.upsert({
      where: { itemId_warehouseId: { itemId: item.id, warehouseId: main.id } },
      update: { quantity: qty.main },
      create: { itemId: item.id, warehouseId: main.id, quantity: qty.main },
    });

    if (siteA && qty.siteA) {
      await prisma.stockBalance.upsert({
        where: { itemId_warehouseId: { itemId: item.id, warehouseId: siteA.id } },
        update: { quantity: qty.siteA },
        create: { itemId: item.id, warehouseId: siteA.id, quantity: qty.siteA },
      });
    }
    count++;
  }

  return { imported: count };
}
