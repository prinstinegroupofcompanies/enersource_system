import { useEffect, useState } from 'react';
import { Plus, DollarSign, Paperclip } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { procurementApi, formatMoney } from '../../lib/procurementApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { FileInput } from '../../components/ui/FileInput';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function ProcurementPaymentsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = () => {
    if (!accessToken) return;
    procurementApi.payments(accessToken).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const fd = new FormData();
    fd.append('title', title);
    fd.append('amount', amount);
    if (file) fd.append('attachment', file);
    await procurementApi.createPayment(accessToken, fd);
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      {hasPermission('procurement', 'create') ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Payment Request
        </Button>
      ) : null}
      <div className="space-y-3">
        {list.map((p) => (
          <Card key={String(p.id)}>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                <span className="font-mono text-sm text-brand-800">{String(p.requestNumber)}</span>
                <span className="ml-2 text-xs font-semibold uppercase text-slate-500">{String(p.status)}</span>
                <p className="font-medium">{String(p.title)}</p>
                <p className="text-sm text-slate-500">{formatMoney(Number(p.amount))}</p>
                {p.attachmentName ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-brand-700">
                    <Paperclip className="h-3 w-3" /> {String(p.attachmentName)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {p.status === 'PENDING' && hasPermission('procurement', 'approve') ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => procurementApi.approvePayment(accessToken!, String(p.id), 'SUPERVISOR_REVIEW').then(load)}>
                      Supervisor OK
                    </Button>
                    <Button size="sm" onClick={() => procurementApi.approvePayment(accessToken!, String(p.id), 'FINANCE_APPROVAL').then(load)}>
                      Finance OK
                    </Button>
                  </>
                ) : null}
                {p.status === 'APPROVED' && hasPermission('procurement', 'approve') ? (
                  <Button size="sm" onClick={() => procurementApi.markPaid(accessToken!, String(p.id)).then(load)}>
                    <DollarSign className="h-3 w-3" /> Mark Paid
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Payment Request">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Amount" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          <FileInput label="Attachment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button type="submit" className="w-full">Submit</Button>
        </form>
      </Modal>
    </div>
  );
}
