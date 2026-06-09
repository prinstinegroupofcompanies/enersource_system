import { useEffect, useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  supportApi,
  TICKET_TYPES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPE_LABELS,
  PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '../../lib/supportApi';
import type { SupportTicket, SupportTicketDetail } from '../../types/phase10';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function SupportTicketsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<SupportTicket[]>([]);
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [customers, setCustomers] = useState<{ id: string; companyName: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'INTERNAL',
    priority: 'MEDIUM',
    customerId: '',
  });

  const load = () => {
    if (!accessToken) return;
    supportApi.list(accessToken).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !open) return;
    supportApi.customers(accessToken).then(setCustomers);
  }, [accessToken, open]);

  const openTicket = async (id: string) => {
    if (!accessToken) return;
    setDetail(await supportApi.get(accessToken, id));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await supportApi.create(accessToken, {
      ...form,
      customerId: form.type === 'CUSTOMER' && form.customerId ? form.customerId : undefined,
    });
    setOpen(false);
    load();
  };

  const updateStatus = (status: string) => {
    if (!accessToken || !detail) return;
    supportApi.update(accessToken, detail.id, { status }).then((t) => {
      setDetail(t);
      load();
    });
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !detail || !comment.trim()) return;
    await supportApi.addComment(accessToken, detail.id, comment.trim());
    setComment('');
    openTicket(detail.id);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        {hasPermission('support', 'create') ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        ) : null}
        <div className="space-y-3">
          {list.map((t) => (
            <Card key={t.id}>
              <button type="button" onClick={() => openTicket(t.id)} className="w-full text-left">
                <span className="font-mono text-sm text-brand-800">{t.ticketNumber}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${t.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-slate-100'}`}>
                  {PRIORITY_LABELS[t.priority]}
                </span>
                <p className="mt-1 font-medium">{t.title}</p>
                <p className="text-xs text-slate-500">
                  {TICKET_TYPE_LABELS[t.type]} · {TICKET_STATUS_LABELS[t.status]}
                  {t.customer?.companyName ? ` · ${t.customer.companyName}` : ''}
                </p>
              </button>
            </Card>
          ))}
        </div>
      </div>

      {detail ? (
        <Card title={detail.title}>
          <p className="text-sm text-slate-600">{detail.description ?? 'No description'}</p>
          {hasPermission('support', 'edit') ? (
            <select
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={detail.status}
              onChange={(e) => updateStatus(e.target.value)}
            >
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>{TICKET_STATUS_LABELS[s]}</option>
              ))}
            </select>
          ) : null}
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            {detail.comments?.map((c) => (
              <li key={c.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p>{c.body}</p>
                <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
          {hasPermission('support', 'create') ? (
            <form onSubmit={postComment} className="mt-4 flex gap-2">
              <Input placeholder="Add comment…" value={comment} onChange={(e) => setComment(e.target.value)} className="flex-1" />
              <Button type="submit"><MessageSquare className="h-4 w-4" /></Button>
            </form>
          ) : null}
        </Card>
      ) : (
        <Card title="Ticket detail">
          <p className="text-sm text-slate-500">Select a ticket to view details and comments.</p>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New support ticket">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {TICKET_TYPES.map((t) => (
              <option key={t} value={t}>{TICKET_TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <Select label="Priority" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </Select>
          {form.type === 'CUSTOMER' ? (
            <Select label="Customer" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </Select>
          ) : null}
          <Button type="submit" className="w-full">Create ticket</Button>
        </form>
      </Modal>
    </div>
  );
}
