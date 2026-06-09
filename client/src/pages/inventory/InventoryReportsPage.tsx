import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { inventoryApi, formatMoney } from '../../lib/inventoryApi';
import type { InventoryItem } from '../../types/inventory';
import { Card } from '../../components/ui/Card';

export function InventoryReportsPage() {
  const { accessToken } = useAuth();
  const [valuation, setValuation] = useState<{
    total: number;
    byCategory: { category: string; value: number; quantity: number }[];
  } | null>(null);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    inventoryApi.valuation(accessToken).then((d) => setValuation(d as typeof valuation));
    inventoryApi.lowStock(accessToken).then(setLowStock);
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <Card title="Inventory Valuation">
        <p className="text-2xl font-bold text-slate-900">{formatMoney(valuation?.total ?? 0)}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {valuation?.byCategory?.map((c) => (
            <li key={c.category} className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-600">{c.category}</span>
              <span className="font-semibold">{formatMoney(c.value)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Low Stock Alerts">
        {lowStock.length === 0 ? (
          <p className="text-sm text-emerald-700">All items above reorder levels.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left pb-2">SKU</th>
                <th className="text-right pb-2">On Hand</th>
                <th className="text-right pb-2">Reorder</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((i) => (
                <tr key={i.id} className="border-t border-slate-50 text-red-800">
                  <td className="py-2">
                    {i.sku} — {i.name}
                  </td>
                  <td className="py-2 text-right font-semibold">{i.quantityOnHand}</td>
                  <td className="py-2 text-right">{i.reorderLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
