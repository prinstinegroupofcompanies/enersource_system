import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  hrApi,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_LABELS,
  EMPLOYEE_STATUS_LABELS,
} from '../../lib/hrApi';
import type { Employee } from '../../types/hr';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING, FORM_GRID } from '../../components/ui/formLayout';

export function HrEmployeesPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    employmentType: 'FULL_TIME',
    departmentId: '',
    hireDate: '',
  });

  const load = () => {
    if (!accessToken) return;
    hrApi.employees(accessToken, { search: search || undefined }).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken, search]);

  useEffect(() => {
    if (!accessToken || !open) return;
    hrApi.departments(accessToken).then(setDepartments);
  }, [accessToken, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await hrApi.createEmployee(accessToken, {
      ...form,
      departmentId: form.departmentId || undefined,
      hireDate: form.hireDate || undefined,
    });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        {hasPermission('hr', 'create') ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add employee
          </Button>
        ) : null}
      </div>

      <Card>
        <div className="divide-y divide-slate-50">
          {list.map((e) => (
            <div key={e.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <div>
                <span className="font-mono text-sm text-brand-800">{e.employeeNumber}</span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                  {EMPLOYEE_STATUS_LABELS[e.status] ?? e.status}
                </span>
                <p className="mt-1 font-semibold text-slate-800">
                  {e.firstName} {e.lastName}
                </p>
                <p className="text-sm text-slate-500">
                  {e.jobTitle ?? '—'} · {e.department?.name ?? '—'} · {EMPLOYMENT_LABELS[e.employmentType] ?? e.employmentType}
                </p>
              </div>
              <p className="text-xs text-slate-400">{e.email ?? e.phone ?? '—'}</p>
            </div>
          ))}
          {!list.length ? <p className="py-6 text-center text-sm text-slate-500">No employees found.</p> : null}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New employee">
        <form onSubmit={submit} className={FORM_SPACING}>
          <div className={FORM_GRID}>
            <Input label="First name" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last name" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Input label="Job title" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Select label="Employment type" value={form.employmentType} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{EMPLOYMENT_LABELS[t]}</option>
            ))}
          </Select>
          <Select label="Department" value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Input label="Hire date" type="date" value={form.hireDate} onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))} />
          <Button type="submit" className="w-full">Save employee</Button>
        </form>
      </Modal>
    </div>
  );
}
