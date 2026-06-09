export const INVENTORY_CATEGORIES = [
  'Solar Panels',
  'Batteries',
  'Inverters',
  'Mounting Structures',
  'Electrical Components',
  'Spare Parts',
] as const;

export const MOVEMENT_TYPES = ['RECEIPT', 'ISSUE', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN'] as const;

export const DEFAULT_WAREHOUSES = [
  { code: 'MAIN', name: 'Main Warehouse', location: 'Nairobi HQ' },
  { code: 'SITE-A', name: 'Site Store A', location: 'Installation yard' },
  { code: 'SITE-B', name: 'Site Store B', location: 'Regional depot' },
] as const;

export const DEFAULT_ITEMS = [
  { sku: 'PNL-450W', name: 'Monocrystalline Panel 450W', category: 'Solar Panels', unit: 'pcs', unitCost: 185, reorderLevel: 20 },
  { sku: 'BAT-5KWH', name: 'Lithium Battery 5kWh', category: 'Batteries', unit: 'pcs', unitCost: 1200, reorderLevel: 5 },
  { sku: 'INV-5KW', name: 'Hybrid Inverter 5kW', category: 'Inverters', unit: 'pcs', unitCost: 890, reorderLevel: 8 },
  { sku: 'MNT-RAIL', name: 'Aluminium Mounting Rail 3m', category: 'Mounting Structures', unit: 'pcs', unitCost: 42, reorderLevel: 50 },
  { sku: 'CBL-DC-6MM', name: 'DC Solar Cable 6mm² (100m)', category: 'Electrical Components', unit: 'roll', unitCost: 95, reorderLevel: 10 },
  { sku: 'SPF-CONNECT', name: 'MC4 Connector Pair', category: 'Spare Parts', unit: 'pair', unitCost: 3.5, reorderLevel: 200 },
] as const;
