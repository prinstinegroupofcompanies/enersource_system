import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, ClipboardCheck, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hrApi } from '../../lib/hrApi';
import type { HrSummary } from '../../types/hr';
import { Card } from '../../components/ui/Card';

export function HrOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<HrSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    hrApi.summary(accessToken).then(setS);
  }, [accessToken]);

  const cards = [
    { label: 'Active staff', value: String(s?.activeEmployees ?? 0), icon: Users },
    { label: 'Present today', value: String(s?.presentToday ?? 0), icon: UserCheck, sub: `${s?.attendanceRate ?? 0}% rate` },
    { label: 'Pending appraisals', value: String(s?.pendingAppraisals ?? 0), icon: ClipboardCheck },
    { label: 'Avg KPI score', value: `${s?.averageKpiScore ?? 0}%`, icon: Star },
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
                  {'sub' in c && c.sub ? <p className="text-xs text-slate-500">{c.sub}</p> : null}
                </div>
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
            </Card>
          );
        })}
      </div>

      {s?.recentHires?.length ? (
        <Card title="Recent hires">
          <ul className="divide-y divide-slate-100 text-sm">
            {s.recentHires.map((e) => (
              <li key={e.id} className="flex justify-between py-2">
                <span>
                  <span className="font-mono text-brand-800">{e.employeeNumber}</span> — {e.name}
                  <span className="block text-xs text-slate-500">
                    {e.jobTitle ?? '—'} · {e.department ?? '—'}
                  </span>
                </span>
                <span className="text-xs text-slate-400">
                  {e.hireDate ? new Date(e.hireDate).toLocaleDateString() : '—'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Quick actions">
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/hr/employees', label: 'Employee directory' },
            { to: '/hr/attendance', label: 'Record attendance' },
            { to: '/hr/appraisals', label: 'Performance reviews' },
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
