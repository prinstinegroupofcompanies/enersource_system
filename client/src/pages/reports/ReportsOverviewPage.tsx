import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, reportsApi } from '../../lib/reportsApi';
import type { ReportsSummary } from '../../types/phase11';
import { Card } from '../../components/ui/Card';

const MONEY_KEYS = new Set(['revenue', 'netProfit', 'expenses', 'totalSales', 'pendingInvoices', 'inventoryValue', 'pipelineValue', 'bookValue', 'pettyCashBalance', 'periodExpenses']);

function formatKpiValue(key: string, value: string | number) {
  if (MONEY_KEYS.has(key) && typeof value === 'number') return formatMoney(value);
  if (typeof value === 'number' && key.endsWith('Rate')) return `${value}%`;
  if (typeof value === 'number' && key === 'budgetPerformance') return `${value}%`;
  return String(value);
}

export function ReportsOverviewPage() {
  const { accessToken, hasPermission } = useAuth();
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [catalogTotal, setCatalogTotal] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    reportsApi.summary(accessToken).then(setSummary);
    reportsApi.catalog(accessToken).then((c) => setCatalogTotal(c.total));
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{summary?.dashboardLabel ?? 'Loading analytics…'}</p>
        {hasPermission('reports', 'export') ? (
          <button
            type="button"
            onClick={() => accessToken && reportsApi.exportExecutiveSummary(accessToken)}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(summary?.kpis ?? []).slice(0, 8).map((kpi) => (
          <Card key={kpi.key}>
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-xl font-bold">{formatKpiValue(kpi.key, kpi.value)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-brand-600" />
            </div>
          </Card>
        ))}
      </div>

      {summary?.revenueTrend?.length ? (
        <Card title="Revenue vs Expenses (6 months)">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Report catalog">
          <p className="text-sm text-slate-600">
            <strong>{catalogTotal}</strong> reports available for your role across{' '}
            {summary?.modules.length ?? 0} modules.
          </p>
          <Link
            to="/reports/financial"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            <BarChart3 className="h-4 w-4" /> Browse reports →
          </Link>
        </Card>
        <Card title="Quick links">
          <ul className="space-y-2 text-sm">
            {summary?.modules.includes('finance') ? (
              <li><Link to="/finance/reports" className="text-brand-700 hover:underline">Financial statements</Link></li>
            ) : null}
            {summary?.modules.includes('inventory') ? (
              <li><Link to="/inventory/reports" className="text-brand-700 hover:underline">Inventory valuation</Link></li>
            ) : null}
            {summary?.modules.includes('crm') ? (
              <li><Link to="/crm/pipeline" className="text-brand-700 hover:underline">Sales pipeline</Link></li>
            ) : null}
            {summary?.modules.includes('hr') ? (
              <li><Link to="/hr" className="text-brand-700 hover:underline">HR dashboard</Link></li>
            ) : null}
          </ul>
        </Card>
      </div>
    </div>
  );
}
