export const ASSET_CATEGORIES = ['VEHICLE', 'EQUIPMENT', 'IT', 'TOOL', 'OTHER'] as const;

export const ASSET_STATUSES = ['ACTIVE', 'MAINTENANCE', 'DISPOSED'] as const;

export const TICKET_TYPES = ['INTERNAL', 'CUSTOMER'] as const;

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  VEHICLE: 'Vehicle',
  EQUIPMENT: 'Equipment',
  IT: 'IT Hardware',
  TOOL: 'Tool',
  OTHER: 'Other',
};

export const ASSET_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  MAINTENANCE: 'In maintenance',
  DISPOSED: 'Disposed',
};

export const TICKET_TYPE_LABELS: Record<string, string> = {
  INTERNAL: 'Internal',
  CUSTOMER: 'Customer',
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export function computeDepreciation(asset: {
  purchaseCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  purchaseDate: Date | null;
  accumulatedDepreciation: number;
}) {
  const depreciable = Math.max(0, asset.purchaseCost - asset.salvageValue);
  const monthly = asset.usefulLifeMonths > 0 ? depreciable / asset.usefulLifeMonths : 0;

  let monthsElapsed = 0;
  if (asset.purchaseDate) {
    const now = new Date();
    monthsElapsed =
      (now.getFullYear() - asset.purchaseDate.getFullYear()) * 12 +
      (now.getMonth() - asset.purchaseDate.getMonth());
    monthsElapsed = Math.max(0, monthsElapsed);
  }

  const calculatedAccum = Math.min(depreciable, monthly * monthsElapsed);
  const accumulated = Math.max(asset.accumulatedDepreciation, calculatedAccum);
  const bookValue = Math.max(asset.salvageValue, asset.purchaseCost - accumulated);

  return {
    monthlyDepreciation: Math.round(monthly * 100) / 100,
    accumulatedDepreciation: Math.round(accumulated * 100) / 100,
    bookValue: Math.round(bookValue * 100) / 100,
    monthsElapsed,
  };
}
