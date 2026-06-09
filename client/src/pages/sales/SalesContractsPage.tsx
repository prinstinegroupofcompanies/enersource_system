import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { salesApi, formatMoney } from '../../lib/salesApi';
import { Card } from '../../components/ui/Card';

export function SalesContractsPage() {
  const { accessToken } = useAuth();
  const [list, setList] = useState<
    { id: string; contractNumber: string; title: string; status: string; value: number; customer: { companyName: string } }[]
  >([]);

  useEffect(() => {
    if (!accessToken) return;
    salesApi.contracts(accessToken).then((d) => setList(d as typeof list));
  }, [accessToken]);

  return (
    <div className="space-y-3">
      {list.map((c) => (
        <Card key={c.id}>
          <span className="font-mono text-sm text-brand-800">{c.contractNumber}</span>
          <span className="ml-2 text-xs font-semibold text-slate-500">{c.status}</span>
          <p className="mt-1 font-medium">{c.title}</p>
          <p className="text-sm text-slate-500">
            {c.customer.companyName} · {formatMoney(c.value)}
          </p>
        </Card>
      ))}
      {!list.length ? <Card><p className="text-center text-slate-500 py-4">No contracts yet</p></Card> : null}
    </div>
  );
}
