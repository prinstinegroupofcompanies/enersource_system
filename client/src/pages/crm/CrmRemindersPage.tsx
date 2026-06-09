import { useEffect, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { crmApi } from '../../lib/crmApi';
import type { CrmReminder, Lead } from '../../types/crm';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function CrmRemindersPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<CrmReminder[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showOverdue, setShowOverdue] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', dueAt: '', leadId: '' });

  const load = () => {
    if (!accessToken) return;
    crmApi.reminders(accessToken, { status: 'PENDING', overdue: showOverdue || undefined }).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken, showOverdue]);

  useEffect(() => {
    if (!accessToken || !open) return;
    crmApi.leads(accessToken).then(setLeads);
  }, [accessToken, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await crmApi.createReminder(accessToken, {
      title: form.title,
      dueAt: form.dueAt,
      leadId: form.leadId || undefined,
    });
    setOpen(false);
    load();
  };

  const isOverdue = (dueAt: string) => new Date(dueAt) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showOverdue} onChange={(e) => setShowOverdue(e.target.checked)} />
          Overdue only
        </label>
        {hasPermission('crm', 'create') ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add reminder
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {list.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`font-medium ${isOverdue(r.dueAt) ? 'text-red-800' : 'text-slate-900'}`}>{r.title}</p>
                <p className="text-sm text-slate-500">
                  Due {new Date(r.dueAt).toLocaleString()}
                  {r.lead ? ` · ${r.lead.companyName}` : ''}
                  {r.customer ? ` · ${r.customer.companyName}` : ''}
                </p>
              </div>
              {hasPermission('crm', 'edit') ? (
                <Button size="sm" onClick={() => crmApi.completeReminder(accessToken!, r.id).then(load)}>
                  <Check className="h-3 w-3" /> Done
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
        {!list.length ? <p className="text-center text-sm text-slate-500">No pending reminders.</p> : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New reminder">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input
            label="Due date & time"
            type="datetime-local"
            required
            value={form.dueAt}
            onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
          />
          <Select
            label="Lead"
            value={form.leadId}
            onChange={(e) => setForm((f) => ({ ...f, leadId: e.target.value }))}
          >
            <option value="">Link to lead (optional)</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.leadNumber} — {l.companyName}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full">
            Save reminder
          </Button>
        </form>
      </Modal>
    </div>
  );
}
