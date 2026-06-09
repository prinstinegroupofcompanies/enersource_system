import { useEffect, useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salesApi, formatMoney } from '../../lib/salesApi';
import type { Customer, Quotation } from '../../types/sales';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING } from '../../components/ui/formLayout';
import { LineItemsEditor, parseLines, type LineDraft } from '../../components/sales/LineItemsEditor';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export function SalesQuotationsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    title: '',
    taxRate: '16',
    lines: [{ description: '', quantity: '1', unitPrice: '' }] as LineDraft[],
  });

  const load = () => {
    if (!accessToken) return;
    salesApi.quotations(accessToken).then(setList);
    salesApi.customers(accessToken).then(setCustomers);
  };
  useEffect(load, [accessToken]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await salesApi.createQuotation(accessToken, {
      customerId: form.customerId,
      title: form.title,
      taxRate: parseFloat(form.taxRate),
      lines: parseLines(form.lines),
    });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      {hasPermission('sales', 'create') ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Quotation
        </Button>
      ) : null}
      <div className="space-y-3">
        {list.map((q) => (
          <Card key={q.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div>
                <span className="font-mono text-sm text-brand-800">{q.quoteNumber}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[q.status] ?? ''}`}>
                  {q.status}
                </span>
                <p className="mt-1 font-medium">{q.title}</p>
                <p className="text-sm text-slate-500">{q.customer.companyName} · {formatMoney(q.total)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {q.status === 'DRAFT' && hasPermission('sales', 'edit') ? (
                  <Button size="sm" variant="secondary" onClick={() => salesApi.updateQuoteStatus(accessToken!, q.id, 'SENT').then(load)}>
                    Mark Sent
                  </Button>
                ) : null}
                {q.status === 'SENT' && (
                  <Button size="sm" onClick={() => salesApi.updateQuoteStatus(accessToken!, q.id, 'ACCEPTED').then(load)}>
                    Accept
                  </Button>
                )}
                {q.status === 'ACCEPTED' && hasPermission('sales', 'create') ? (
                  <Button size="sm" onClick={() => salesApi.convertQuote(accessToken!, q.id).then(load)}>
                    <ArrowRight className="h-3 w-3" /> To Order
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New Quotation">
        <form onSubmit={create} className={FORM_SPACING}>
          <Select label="Customer" required value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}>
            <option value="">Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </Select>
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Tax %" type="number" min="0" step="0.01" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} />
          <LineItemsEditor lines={form.lines} onChange={(lines) => setForm((f) => ({ ...f, lines }))} />
          <Button type="submit" className="w-full">Create</Button>
        </form>
      </Modal>
    </div>
  );
}
