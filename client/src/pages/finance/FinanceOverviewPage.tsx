import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, BookOpen, Scale, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeApi, formatMoney } from '../../lib/financeApi';
import type { FinanceSummary } from '../../types/finance';
import { Card } from '../../components/ui/Card';

export function FinanceOverviewPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    financeApi.summary(accessToken).then(setSummary).catch(() => {});
  }, [accessToken]);

  const cards = [
    { label: 'Cash & Bank', value: formatMoney(summary?.cashBalance ?? 0), icon: Landmark },
    { label: 'Monthly Revenue', value: formatMoney(summary?.monthlyRevenue ?? 0), icon: FileSpreadsheet },
    { label: 'Net Profit (MTD)', value: formatMoney(summary?.netProfit ?? 0), icon: Scale },
    { label: 'Pending Approval', value: String(summary?.pendingApproval ?? 0), icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{c.value}</p>
                </div>
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Balance Sheet Snapshot">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Total Assets</dt>
              <dd className="font-semibold">{formatMoney(summary?.totalAssets ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Total Liabilities</dt>
              <dd className="font-semibold">{formatMoney(summary?.totalLiabilities ?? 0)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <dt className="text-slate-600">Active Accounts</dt>
              <dd className="font-semibold">{summary?.totalAccounts ?? 0}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Quick Links">
          <div className="grid gap-2">
            {[
              { to: '/finance/journals', label: 'Create journal entry', icon: BookOpen },
              { to: '/finance/trial-balance', label: 'Run trial balance', icon: Scale },
              { to: '/finance/reports', label: 'View financial statements', icon: FileSpreadsheet },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-brand-200 hover:bg-brand-50"
                >
                  <Icon className="h-4 w-4 text-brand-700" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
