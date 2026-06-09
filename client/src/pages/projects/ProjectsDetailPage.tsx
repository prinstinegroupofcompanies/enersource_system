import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { projectsApi, formatMoney, STATUS_LABELS, PROJECT_STATUSES } from '../../lib/projectsApi';
import { inventoryApi } from '../../lib/inventoryApi';
import type { ProjectDetail } from '../../types/projects';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING, FORM_GRID } from '../../components/ui/formLayout';

export function ProjectsDetailPage() {
  const { projectId } = useParams();
  const { accessToken, hasPermission } = useAuth();
  const [p, setP] = useState<ProjectDetail | null>(null);
  const [items, setItems] = useState<{ id: string; sku: string; name: string; unitCost: number }[]>([]);
  const [taskOpen, setTaskOpen] = useState(false);
  const [msOpen, setMsOpen] = useState(false);
  const [matOpen, setMatOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'MEDIUM' });
  const [msForm, setMsForm] = useState({ title: '', dueDate: '' });
  const [matForm, setMatForm] = useState({
    description: '',
    inventoryItemId: '',
    quantity: '1',
    unitCost: '',
  });

  const load = () => {
    if (!accessToken || !projectId) return;
    projectsApi.get(accessToken, projectId).then(setP);
  };

  useEffect(() => {
    load();
  }, [accessToken, projectId]);

  useEffect(() => {
    if (!accessToken || !matOpen) return;
    inventoryApi.items(accessToken).then((list) =>
      setItems(list.map((i) => ({ id: i.id, sku: i.sku, name: i.name, unitCost: i.unitCost })))
    );
  }, [accessToken, matOpen]);

  if (!p) return <p className="text-sm text-slate-500">Loading project…</p>;

  const canEdit = hasPermission('projects', 'edit');

  return (
    <div className="space-y-6">
      <Link to="/projects/list" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-sm text-brand-800">{p.projectNumber}</p>
          <h2 className="text-2xl font-bold text-slate-900">{p.title}</h2>
          <p className="mt-1 text-slate-600">
            {STATUS_LABELS[p.status] ?? p.status}
            {p.isDelayed ? ' · Delayed' : ''}
            {p.location ? ` · ${p.location}` : ''}
          </p>
        </div>
        {canEdit ? (
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
            value={p.status}
            onChange={(e) =>
              accessToken &&
              projectsApi.update(accessToken, p.id, { status: e.target.value }).then(load)
            }
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Budget</p>
          <p className="text-lg font-bold">
            {formatMoney(p.actualCost)} / {formatMoney(p.budget)}
          </p>
          <p className="text-xs text-slate-500">{formatMoney(p.budgetRemaining)} remaining</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Progress</p>
          <p className="text-lg font-bold">{p.progressPercent}%</p>
          <p className="text-xs text-slate-500">Tasks: {p.taskProgress}% complete</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Schedule</p>
          <p className="text-lg font-bold">
            {p.targetEndDate ? new Date(p.targetEndDate).toLocaleDateString() : '—'}
          </p>
        </Card>
      </div>

      {p.description ? (
        <Card title="Description">
          <p className="text-sm text-slate-700">{p.description}</p>
        </Card>
      ) : null}

      <Card
        title="Tasks"
        action={
          canEdit ? (
            <Button size="sm" onClick={() => setTaskOpen(true)}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          ) : undefined
        }
      >
        <ul className="space-y-2">
          {p.tasks?.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span>{t.title}</span>
              {canEdit ? (
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  value={t.status}
                  onChange={(e) =>
                    accessToken &&
                    projectsApi.updateTask(accessToken, t.id, { status: e.target.value }).then(load)
                  }
                >
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="DONE">Done</option>
                </select>
              ) : (
                <span className="text-xs text-slate-500">{t.status}</span>
              )}
            </li>
          ))}
          {!p.tasks?.length ? <p className="text-sm text-slate-500">No tasks yet.</p> : null}
        </ul>
      </Card>

      <Card
        title="Milestones"
        action={
          canEdit ? (
            <Button size="sm" onClick={() => setMsOpen(true)}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          ) : undefined
        }
      >
        <ul className="space-y-2">
          {p.milestones?.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {m.title}
                {m.dueDate ? ` · ${new Date(m.dueDate).toLocaleDateString()}` : ''}
              </span>
              {m.status === 'COMPLETED' ? (
                <span className="text-xs font-semibold text-green-700">Done</span>
              ) : canEdit ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    accessToken && projectsApi.completeMilestone(accessToken, m.id).then(load)
                  }
                >
                  Complete
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Materials & cost"
        action={
          canEdit ? (
            <Button size="sm" onClick={() => setMatOpen(true)}>
              <Plus className="h-3 w-3" /> Record usage
            </Button>
          ) : undefined
        }
      >
        <ul className="space-y-2 text-sm">
          {p.materialUsage?.map((m) => (
            <li key={m.id} className="flex justify-between border-b border-slate-100 pb-2">
              <span>
                {m.description}
                {m.inventoryItem ? ` (${m.inventoryItem.sku})` : ''}
              </span>
              <span className="font-semibold">{formatMoney(m.amount)}</span>
            </li>
          ))}
          {!p.materialUsage?.length ? <p className="text-slate-500">No material usage recorded.</p> : null}
        </ul>
      </Card>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Add task">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!accessToken || !projectId) return;
            await projectsApi.addTask(accessToken, projectId, taskForm);
            setTaskOpen(false);
            setTaskForm({ title: '', priority: 'MEDIUM' });
            load();
          }}
          className={FORM_SPACING}
        >
          <Input label="Title" required value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} />
          <Button type="submit" className="w-full">
            Add task
          </Button>
        </form>
      </Modal>

      <Modal open={msOpen} onClose={() => setMsOpen(false)} title="Add milestone">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!accessToken || !projectId) return;
            await projectsApi.addMilestone(accessToken, projectId, {
              title: msForm.title,
              dueDate: msForm.dueDate || undefined,
            });
            setMsOpen(false);
            setMsForm({ title: '', dueDate: '' });
            load();
          }}
          className={FORM_SPACING}
        >
          <Input label="Title" required value={msForm.title} onChange={(e) => setMsForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="Due date" type="date" value={msForm.dueDate} onChange={(e) => setMsForm((f) => ({ ...f, dueDate: e.target.value }))} />
          <Button type="submit" className="w-full">
            Add milestone
          </Button>
        </form>
      </Modal>

      <Modal open={matOpen} onClose={() => setMatOpen(false)} title="Record material usage">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!accessToken || !projectId) return;
            await projectsApi.recordMaterial(accessToken, projectId, {
              description: matForm.description,
              inventoryItemId: matForm.inventoryItemId || undefined,
              quantity: Number(matForm.quantity),
              unitCost: Number(matForm.unitCost),
            });
            setMatOpen(false);
            setMatForm({ description: '', inventoryItemId: '', quantity: '1', unitCost: '' });
            load();
          }}
          className={FORM_SPACING}
        >
          <Input
            label="Description"
            required
            value={matForm.description}
            onChange={(e) => setMatForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Select
            label="Inventory item"
            value={matForm.inventoryItemId}
            onChange={(e) => {
              const item = items.find((i) => i.id === e.target.value);
              setMatForm((f) => ({
                ...f,
                inventoryItemId: e.target.value,
                unitCost: item ? String(item.unitCost) : f.unitCost,
                description: item && !f.description ? item.name : f.description,
              }));
            }}
          >
            <option value="">Manual (no stock deduction)</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.sku} — {i.name}
              </option>
            ))}
          </Select>
          <div className={FORM_GRID}>
            <Input
              label="Quantity"
              type="number"
              min="0.01"
              step="any"
              required
              value={matForm.quantity}
              onChange={(e) => setMatForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            <Input
              label="Unit cost"
              type="number"
              min="0"
              step="0.01"
              required
              value={matForm.unitCost}
              onChange={(e) => setMatForm((f) => ({ ...f, unitCost: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full">
            Record
          </Button>
        </form>
      </Modal>
    </div>
  );
}
