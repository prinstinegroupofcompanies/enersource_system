import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { pettyCashApi, formatMoney } from '../../lib/procurementApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function PettyCashOverviewPage() {
  const { accessToken, hasPermission } = useAuth();
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    pettyCashApi.report(accessToken).then(setReport);
  }, [accessToken]);

  const funds = (report?.funds as { id: string; name: string; balance: number; allocatedAmount: number }[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total balance</p>
          <p className="text-xl font-bold">{formatMoney(Number(report?.totalBalance ?? 0))}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Expenses (period)</p>
          <p className="text-xl font-bold">{formatMoney(Number(report?.periodExpenses ?? 0))}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pending reimbursements</p>
          <p className="text-xl font-bold">{Number(report?.pendingReimbursements ?? 0)}</p>
        </Card>
      </div>
      <Card title="Petty cash funds">
        <ul className="space-y-2">
          {funds.map((f) => (
            <li key={f.id} className="flex justify-between text-sm">
              <span>{f.name}</span>
              <span className="font-semibold">{formatMoney(f.balance)}</span>
            </li>
          ))}
        </ul>
        {hasPermission('petty-cash', 'edit') && funds[0] ? (
          <Button
            className="mt-4"
            variant="secondary"
            size="sm"
            onClick={() => accessToken && pettyCashApi.allocate(accessToken, funds[0].id, 500).then(() => pettyCashApi.report(accessToken).then(setReport))}
          >
            Add KES 500 float
          </Button>
        ) : null}
      </Card>
      <Link to="/petty-cash/expenses" className="text-sm font-semibold text-brand-700">
        Record expense →
      </Link>
    </div>
  );
}
