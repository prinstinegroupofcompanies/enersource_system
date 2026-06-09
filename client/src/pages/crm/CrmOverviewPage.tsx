import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Target, Bell, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { crmApi, formatMoney, STATUS_LABELS } from '../../lib/crmApi';
import type { CrmSummary } from '../../types/crm';
import { Card } from '../../components/ui/Card';

export function CrmOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<CrmSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    crmApi.summary(accessToken).then(setS);
  }, [accessToken]);

  const cards = [
    { label: 'Open leads', value: String(s?.openLeads ?? 0), icon: Target },
    { label: 'Pipeline value', value: formatMoney(s?.pipelineValue ?? 0), icon: TrendingUp },
    { label: 'Active clients', value: String(s?.activeClients ?? 0), icon: Users },
    {
      label: 'Reminders',
      value: String(s?.pendingReminders ?? 0),
      icon: Bell,
      sub: s?.overdueReminders ? `${s.overdueReminders} overdue` : undefined,
    },
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
                  {'sub' in c && c.sub ? <p className="text-xs text-red-600">{c.sub}</p> : null}
                </div>
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
            </Card>
          );
        })}
      </div>

      {s?.pipeline?.length ? (
        <Card title="Pipeline by stage">
          <div className="grid gap-3 sm:grid-cols-5">
            {s.pipeline.map((col) => (
              <div key={col.stage} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {STATUS_LABELS[col.stage] ?? col.stage}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{col.count}</p>
                <p className="text-xs text-slate-500">{formatMoney(col.value)}</p>
              </div>
            ))}
          </div>
          <Link to="/crm/pipeline" className="mt-3 inline-block text-sm font-semibold text-brand-700">
            Open pipeline board →
          </Link>
        </Card>
      ) : null}

      {s?.recentActivities?.length ? (
        <Card title="Recent activity">
          <ul className="divide-y divide-slate-100 text-sm">
            {s.recentActivities.map((a) => (
              <li key={a.id} className="flex justify-between py-2">
                <span>
                  <span className="font-medium">{a.subject}</span>
                  <span className="text-slate-500"> · {a.type}</span>
                  {a.lead || a.customer ? (
                    <span className="block text-xs text-slate-400">{a.lead ?? a.customer}</span>
                  ) : null}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(a.activityDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Quick actions">
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/crm/leads', label: 'Manage leads' },
            { to: '/crm/reminders', label: 'View reminders' },
            { to: '/crm/clients', label: 'Client directory' },
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
