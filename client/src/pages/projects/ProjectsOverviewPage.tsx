import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { projectsApi, formatMoney, STATUS_LABELS } from '../../lib/projectsApi';
import type { ProjectSummary } from '../../types/projects';
import { Card } from '../../components/ui/Card';

export function ProjectsOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<ProjectSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    projectsApi.summary(accessToken).then(setS);
  }, [accessToken]);

  const cards = [
    { label: 'Active', value: String(s?.activeProjects ?? 0), icon: FolderKanban },
    { label: 'Completed', value: String(s?.completedProjects ?? 0), icon: CheckCircle2 },
    { label: 'Delayed', value: String(s?.delayedProjects ?? 0), icon: AlertTriangle },
    {
      label: 'Budget headroom',
      value: `${s?.budgetPerformance ?? 0}%`,
      icon: Wallet,
      sub: `${formatMoney(s?.totalSpent ?? 0)} / ${formatMoney(s?.totalBudget ?? 0)}`,
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
                  {'sub' in c && c.sub ? <p className="mt-0.5 text-xs text-slate-500">{c.sub}</p> : null}
                </div>
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
            </Card>
          );
        })}
      </div>

      {s?.recent?.length ? (
        <Card title="Recent projects">
          <ul className="divide-y divide-slate-100">
            {s.recent.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <div>
                  <Link to={`/projects/${p.id}`} className="font-mono text-sm font-semibold text-brand-800 hover:underline">
                    {p.projectNumber}
                  </Link>
                  <p className="font-medium text-slate-900">{p.title}</p>
                  <p className="text-sm text-slate-500">
                    {STATUS_LABELS[p.status] ?? p.status}
                    {p.customer ? ` · ${p.customer}` : ''}
                    {p.isDelayed ? ' · Delayed' : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{p.progressPercent}%</span>
              </li>
            ))}
          </ul>
          <Link to="/projects/list" className="mt-3 inline-block text-sm font-semibold text-brand-700">
            View all projects →
          </Link>
        </Card>
      ) : null}

      <Card title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/projects/list"
            className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
          >
            Browse & create projects
          </Link>
        </div>
      </Card>
    </div>
  );
}
