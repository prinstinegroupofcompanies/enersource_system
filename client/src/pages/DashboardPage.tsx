import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Bell, ArrowRight, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { reportsApi, formatMoney } from '../lib/reportsApi';
import { modulePath } from '../config/modulePaths';
import type { DashboardSummary } from '../types';
import { Card } from '../components/ui/Card';

export function DashboardPage() {
  const { user, accessToken, hasPermission } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<{ month: string; revenue: number; expenses: number }[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    api.get<DashboardSummary>('/dashboard/summary', accessToken).then(setSummary).catch(() => {});
    if (hasPermission('reports', 'view')) {
      reportsApi.summary(accessToken).then((r) => setRevenueTrend(r.revenueTrend)).catch(() => {});
    }
  }, [accessToken, hasPermission]);

  const metrics = summary?.metrics ?? {};
  const metricCards = [
    { label: 'Active Users', value: summary?.system.activeUsers ?? '—', icon: Users, color: 'brand' },
    { label: 'Unread Alerts', value: summary?.system.unreadNotifications ?? 0, icon: Bell, color: 'amber' },
    {
      label: String(metrics.label ?? 'Overview'),
      value:
        typeof metrics.netProfit === 'number'
          ? formatMoney(metrics.netProfit)
          : typeof metrics.monthlyRevenue === 'number'
            ? formatMoney(metrics.monthlyRevenue)
            : '—',
      icon: TrendingUp,
      color: 'emerald',
    },
  ];

  const enabledModules = (summary?.modules ?? []).filter((m) => m.enabled);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-1 text-slate-600">
          {summary?.message ?? 'Your role-based workspace for Enersource operations.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="slide-up">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-2.5">
                  <Icon className="h-5 w-5 text-brand-700" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {revenueTrend.length ? (
          <Card title="Revenue vs Expenses" className="lg:col-span-2">
            <p className="mb-4 text-xs text-slate-500">Live figures from posted journal entries (last 6 months)</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend}>
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
        ) : (
          <Card title="Analytics" className="lg:col-span-2">
            <p className="text-sm text-slate-600">
              Revenue trends are available in{' '}
              <Link to="/reports" className="font-semibold text-brand-700 hover:text-brand-800">
                Reports & BI
              </Link>{' '}
              for finance-enabled roles.
            </p>
          </Card>
        )}

        <Card title="Your Modules">
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {enabledModules.map((m) => (
              <li key={m.key}>
                <Link
                  to={modulePath(m.key)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700">{m.name}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Live</span>
                </Link>
              </li>
            ))}
            {!enabledModules.length ? (
              <p className="py-4 text-center text-sm text-slate-500">No modules assigned to your role.</p>
            ) : null}
          </ul>
          {user?.role.slug === 'super-administrator' ? (
            <Link
              to="/users"
              className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Manage users <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </Card>
      </div>

      <Card title="Quick Actions">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/profile"
            className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-800 transition-all hover:bg-brand-100 touch-target"
          >
            My Profile & MFA
          </Link>
          {hasPermission('reports', 'view') ? (
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 touch-target"
            >
              <BarChart3 className="h-4 w-4" /> Reports & BI
            </Link>
          ) : null}
          {user?.role.slug === 'super-administrator' ? (
            <Link
              to="/users"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 touch-target"
            >
              Add User
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
