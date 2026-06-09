import { useEffect, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { procurementApi, formatMoney, WORKFLOW_LABELS } from '../../lib/procurementApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING } from '../../components/ui/formLayout';
import { LineItemsEditor, parseLines, type LineDraft } from '../../components/sales/LineItemsEditor';

export function ProcurementRequisitionsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'PURCHASE',
    description: '',
    projectReference: '',
    lines: [{ description: '', quantity: '1', unitPrice: '' }] as LineDraft[],
  });

  const load = () => {
    if (!accessToken) return;
    procurementApi.requisitions(accessToken).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await procurementApi.createRequisition(accessToken, {
      ...form,
      lines: parseLines(form.lines),
    });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      {hasPermission('procurement', 'create') ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Requisition
        </Button>
      ) : null}
      <div className="space-y-3">
        {list.map((r) => (
          <Card key={String(r.id)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div>
                <span className="font-mono text-sm text-brand-800">{String(r.requisitionNumber)}</span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                  {WORKFLOW_LABELS[String(r.status)] ?? String(r.status)}
                </span>
                <p className="mt-1 font-medium">{String(r.title)}</p>
                <p className="text-sm text-slate-500">
                  {String(r.type)} · {formatMoney(Number(r.totalAmount))}
                </p>
              </div>
              {!['COMPLETED', 'REJECTED'].includes(String(r.status)) && hasPermission('procurement', 'approve') ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => procurementApi.approveRequisition(accessToken!, String(r.id)).then(load)}>
                    <Check className="h-3 w-3" /> Approve step
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => procurementApi.rejectRequisition(accessToken!, String(r.id)).then(load)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Purchase Requisition">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="PURCHASE">Purchase</option>
            <option value="OPERATIONAL_EXPENSE">Operational expense</option>
            <option value="PROJECT_MATERIALS">Project materials</option>
          </Select>
          <LineItemsEditor lines={form.lines} onChange={(lines) => setForm((f) => ({ ...f, lines }))} />
          <Button type="submit" className="w-full">Submit</Button>
        </form>
      </Modal>
    </div>
  );
}
