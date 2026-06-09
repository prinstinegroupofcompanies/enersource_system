import { useEffect, useState } from 'react';
import { Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeApi, formatMoney } from '../../lib/financeApi';
import type { TrialBalance } from '../../types/finance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function FinanceTrialBalancePage() {
  const { accessToken, hasPermission } = useAuth();
  const [period, setPeriod] = useState('monthly');
  const [tb, setTb] = useState<TrialBalance | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    financeApi.trialBalance(accessToken, period).then(setTb);
  }, [accessToken, period]);

  const exportCsv = async () => {
    if (!accessToken) return;
    const blob = await financeApi.exportCsv(`/finance/export/trial-balance?period=${period}`, accessToken);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trial-balance.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
        {hasPermission('finance', 'export') ? (
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        ) : null}
      </div>

      {tb ? (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
            tb.balanced ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {tb.balanced ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          {tb.balanced
            ? 'Trial balance is in balance'
            : tb.errors.join(' · ') || 'Trial balance is out of balance'}
        </div>
      ) : null}

      <Card>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 text-left font-semibold">Code</th>
                <th className="pb-3 text-left font-semibold">Account</th>
                <th className="pb-3 text-right font-semibold">Debit</th>
                <th className="pb-3 text-right font-semibold">Credit</th>
                <th className="pb-3 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {tb?.rows.map((r) => (
                <tr key={r.code} className="border-b border-slate-50">
                  <td className="py-2 font-mono text-brand-800">{r.code}</td>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 text-right">{r.debit ? formatMoney(r.debit) : '—'}</td>
                  <td className="py-2 text-right">{r.credit ? formatMoney(r.credit) : '—'}</td>
                  <td className="py-2 text-right font-semibold">{formatMoney(r.balance)}</td>
                </tr>
              ))}
            </tbody>
            {tb ? (
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-bold">
                  <td colSpan={2} className="pt-3">
                    Totals
                  </td>
                  <td className="pt-3 text-right">{formatMoney(tb.totalDebit)}</td>
                  <td className="pt-3 text-right">{formatMoney(tb.totalCredit)}</td>
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </Card>
    </div>
  );
}
