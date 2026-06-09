import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hrApi, ATTENDANCE_LABELS, ATTENDANCE_STATUSES } from '../../lib/hrApi';
import type { AttendanceRecord } from '../../types/hr';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function HrAttendancePage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<AttendanceRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [employees, setEmployees] = useState<{ id: string; employeeNumber: string; firstName: string; lastName: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', status: 'PRESENT', notes: '' });

  const load = () => {
    if (!accessToken) return;
    hrApi.attendance(accessToken, { date }).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken, date]);

  useEffect(() => {
    if (!accessToken || !open) return;
    hrApi.employeeOptions(accessToken).then(setEmployees);
  }, [accessToken, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await hrApi.recordAttendance(accessToken, { ...form, date });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-xs" />
        {hasPermission('hr', 'create') ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Record attendance
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id}>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <div>
                <p className="font-medium">
                  {a.employee?.firstName} {a.employee?.lastName}
                  <span className="ml-2 font-mono text-xs text-brand-700">{a.employee?.employeeNumber}</span>
                </p>
                <p className="text-sm text-slate-500">
                  {a.checkIn ? `In: ${new Date(a.checkIn).toLocaleTimeString()}` : 'No check-in'}
                  {a.checkOut ? ` · Out: ${new Date(a.checkOut).toLocaleTimeString()}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                {ATTENDANCE_LABELS[a.status] ?? a.status}
              </span>
            </div>
          </Card>
        ))}
        {!list.length ? <p className="text-center text-sm text-slate-500">No attendance records for this date.</p> : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Record attendance">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Select label="Employee" required value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.employeeNumber} — {e.firstName} {e.lastName}</option>
            ))}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s} value={s}>{ATTENDANCE_LABELS[s]}</option>
            ))}
          </Select>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
