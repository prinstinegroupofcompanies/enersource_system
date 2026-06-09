import { useEffect, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { inventoryApi } from '../../lib/inventoryApi';
import type { InventoryItem, Warehouse } from '../../types/inventory';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FORM_SPACING, FORM_GRID } from '../../components/ui/formLayout';

export function InventoryTransfersPage() {
  const { accessToken, hasPermission } = useAuth();
  const [transfers, setTransfers] = useState<Record<string, unknown>[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    itemId: '',
    quantity: '',
  });

  const load = () => {
    if (!accessToken) return;
    inventoryApi.transfers(accessToken).then(setTransfers);
    inventoryApi.items(accessToken).then(setItems);
    inventoryApi.warehouses(accessToken).then(setWarehouses);
  };

  useEffect(() => {
    load();
  }, [accessToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    await inventoryApi.createTransfer(accessToken, {
      fromWarehouseId: form.fromWarehouseId,
      toWarehouseId: form.toWarehouseId,
      lines: [{ itemId: form.itemId, quantity: parseFloat(form.quantity) }],
    });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      {hasPermission('inventory', 'create') ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New Transfer
        </Button>
      ) : null}
      <div className="space-y-3">
        {transfers.map((t) => (
          <Card key={String(t.id)}>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                <span className="font-mono text-sm text-brand-800">{String(t.transferNumber)}</span>
                <span className="ml-2 text-xs font-semibold uppercase text-slate-500">{String(t.status)}</span>
                <p className="text-sm text-slate-600">
                  {(t.fromWarehouse as { name: string })?.name} → {(t.toWarehouse as { name: string })?.name}
                </p>
              </div>
              {t.status === 'DRAFT' && hasPermission('inventory', 'edit') ? (
                <Button
                  size="sm"
                  onClick={() => inventoryApi.completeTransfer(accessToken!, String(t.id)).then(load)}
                >
                  <Check className="h-3 w-3" /> Complete
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Warehouse Transfer">
        <form onSubmit={submit} className={FORM_SPACING}>
          <div className={FORM_GRID}>
            <Select
              label="From warehouse"
              required
              value={form.fromWarehouseId}
              onChange={(e) => setForm((f) => ({ ...f, fromWarehouseId: e.target.value }))}
            >
              <option value="">From warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
            <Select
              label="To warehouse"
              required
              value={form.toWarehouseId}
              onChange={(e) => setForm((f) => ({ ...f, toWarehouseId: e.target.value }))}
            >
              <option value="">To warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label="Item"
            required
            value={form.itemId}
            onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))}
          >
            <option value="">Item</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.sku}
              </option>
            ))}
          </Select>
          <Input
            label="Quantity"
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <Button type="submit" className="w-full">
            Create Transfer
          </Button>
        </form>
      </Modal>
    </div>
  );
}
