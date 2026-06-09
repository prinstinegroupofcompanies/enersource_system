import { useEffect, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeApi, formatMoney } from '../../lib/financeApi';
import type { ChartOfAccount } from '../../types/finance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING } from '../../components/ui/formLayout';

const CATEGORIES = ['Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses', 'Other'];

export function FinanceAccountsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', category: 'Assets', subCategory: '' });

  const load = () => {
    if (!accessToken) return;
    financeApi.accounts(accessToken, { category: category || undefined, search: filter || undefined }).then(setAccounts);
  };

  useEffect(load, [accessToken, filter, category]);

  const importDefaults = async () => {
    if (!accessToken) return;
    await financeApi.importDefaults(accessToken);
    load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await financeApi.createAccount(accessToken, form);
    setModalOpen(false);
    setForm({ code: '', name: '', category: 'Assets', subCategory: '' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search code or name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {hasPermission('finance', 'create') ? (
            <>
              <Button variant="secondary" onClick={importDefaults}>
                <Download className="h-4 w-4" /> Import COA
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" /> New Account
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">Code</th>
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold text-right">Balance</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 font-mono text-brand-800">{a.code}</td>
                  <td className="py-2.5 font-medium">{a.name}</td>
                  <td className="py-2.5 text-slate-600">{a.category}</td>
                  <td className="py-2.5 text-xs text-slate-500">{a.subCategory ?? '—'}</td>
                  <td className="py-2.5 text-right font-semibold">{formatMoney(a.balance)}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        a.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Account">
        <form onSubmit={create} className={FORM_SPACING}>
          <Input label="Code" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Input label="Sub-category" value={form.subCategory} onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))} />
          <Button type="submit" className="w-full">
            Create Account
          </Button>
        </form>
      </Modal>
    </div>
  );
}
