import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { salesApi, formatMoney } from '../../lib/salesApi';
import { Card } from '../../components/ui/Card';

export function SalesReceivablesPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<{
    summary: Record<string, number>;
    invoices: { invoiceNumber: string; customer: string; balance: number; daysPast: number; status: string }[];
    customerBalances: { companyName: string; outstanding: number }[];
  } | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    salesApi.receivables(accessToken).then((d) => setData(d as typeof data));
  }, [accessToken]);

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total AR', key: 'totalOutstanding' },
          { label: 'Current', key: 'current' },
          { label: '1–30 days', key: 'days30' },
          { label: '31–60', key: 'days60' },
          { label: '61–90', key: 'days90' },
          { label: '90+', key: 'over90' },
        ].map((b) => (
          <Card key={b.key}>
            <p className="text-xs text-slate-500">{b.label}</p>
            <p className="text-lg font-bold">{formatMoney(s?.[b.key] ?? 0)}</p>
          </Card>
        ))}
      </div>
      <Card title="Customer Balances">
        <ul className="space-y-2 text-sm">
          {data?.customerBalances.map((c) => (
            <li key={c.companyName} className="flex justify-between">
              <span>{c.companyName}</span>
              <span className="font-semibold">{formatMoney(c.outstanding)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Outstanding Invoices">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left pb-2">Invoice</th>
                <th className="text-left pb-2">Customer</th>
                <th className="text-right pb-2">Balance</th>
                <th className="text-right pb-2">Days</th>
              </tr>
            </thead>
            <tbody>
              {data?.invoices.map((i) => (
                <tr key={i.invoiceNumber} className="border-t border-slate-50">
                  <td className="py-2 font-mono">{i.invoiceNumber}</td>
                  <td className="py-2">{i.customer}</td>
                  <td className="py-2 text-right font-semibold">{formatMoney(i.balance)}</td>
                  <td className="py-2 text-right text-slate-500">{i.daysPast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
