import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salesApi } from '../../lib/salesApi';
import type { Customer } from '../../types/sales';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function SalesCustomersPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', phone: '' });

  const load = () => {
    if (!accessToken) return;
    salesApi.customers(accessToken).then(setList);
  };
  useEffect(() => {
    load();
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await salesApi.createCustomer(accessToken, form);
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      {hasPermission('sales', 'create') ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      ) : null}
      <Card>
        <div className="divide-y divide-slate-50">
          {list.map((c) => (
            <div key={c.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <div>
                <p className="font-semibold text-slate-800">{c.companyName}</p>
                <p className="text-sm text-slate-500">
                  {c.contactPerson ?? '—'} · {c.email ?? '—'}
                </p>
              </div>
              <p className="text-xs text-slate-400">
                {c._count?.quotations ?? 0} quotes · {c._count?.invoices ?? 0} invoices
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="New Customer">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input label="Company" required value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
          <Input label="Contact" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
