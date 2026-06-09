import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, reportsApi } from '../../lib/reportsApi';
import { Card } from '../../components/ui/Card';

export function ReportsFinancialPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    reportsApi.financial(accessToken).then(setData);
  }, [accessToken]);

  if (data && !data.available) {
    return (
      <Card title="Financial Reports">
        <p className="text-sm text-slate-600">{String(data.message ?? 'Financial reports are not available for your role.')}</p>
      </Card>
    );
  }

  const income = data?.incomeStatement as { revenue?: { total: number }; netProfit?: number; grossProfit?: number } | undefined;
  const balance = data?.balanceSheet as { assets?: { total: number }; liabilities?: { total: number }; equity?: { total: number } } | undefined;
  const sales = data?.sales as { pendingInvoices?: number; overdueInvoices?: number; monthlyRevenue?: number } | undefined;
  const links = (data?.links as { label: string; path: string }[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Monthly revenue</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(income?.revenue?.total ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Net profit</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(income?.netProfit ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total assets</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(balance?.assets?.total ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Outstanding AR</p>
          <p className="mt-1 text-xl font-bold">{formatMoney(sales?.pendingInvoices ?? 0)}</p>
        </Card>
      </div>

      {balance ? (
        <Card title="Balance Sheet Summary">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Assets</dt>
              <dd className="font-semibold">{formatMoney(balance.assets?.total ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Liabilities</dt>
              <dd className="font-semibold">{formatMoney(balance.liabilities?.total ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Equity</dt>
              <dd className="font-semibold">{formatMoney(balance.equity?.total ?? 0)}</dd>
            </div>
          </dl>
        </Card>
      ) : null}

      <Card title="Detailed Reports">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.path}>
              <Link to={link.path} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                {link.label} →
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
