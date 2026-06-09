import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { crmApi, formatMoney, STATUS_LABELS } from '../../lib/crmApi';
import type { PipelineColumn } from '../../types/crm';

export function CrmPipelinePage() {
  const { accessToken, hasPermission } = useAuth();
  const [cols, setCols] = useState<PipelineColumn[]>([]);

  const load = () => {
    if (!accessToken) return;
    crmApi.pipeline(accessToken).then(setCols);
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const moveLead = (leadId: string, status: string) => {
    if (!accessToken || !hasPermission('crm', 'edit')) return;
    crmApi.updateLead(accessToken, leadId, { status }).then(load);
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {cols.map((col) => (
          <div key={col.stage} className="w-64 shrink-0 rounded-2xl border border-slate-200 bg-slate-50/80">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="font-semibold text-slate-800">{STATUS_LABELS[col.stage] ?? col.stage}</p>
              <p className="text-xs text-slate-500">
                {col.leads.length} leads · {formatMoney(col.totalValue)}
              </p>
            </div>
            <ul className="space-y-2 p-3">
              {col.leads.map((l) => (
                <li key={l.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="font-mono text-xs text-brand-700">{l.leadNumber}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{l.companyName}</p>
                  <p className="text-xs text-slate-500">{formatMoney(l.estimatedValue)}</p>
                  {hasPermission('crm', 'edit') ? (
                    <select
                      className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      value={l.status}
                      onChange={(e) => moveLead(l.id, e.target.value)}
                    >
                      {cols.map((c) => (
                        <option key={c.stage} value={c.stage}>
                          {STATUS_LABELS[c.stage]}
                        </option>
                      ))}
                      <option value="WON">Won</option>
                      <option value="LOST">Lost</option>
                    </select>
                  ) : null}
                </li>
              ))}
              {!col.leads.length ? <p className="py-4 text-center text-xs text-slate-400">Empty</p> : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
