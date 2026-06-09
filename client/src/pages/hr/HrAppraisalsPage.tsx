import { useEffect, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hrApi, APPRAISAL_STATUS_LABELS } from '../../lib/hrApi';
import type { Appraisal } from '../../types/hr';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function HrAppraisalsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Appraisal[]>([]);
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    reviewPeriod: '',
    overallRating: '3',
    strengths: '',
    improvements: '',
    goals: '',
  });

  const load = () => {
    if (!accessToken) return;
    hrApi.appraisals(accessToken).then(setList);
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
    await hrApi.createAppraisal(accessToken, {
      employeeId: form.employeeId,
      reviewPeriod: form.reviewPeriod,
      overallRating: Number(form.overallRating),
      strengths: form.strengths || undefined,
      improvements: form.improvements || undefined,
      goals: form.goals || undefined,
    });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      {hasPermission('hr', 'create') ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New appraisal
        </Button>
      ) : null}

      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                <p className="font-medium">
                  {a.employee?.firstName} {a.employee?.lastName}
                  <span className="ml-2 text-sm font-normal text-slate-500">{a.reviewPeriod}</span>
                </p>
                <p className="text-sm text-slate-600">Rating: {a.overallRating}/5</p>
                {a.strengths ? <p className="mt-1 text-sm text-slate-500">Strengths: {a.strengths}</p> : null}
                {a.goals ? <p className="text-sm text-slate-500">Goals: {a.goals}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                  {APPRAISAL_STATUS_LABELS[a.status] ?? a.status}
                </span>
                {a.status !== 'COMPLETED' && hasPermission('hr', 'approve') ? (
                  <Button size="sm" onClick={() => hrApi.completeAppraisal(accessToken!, a.id).then(load)}>
                    <Check className="h-3 w-3" /> Complete
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Performance appraisal">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Select label="Employee" required value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
            <option value="">Employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
            ))}
          </Select>
          <Input label="Review period" required placeholder="e.g. 2026 Q1" value={form.reviewPeriod} onChange={(e) => setForm((f) => ({ ...f, reviewPeriod: e.target.value }))} />
          <Input label="Overall rating (1–5)" type="number" min="1" max="5" value={form.overallRating} onChange={(e) => setForm((f) => ({ ...f, overallRating: e.target.value }))} />
          <Textarea label="Strengths" placeholder="Strengths" rows={2} value={form.strengths} onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))} />
          <Textarea label="Areas for improvement" placeholder="Areas for improvement" rows={2} value={form.improvements} onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))} />
          <Textarea label="Goals" placeholder="Goals" rows={2} value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} />
          <Button type="submit" className="w-full">Create appraisal</Button>
        </form>
      </Modal>
    </div>
  );
}
