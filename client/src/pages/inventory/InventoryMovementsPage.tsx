import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { inventoryApi } from '../../lib/inventoryApi';
import type { InventoryItem, Warehouse } from '../../types/inventory';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING } from '../../components/ui/formLayout';

export function InventoryMovementsPage() {
  const { accessToken, hasPermission } = useAuth();
  const [movements, setMovements] = useState<Record<string, unknown>[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'RECEIPT',
    itemId: '',
    warehouseId: '',
    quantity: '',
    reference: '',
    notes: '',
  });

  const load = () => {
    if (!accessToken) return;
    inventoryApi.movements(accessToken).then(setMovements);
    inventoryApi.items(accessToken).then(setItems);
    inventoryApi.warehouses(accessToken).then(setWarehouses);
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await inventoryApi.recordMovement(accessToken, {
      type: form.type,
      itemId: form.itemId,
      warehouseId: form.warehouseId,
      quantity: parseFloat(form.quantity),
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      {hasPermission('inventory', 'edit') ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Record Movement
        </Button>
      ) : null}
      <Card>
        <div className="space-y-2">
          {movements.map((m) => (
            <div key={String(m.id)} className="flex flex-wrap justify-between gap-2 border-b border-slate-50 py-2 text-sm">
              <div>
                <span className="font-mono text-xs text-brand-800">{String(m.movementNumber)}</span>
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold">{String(m.type)}</span>
                <p className="text-slate-700">
                  {(m.item as { sku: string; name: string })?.sku} — {(m.item as { name: string })?.name}
                </p>
              </div>
              <div className="text-right text-slate-500">
                <p>Qty: {String(m.quantity)}</p>
                <p className="text-xs">{new Date(String(m.createdAt)).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {!movements.length ? <p className="py-6 text-center text-slate-500">No movements yet</p> : null}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Stock Movement">
        <form onSubmit={submit} className={FORM_SPACING}>
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="RECEIPT">Receipt (stock in)</option>
            <option value="ISSUE">Issue (stock out)</option>
            <option value="ADJUSTMENT">Adjustment (+/- qty)</option>
          </Select>
          <Select
            label="Item"
            required
            value={form.itemId}
            onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))}
          >
            <option value="">Item</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.sku} — {i.name}
              </option>
            ))}
          </Select>
          <Select
            label="Warehouse"
            required
            value={form.warehouseId}
            onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
          >
            <option value="">Warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
          <Input
            label="Quantity"
            type="number"
            required
            placeholder={form.type === 'ADJUSTMENT' ? 'Delta (+/-)' : 'Quantity'}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </Modal>
    </div>
  );
}
