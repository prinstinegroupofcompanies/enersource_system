import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pettyCashApi, formatMoney } from '../../lib/procurementApi';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';

export function PettyCashReportsPage() {
  const { accessToken } = useAuth();
  const [period, setPeriod] = useState<'daily' | 'monthly'>('monthly');
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    pettyCashApi.report(accessToken, period).then(setReport);
  }, [accessToken, period]);

  const entries = (report?.entries as { description: string; amount: number; type: string; entryDate: string; fund: { name: string } }[]) ?? [];

  return (
    <div className="space-y-4">
      <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value as 'daily' | 'monthly')}>
        <option value="daily">Daily report</option>
        <option value="monthly">Monthly report</option>
      </Select>
      <Card title={`${period === 'daily' ? 'Daily' : 'Monthly'} petty cash report`}>
        <div className="mb-4 flex gap-6 text-sm">
          <span>Expenses: <strong>{formatMoney(Number(report?.periodExpenses ?? 0))}</strong></span>
          <span>Replenishments: <strong>{formatMoney(Number(report?.periodReplenishments ?? 0))}</strong></span>
        </div>
        <ul className="divide-y divide-slate-50 text-sm">
          {entries.map((e, i) => (
            <li key={i} className="flex justify-between py-2">
              <span>
                {e.fund?.name} — {e.description} <span className="text-slate-400">({e.type})</span>
              </span>
              <span className="font-semibold">{formatMoney(e.amount)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
