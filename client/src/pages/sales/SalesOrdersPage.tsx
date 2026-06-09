import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salesApi, formatMoney } from '../../lib/salesApi';
import type { SalesOrder } from '../../types/sales';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function SalesOrdersPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<SalesOrder[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    salesApi.orders(accessToken).then(setList);
  }, [accessToken]);

  const invoice = (orderId: string) => {
    if (!accessToken) return;
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    salesApi.invoiceFromOrder(accessToken, orderId, due).then(() => alert('Invoice created'));
  };

  return (
    <div className="space-y-3">
      {list.map((o) => (
        <Card key={o.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <div>
              <span className="font-mono text-sm text-brand-800">{o.orderNumber}</span>
              <span className="ml-2 text-xs font-semibold uppercase text-slate-500">{o.status}</span>
              <p className="font-medium">{o.title}</p>
              <p className="text-sm text-slate-500">{o.customer.companyName} · {formatMoney(o.total)}</p>
            </div>
            {hasPermission('sales', 'create') && o.status === 'CONFIRMED' ? (
              <Button size="sm" variant="secondary" onClick={() => invoice(o.id)}>
                <FileText className="h-3 w-3" /> Create Invoice
              </Button>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
