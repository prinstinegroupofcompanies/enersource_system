import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, FileText, AlertCircle, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salesApi, formatMoney } from '../../lib/salesApi';
import type { SalesSummary } from '../../types/sales';
import { Card } from '../../components/ui/Card';

export function SalesOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<SalesSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    salesApi.summary(accessToken).then(setS);
  }, [accessToken]);

  const cards = [
    { label: 'Total Sales', value: formatMoney(s?.totalSales ?? 0), icon: TrendingUp },
    { label: 'Monthly Revenue', value: formatMoney(s?.monthlyRevenue ?? 0), icon: Target },
    { label: 'Pending Invoices', value: formatMoney(s?.pendingInvoices ?? 0), icon: FileText },
    { label: 'Overdue', value: String(s?.overdueInvoices ?? 0), icon: AlertCircle },
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

      <Card title="Sales Target">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress this month</span>
            <span className="font-semibold">{s?.targetProgress ?? 0}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${Math.min(s?.targetProgress ?? 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Target: {formatMoney(s?.salesTarget ?? 0)} · Active orders: {s?.activeOrders ?? 0} · Open quotes:{' '}
            {s?.openQuotations ?? 0}
          </p>
        </div>
      </Card>

      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/sales/quotations', label: 'New quotation' },
            { to: '/sales/invoices', label: 'Manage invoices' },
            { to: '/sales/receivables', label: 'AR aging' },
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
