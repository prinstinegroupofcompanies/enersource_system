import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hrApi, KPI_STATUS_LABELS } from '../../lib/hrApi';
import type { EmployeeKpi } from '../../types/hr';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING, FORM_GRID } from '../../components/ui/formLayout';

export function HrKpisPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<EmployeeKpi[]>([]);
  const [employees, setEmployees] = useState<{ id: string; employeeNumber: string; firstName: string; lastName: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    title: '',
    periodLabel: '2026 Q1',
    targetValue: '100',
    actualValue: '0',
    unit: '%',
  });

  const load = () => {
    if (!accessToken) return;
    hrApi.kpis(accessToken).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !open) return;
    hrApi.employeeOptions(accessToken).then(setEmployees);
  }, [accessToken, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await hrApi.createKpi(accessToken, {
      employeeId: form.employeeId,
      title: form.title,
      periodLabel: form.periodLabel,
      targetValue: Number(form.targetValue),
      actualValue: Number(form.actualValue),
      unit: form.unit,
    });
    setOpen(false);
    load();
  };

  const approve = (id: string) => {
    if (!accessToken) return;
    hrApi.updateKpi(accessToken, id, { status: 'APPROVED' }).then(load);
  };

  return (
    <div className="space-y-4">
      {hasPermission('hr', 'create') ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Assign KPI
        </Button>
      ) : null}

      <div className="space-y-3">
        {list.map((k) => (
          <Card key={k.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                <p className="font-medium">{k.title}</p>
                <p className="text-sm text-slate-500">
                  {k.employee?.firstName} {k.employee?.lastName} · {k.periodLabel}
                </p>
                <p className="text-sm">
                  {k.actualValue} / {k.targetValue} {k.unit}
                  <span className="ml-2 font-semibold text-brand-700">{k.progressPercent ?? 0}%</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                  {KPI_STATUS_LABELS[k.status] ?? k.status}
                </span>
                {k.status !== 'APPROVED' && hasPermission('hr', 'approve') ? (
                  <Button size="sm" onClick={() => approve(k.id)}>Approve</Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Assign KPI">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Select label="Employee" required value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
            <option value="">Employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </Select>
          <Input label="KPI title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Period" required value={form.periodLabel} onChange={(e) => setForm((f) => ({ ...f, periodLabel: e.target.value }))} />
          <div className={FORM_GRID}>
            <Input label="Target" type="number" required value={form.targetValue} onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))} />
            <Input label="Actual" type="number" value={form.actualValue} onChange={(e) => setForm((f) => ({ ...f, actualValue: e.target.value }))} />
          </div>
          <Input label="Unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
          <Button type="submit" className="w-full">Save KPI</Button>
        </form>
      </Modal>
    </div>
  );
}
