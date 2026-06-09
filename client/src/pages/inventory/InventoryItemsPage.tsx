import { useEffect, useState } from 'react';
import { Download, Plus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { inventoryApi, formatMoney } from '../../lib/inventoryApi';
import type { InventoryItem } from '../../types/inventory';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING, FORM_GRID } from '../../components/ui/formLayout';

const CATEGORIES = [
  'Solar Panels',
  'Batteries',
  'Inverters',
  'Mounting Structures',
  'Electrical Components',
  'Spare Parts',
];

export function InventoryItemsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [category, setCategory] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Solar Panels',
    unit: 'pcs',
    unitCost: '',
    reorderLevel: '',
  });

  const load = () => {
    if (!accessToken) return;
    inventoryApi
      .items(accessToken, { category: category || undefined, lowStock: lowOnly })
      .then(setItems);
  };

  useEffect(() => {
    load();
  }, [accessToken, category, lowOnly]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await inventoryApi.createItem(accessToken, {
      ...form,
      unitCost: parseFloat(form.unitCost) || 0,
      reorderLevel: parseFloat(form.reorderLevel) || 0,
    });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
        {hasPermission('inventory', 'create') ? (
          <>
            <Button variant="secondary" onClick={() => accessToken && inventoryApi.seedDefaults(accessToken).then(load)}>
              <Download className="h-4 w-4" /> Seed catalog
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </>
        ) : null}
      </div>

      <Card>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 text-left font-semibold">SKU</th>
                <th className="pb-3 text-left font-semibold">Item</th>
                <th className="pb-3 text-left font-semibold">Category</th>
                <th className="pb-3 text-right font-semibold">On Hand</th>
                <th className="pb-3 text-right font-semibold">Reorder</th>
                <th className="pb-3 text-right font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 font-mono text-brand-800">
                    {i.isLowStock ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        {i.sku}
                      </span>
                    ) : (
                      i.sku
                    )}
                  </td>
                  <td className="py-2.5 font-medium">{i.name}</td>
                  <td className="py-2.5 text-slate-600">{i.category}</td>
                  <td className="py-2.5 text-right font-semibold">
                    {i.quantityOnHand} {i.unit}
                  </td>
                  <td className="py-2.5 text-right text-slate-500">{i.reorderLevel}</td>
                  <td className="py-2.5 text-right">{formatMoney(i.valuation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New Inventory Item">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Input label="SKU" required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
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
          <div className={FORM_GRID}>
            <Input label="Unit cost" type="number" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))} />
            <Input label="Reorder level" type="number" value={form.reorderLevel} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </Modal>
    </div>
  );
}
