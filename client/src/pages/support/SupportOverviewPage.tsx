import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supportApi, PRIORITY_LABELS, TICKET_TYPE_LABELS } from '../../lib/supportApi';
import type { SupportSummary } from '../../types/phase10';
import { Card } from '../../components/ui/Card';

export function SupportOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<SupportSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    supportApi.summary(accessToken).then(setS);
  }, [accessToken]);

  const cards = [
    { label: 'Open', value: String(s?.openTickets ?? 0), icon: Headphones },
    { label: 'In progress', value: String(s?.inProgressTickets ?? 0), icon: Clock },
    { label: 'Customer open', value: String(s?.customerOpenTickets ?? 0), icon: Headphones },
    { label: 'Urgent', value: String(s?.urgentTickets ?? 0), icon: AlertCircle },
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

      {s?.recent?.length ? (
        <Card title="Recent tickets">
          <ul className="divide-y divide-slate-100 text-sm">
            {s.recent.map((t) => (
              <li key={t.id} className="py-2">
                <span className="font-mono text-brand-800">{t.ticketNumber}</span> — {t.title}
                <span className="block text-xs text-slate-500">
                  {TICKET_TYPE_LABELS[t.type]} · {PRIORITY_LABELS[t.priority]} · {t.status}
                  {t.customer ? ` · ${t.customer}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Link to="/support/tickets" className="inline-flex rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100">
        Manage tickets →
      </Link>
    </div>
  );
}
