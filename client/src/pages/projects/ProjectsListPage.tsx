import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  projectsApi,
  formatMoney,
  STATUS_LABELS,
  TYPE_LABELS,
  PROJECT_TYPES,
  PROJECT_STATUSES,
} from '../../lib/projectsApi';
import type { ProjectListItem } from '../../types/projects';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { FORM_SPACING, FORM_GRID } from '../../components/ui/formLayout';

export function ProjectsListPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<ProjectListItem[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; companyName: string }[]>([]);
  const [form, setForm] = useState({
    title: '',
    type: 'INSTALLATION',
    description: '',
    location: '',
    customerId: '',
    budget: '',
    targetEndDate: '',
  });

  const load = () => {
    if (!accessToken) return;
    projectsApi
      .list(accessToken, { status: filterStatus || undefined, search: search || undefined })
      .then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken, filterStatus, search]);

  useEffect(() => {
    if (!accessToken || !open) return;
    projectsApi.customers(accessToken).then(setCustomers);
  }, [accessToken, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await projectsApi.create(accessToken, {
      title: form.title,
      type: form.type,
      description: form.description || undefined,
      location: form.location || undefined,
      customerId: form.customerId || undefined,
      budget: Number(form.budget),
      targetEndDate: form.targetEndDate || undefined,
    });
    setOpen(false);
    setForm({
      title: '',
      type: 'INSTALLATION',
      description: '',
      location: '',
      customerId: '',
      budget: '',
      targetEndDate: '',
    });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <Input
            placeholder="Search title or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {hasPermission('projects', 'create') ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {list.map((p) => (
          <Card key={p.id}>
            <Link to={`/projects/${p.id}`} className="block hover:opacity-90">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div>
                  <span className="font-mono text-sm text-brand-800">{p.projectNumber}</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.isDelayed || p.status === 'DELAYED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                  <p className="mt-1 font-medium text-slate-900">{p.title}</p>
                  <p className="text-sm text-slate-500">
                    {TYPE_LABELS[p.type] ?? p.type}
                    {p.customer?.companyName ? ` · ${p.customer.companyName}` : ''}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">
                    {formatMoney(p.actualCost)} / {formatMoney(p.budget)}
                  </p>
                  <p className="text-slate-500">{p.budgetUsedPercent}% budget · {p.progressPercent}% progress</p>
                  {p._count ? (
                    <p className="text-slate-400">
                      {p._count.tasks} tasks · {p._count.milestones} milestones
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          </Card>
        ))}
        {!list.length ? (
          <p className="text-center text-sm text-slate-500">No projects match your filters.</p>
        ) : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New project">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <div className={FORM_GRID}>
            <Input
              label="Budget"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            />
            <Input
              label="Target end date"
              type="date"
              value={form.targetEndDate}
              onChange={(e) => setForm((f) => ({ ...f, targetEndDate: e.target.value }))}
            />
          </div>
          <Select
            label="Customer"
            value={form.customerId}
            onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
          >
            <option value="">No customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </Select>
          <Textarea
            label="Description"
            placeholder="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Button type="submit" className="w-full">
            Create project
          </Button>
        </form>
      </Modal>
    </div>
  );
}
