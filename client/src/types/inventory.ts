export interface InventorySummary {
  itemCount: number;
  warehouseCount: number;
  totalValuation: number;
  totalQuantity: number;
  lowStockCount: number;
  movementsLast30Days: number;
  lowStockItems: { sku: string; name: string; quantityOnHand: number; reorderLevel: number }[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  reorderLevel: number;
  quantityOnHand: number;
  valuation: number;
  isLowStock: boolean;
  balances: { quantity: number; warehouse: { id: string; name: string; code: string } }[];
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string | null;
}
