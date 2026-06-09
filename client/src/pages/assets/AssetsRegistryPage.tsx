import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  assetsApi,
  formatMoney,
  CATEGORY_LABELS,
  ASSET_CATEGORIES,
  ASSET_STATUS_LABELS,
} from '../../lib/assetsApi';
import type { Asset } from '../../types/phase10';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING, FORM_GRID } from '../../components/ui/formLayout';

export function AssetsRegistryPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'EQUIPMENT',
    purchaseCost: '',
    salvageValue: '0',
    usefulLifeMonths: '60',
    location: '',
    purchaseDate: '',
  });

  const load = () => {
    if (!accessToken) return;
    assetsApi.list(accessToken).then(setList);
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await assetsApi.create(accessToken, {
      name: form.name,
      category: form.category,
      purchaseCost: Number(form.purchaseCost),
      salvageValue: Number(form.salvageValue),
      usefulLifeMonths: Number(form.usefulLifeMonths),
      location: form.location || undefined,
      purchaseDate: form.purchaseDate || undefined,
    });
    setOpen(false);
    load();
  };

  const runDepreciation = () => {
    if (!accessToken) return;
    assetsApi.runDepreciation(accessToken).then(load);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        {hasPermission('assets', 'approve') ? (
          <Button variant="ghost" onClick={runDepreciation}>Run depreciation</Button>
        ) : (
          <span />
        )}
        {hasPermission('assets', 'create') ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add asset
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                <span className="font-mono text-sm text-brand-800">{a.assetNumber}</span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                  {ASSET_STATUS_LABELS[a.status] ?? a.status}
                </span>
                <p className="mt-1 font-medium">{a.name}</p>
                <p className="text-sm text-slate-500">
                  {CATEGORY_LABELS[a.category] ?? a.category}
                  {a.location ? ` · ${a.location}` : ''}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>Cost: {formatMoney(a.purchaseCost)}</p>
                <p className="font-semibold text-brand-800">Book: {formatMoney(a.bookValue ?? 0)}</p>
                <p className="text-xs text-slate-500">Dep: {formatMoney(a.accumulatedDepreciation)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Register asset">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
          <div className={FORM_GRID}>
            <Input label="Purchase cost" type="number" min="0" required value={form.purchaseCost} onChange={(e) => setForm((f) => ({ ...f, purchaseCost: e.target.value }))} />
            <Input label="Salvage value" type="number" min="0" value={form.salvageValue} onChange={(e) => setForm((f) => ({ ...f, salvageValue: e.target.value }))} />
          </div>
          <Input label="Useful life (months)" type="number" min="1" value={form.usefulLifeMonths} onChange={(e) => setForm((f) => ({ ...f, usefulLifeMonths: e.target.value }))} />
          <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <Input label="Purchase date" type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
