import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  crmApi,
  formatMoney,
  STATUS_LABELS,
  SOURCE_LABELS,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from '../../lib/crmApi';
import type { Lead } from '../../types/crm';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function CrmLeadsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Lead[]>([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    estimatedValue: '',
    notes: '',
  });

  const load = () => {
    if (!accessToken) return;
    crmApi.leads(accessToken, { status: filter || undefined }).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken, filter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await crmApi.createLead(accessToken, {
      ...form,
      estimatedValue: Number(form.estimatedValue) || 0,
    });
    setOpen(false);
    load();
  };

  const advance = (lead: Lead) => {
    if (!accessToken) return;
    const idx = LEAD_STATUSES.indexOf(lead.status as (typeof LEAD_STATUSES)[number]);
    const next = LEAD_STATUSES[Math.min(idx + 1, LEAD_STATUSES.length - 1)];
    if (next === lead.status) return;
    crmApi.updateLead(accessToken, lead.id, { status: next }).then(load);
  };

  const convert = (id: string) => {
    if (!accessToken) return;
    crmApi.convertLead(accessToken, id).then(load);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {hasPermission('crm', 'create') ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New lead
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {list.map((l) => (
          <Card key={l.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div>
                <span className="font-mono text-sm text-brand-800">{l.leadNumber}</span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                  {STATUS_LABELS[l.status] ?? l.status}
                </span>
                <p className="mt-1 font-medium">{l.companyName}</p>
                <p className="text-sm text-slate-500">
                  {l.contactPerson ?? '—'} · {SOURCE_LABELS[l.source] ?? l.source} ·{' '}
                  {formatMoney(l.estimatedValue)}
                </p>
              </div>
              {hasPermission('crm', 'edit') && l.status !== 'WON' && l.status !== 'LOST' ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => advance(l)}>
                    Advance stage
                  </Button>
                  {!l.customerId ? (
                    <Button size="sm" onClick={() => convert(l.id)}>
                      Convert to client
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New lead">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input
            label="Company"
            required
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          />
          <Input
            label="Contact"
            value={form.contactPerson}
            onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
          />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Select
            label="Source"
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </Select>
          <Input
            label="Estimated value"
            type="number"
            min="0"
            value={form.estimatedValue}
            onChange={(e) => setForm((f) => ({ ...f, estimatedValue: e.target.value }))}
          />
          <Button type="submit" className="w-full">
            Create lead
          </Button>
        </form>
      </Modal>
    </div>
  );
}
