import { useEffect, useState } from 'react';
import { Plus, Check, Send, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeApi, formatMoney } from '../../lib/financeApi';
import type { ChartOfAccount, JournalEntry } from '../../types/finance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { FORM_SPACING, FORM_GRID } from '../../components/ui/formLayout';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  POSTED: 'bg-emerald-100 text-emerald-800',
  REVERSED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-200 text-slate-500',
};

interface LineDraft {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
}

export function FinanceJournalsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    entryDate: new Date().toISOString().slice(0, 10),
    reference: '',
    description: '',
    lines: [
      { accountId: '', description: '', debit: '', credit: '' },
      { accountId: '', description: '', debit: '', credit: '' },
    ] as LineDraft[],
  });
  const [error, setError] = useState('');

  const load = () => {
    if (!accessToken) return;
    financeApi.journals(accessToken, statusFilter || undefined).then(setJournals);
    financeApi.accounts(accessToken).then(setAccounts);
  };

  useEffect(load, [accessToken, statusFilter]);

  const lineTotals = () => {
    const debit = form.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const credit = form.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    return { debit, credit, balanced: Math.round(debit * 100) === Math.round(credit * 100) && debit > 0 };
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError('');
    const { balanced } = lineTotals();
    if (!balanced) {
      setError('Debits must equal credits');
      return;
    }
    try {
      await financeApi.createJournal(accessToken, {
        entryDate: form.entryDate,
        reference: form.reference || undefined,
        description: form.description,
        lines: form.lines.map((l) => ({
          accountId: l.accountId,
          description: l.description || undefined,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create journal');
    }
  };

  const action = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const totals = lineTotals();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {['DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REVERSED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        {hasPermission('finance', 'create') ? (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> New Journal Entry
          </Button>
        ) : null}
      </div>

      <Card>
        <div className="space-y-3">
          {journals.map((j) => (
            <div
              key={j.id}
              className="rounded-xl border border-slate-100 p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-brand-800">{j.entryNumber}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[j.status] ?? ''}`}>
                      {j.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-slate-800">{j.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(j.entryDate).toLocaleDateString()}
                    {j.reference ? ` · ${j.reference}` : ''}
                  </p>
                  <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
                    {j.lines.map((l) => (
                      <li key={l.id}>
                        {l.account?.code} {l.account?.name}:{' '}
                        {l.debit > 0 ? `Dr ${formatMoney(l.debit)}` : `Cr ${formatMoney(l.credit)}`}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  {j.status === 'DRAFT' && hasPermission('finance', 'edit') ? (
                    <Button size="sm" variant="secondary" onClick={() => action(() => financeApi.submitJournal(accessToken!, j.id))}>
                      <Send className="h-3 w-3" /> Submit
                    </Button>
                  ) : null}
                  {j.status === 'PENDING_APPROVAL' && hasPermission('finance', 'approve') ? (
                    <>
                      <Button size="sm" onClick={() => action(() => financeApi.approveJournal(accessToken!, j.id))}>
                        <Check className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" onClick={() => action(() => financeApi.postJournal(accessToken!, j.id))}>
                        Post
                      </Button>
                    </>
                  ) : null}
                  {j.status === 'POSTED' && hasPermission('finance', 'approve') ? (
                    <Button size="sm" variant="secondary" onClick={() => action(() => financeApi.reverseJournal(accessToken!, j.id))}>
                      <RotateCcw className="h-3 w-3" /> Reverse
                    </Button>
                  ) : null}
                  {['DRAFT', 'PENDING_APPROVAL'].includes(j.status) && hasPermission('finance', 'edit') ? (
                    <Button size="sm" variant="ghost" onClick={() => action(() => financeApi.cancelJournal(accessToken!, j.id))}>
                      <X className="h-3 w-3" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {journals.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No journal entries found</p>
          ) : null}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Journal Entry">
        <form onSubmit={create} className={FORM_SPACING}>
          <div className={FORM_GRID}>
            <Input label="Date" type="date" required value={form.entryDate} onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))} />
            <Input label="Reference" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
          </div>
          <Input label="Description" required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Lines</p>
            {form.lines.map((line, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-100 p-3 sm:grid-cols-4">
                <select
                  required
                  value={line.accountId}
                  onChange={(e) => {
                    const lines = [...form.lines];
                    lines[i] = { ...lines[i], accountId: e.target.value };
                    setForm((f) => ({ ...f, lines }));
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-2 text-sm sm:col-span-2"
                >
                  <option value="">Account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
                <Input placeholder="Debit" type="number" min="0" step="0.01" value={line.debit} onChange={(e) => {
                  const lines = [...form.lines];
                  lines[i] = { ...lines[i], debit: e.target.value, credit: e.target.value ? '' : lines[i].credit };
                  setForm((f) => ({ ...f, lines }));
                }} />
                <Input placeholder="Credit" type="number" min="0" step="0.01" value={line.credit} onChange={(e) => {
                  const lines = [...form.lines];
                  lines[i] = { ...lines[i], credit: e.target.value, debit: e.target.value ? '' : lines[i].debit };
                  setForm((f) => ({ ...f, lines }));
                }} />
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  lines: [...f.lines, { accountId: '', description: '', debit: '', credit: '' }],
                }))
              }
            >
              + Add line
            </Button>
            <p className={`text-sm ${totals.balanced ? 'text-emerald-700' : 'text-red-600'}`}>
              Debits: {formatMoney(totals.debit)} · Credits: {formatMoney(totals.credit)}
              {totals.balanced ? ' ✓ Balanced' : ' — Not balanced'}
            </p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={!totals.balanced}>
            Save as Draft
          </Button>
        </form>
      </Modal>
    </div>
  );
}
