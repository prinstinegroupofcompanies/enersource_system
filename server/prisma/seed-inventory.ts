import { PrismaClient } from '@prisma/client';
import { seedInventoryDefaults } from '../src/services/inventory/items.service.js';

export async function seedInventory(prisma: PrismaClient) {
  const count = await prisma.inventoryItem.count();
  if (count > 0) return;
  await seedInventoryDefaults();
}
