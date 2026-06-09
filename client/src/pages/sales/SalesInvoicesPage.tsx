import { useEffect, useState } from 'react';
import { Send, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salesApi, formatMoney } from '../../lib/salesApi';
import type { Invoice } from '../../types/sales';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-200 text-slate-500',
};

export function SalesInvoicesPage() {
  const { accessToken, hasPermission } = useAuth();
  const [list, setList] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState('');

  const load = () => {
    if (!accessToken) return;
    salesApi.invoices(accessToken, filter || undefined).then(setList);
  };
  useEffect(() => {
    load();
  }, [accessToken, filter]);

  return (
    <div className="space-y-4">
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
        <option value="">All statuses</option>
        {['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <div className="space-y-3">
        {list.map((inv) => {
          const balance = inv.total - inv.amountPaid;
          return (
            <Card key={inv.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div>
                  <span className="font-mono text-sm text-brand-800">{inv.invoiceNumber}</span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[inv.status] ?? ''}`}>
                    {inv.status}
                  </span>
                  <p className="mt-1 text-sm text-slate-600">{inv.customer.companyName}</p>
                  <p className="text-sm">
                    Total {formatMoney(inv.total)} · Paid {formatMoney(inv.amountPaid)} · Due{' '}
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {inv.status === 'DRAFT' && hasPermission('sales', 'edit') ? (
                    <Button size="sm" onClick={() => salesApi.sendInvoice(accessToken!, inv.id).then(load)}>
                      <Send className="h-3 w-3" /> Send
                    </Button>
                  ) : null}
                  {['SENT', 'OVERDUE'].includes(inv.status) && balance > 0 && hasPermission('sales', 'edit') ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => salesApi.payInvoice(accessToken!, inv.id, balance).then(load)}
                    >
                      <DollarSign className="h-3 w-3" /> Record Payment
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
