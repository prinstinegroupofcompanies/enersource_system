import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pettyCashApi } from '../../lib/procurementApi';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FileInput } from '../../components/ui/FileInput';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function PettyCashExpensesPage() {
  const { accessToken } = useAuth();
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fundId: '', amount: '', description: '', reference: '' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    pettyCashApi.funds(accessToken).then((f) => setFunds(f as typeof funds));
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const fd = new FormData();
    fd.append('fundId', form.fundId);
    fd.append('amount', form.amount);
    fd.append('description', form.description);
    if (form.reference) fd.append('reference', form.reference);
    if (file) fd.append('receipt', file);
    await pettyCashApi.recordExpense(accessToken, fd);
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Record Expense
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Petty Cash Expense">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Select label="Fund" required value={form.fundId} onChange={(e) => setForm((f) => ({ ...f, fundId: e.target.value }))}>
            <option value="">Fund</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
          <Input label="Amount" type="number" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          <Input label="Description" required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Reference" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
          <FileInput label="Receipt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
