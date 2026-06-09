import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { salesApi, formatMoney } from '../../lib/salesApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function SalesPayablesPage() {
  const { accessToken, hasPermission } = useAuth();
  const [data, setData] = useState<{
    summary: { totalOutstanding: number; billCount: number };
    bills: { id: string; billNumber: string; supplier: string; balance: number; dueDate: string; status: string }[];
  } | null>(null);

  const load = () => {
    if (!accessToken) return;
    salesApi.payables(accessToken).then((d) => setData(d as typeof data));
  };
  useEffect(() => {
    load();
  }, [accessToken]);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-slate-500">Total payables outstanding</p>
        <p className="text-2xl font-bold">{formatMoney(data?.summary.totalOutstanding ?? 0)}</p>
        <p className="text-xs text-slate-400">{data?.summary.billCount ?? 0} open bills</p>
      </Card>
      <Card title="Vendor Bills">
        <ul className="divide-y divide-slate-50">
          {data?.bills.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-mono text-sm text-brand-800">{b.billNumber}</span>
                <span className="ml-2 text-xs uppercase text-slate-500">{b.status}</span>
                <p className="text-sm">{b.supplier}</p>
                <p className="text-xs text-slate-500">Due {new Date(b.dueDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{formatMoney(b.balance)}</span>
                {hasPermission('sales', 'edit') && b.balance > 0 ? (
                  <Button size="sm" variant="secondary" onClick={() => salesApi.payVendorBill(accessToken!, b.id, b.balance).then(load)}>
                    Pay
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
