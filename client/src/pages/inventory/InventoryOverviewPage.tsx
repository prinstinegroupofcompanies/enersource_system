import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, Warehouse, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { inventoryApi, formatMoney } from '../../lib/inventoryApi';
import type { InventorySummary } from '../../types/inventory';
import { Card } from '../../components/ui/Card';

export function InventoryOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<InventorySummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    inventoryApi.summary(accessToken).then(setS);
  }, [accessToken]);

  const cards = [
    { label: 'Total Valuation', value: formatMoney(s?.totalValuation ?? 0), icon: Package },
    { label: 'SKUs', value: String(s?.itemCount ?? 0), icon: Warehouse },
    { label: 'Low Stock Alerts', value: String(s?.lowStockCount ?? 0), icon: AlertTriangle },
    { label: 'Movements (30d)', value: String(s?.movementsLast30Days ?? 0), icon: ArrowLeftRight },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className="mt-1 text-xl font-bold">{c.value}</p>
                </div>
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
            </Card>
          );
        })}
      </div>

      {s?.lowStockItems?.length ? (
        <Card title="Low Stock Alerts">
          <ul className="space-y-2 text-sm">
            {s.lowStockItems.map((i) => (
              <li key={i.sku} className="flex justify-between text-red-800">
                <span>
                  {i.sku} — {i.name}
                </span>
                <span className="font-semibold">
                  {i.quantityOnHand} / {i.reorderLevel} min
                </span>
              </li>
            ))}
          </ul>
          <Link to="/inventory/reports" className="mt-3 inline-block text-sm font-semibold text-brand-700">
            View all reports →
          </Link>
        </Card>
      ) : null}

      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/inventory/items', label: 'Manage stock' },
            { to: '/inventory/movements', label: 'Record receipt/issue' },
            { to: '/inventory/transfers', label: 'Warehouse transfer' },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
