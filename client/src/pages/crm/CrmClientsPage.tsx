import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { crmApi } from '../../lib/crmApi';
import type { CrmClient } from '../../types/crm';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export function CrmClientsPage() {
  const { accessToken } = useAuth();
  const [list, setList] = useState<CrmClient[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    const t = setTimeout(() => crmApi.clients(accessToken, search || undefined).then(setList), 200);
    return () => clearTimeout(t);
  }, [accessToken, search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search clients…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      <Card>
        <div className="divide-y divide-slate-50">
          {list.map((c) => (
            <div key={c.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <div>
                <p className="font-semibold text-slate-800">{c.companyName}</p>
                <p className="text-sm text-slate-500">
                  {c.contactPerson ?? '—'} · {c.email ?? '—'}
                </p>
                {c.reminders?.[0] ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Next follow-up: {c.reminders[0].title} (
                    {new Date(c.reminders[0].dueAt).toLocaleDateString()})
                  </p>
                ) : null}
              </div>
              <p className="text-xs text-slate-400">
                {c._count?.quotations ?? 0} quotes · {c._count?.invoices ?? 0} invoices ·{' '}
                {c._count?.projects ?? 0} projects · {c._count?.activities ?? 0} activities
              </p>
            </div>
          ))}
          {!list.length ? <p className="py-6 text-center text-sm text-slate-500">No clients found.</p> : null}
        </div>
      </Card>
    </div>
  );
}
