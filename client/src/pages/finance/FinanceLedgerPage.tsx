import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { financeApi, formatMoney } from '../../lib/financeApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface LedgerAccount {
  account: { code: string; name: string; category: string };
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
  movements: {
    date: string;
    entryNumber: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
}

export function FinanceLedgerPage() {
  const { accessToken, hasPermission } = useAuth();
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState<{ accounts: LedgerAccount[] } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    financeApi.ledger(accessToken, { period }).then((d) => setData(d as { accounts: LedgerAccount[] }));
  }, [accessToken, period]);

  const exportCsv = async () => {
    if (!accessToken) return;
    const blob = await financeApi.exportCsv('/finance/export/ledger?period=' + period, accessToken);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'general-ledger.csv';
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

      <div className="space-y-3">
        {(data?.accounts ?? []).map((acc) => (
          <Card key={acc.account.code}>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setExpanded(expanded === acc.account.code ? null : acc.account.code)}
            >
              <div>
                <span className="font-mono text-sm text-brand-800">{acc.account.code}</span>
                <span className="ml-2 font-semibold text-slate-800">{acc.account.name}</span>
              </div>
              <span className="font-bold text-slate-900">{formatMoney(acc.closingBalance)}</span>
            </button>
            {expanded === acc.account.code ? (
              <div className="mt-4 overflow-x-auto border-t border-slate-100 pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="pb-2 text-left">Date</th>
                      <th className="pb-2 text-left">Entry</th>
                      <th className="pb-2 text-right">Debit</th>
                      <th className="pb-2 text-right">Credit</th>
                      <th className="pb-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acc.movements.map((m, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="py-1.5">{new Date(m.date).toLocaleDateString()}</td>
                        <td className="py-1.5 font-mono text-xs">{m.entryNumber}</td>
                        <td className="py-1.5 text-right">{m.debit ? formatMoney(m.debit) : '—'}</td>
                        <td className="py-1.5 text-right">{m.credit ? formatMoney(m.credit) : '—'}</td>
                        <td className="py-1.5 text-right font-medium">{formatMoney(m.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Card>
        ))}
        {!data?.accounts?.length ? (
          <Card>
            <p className="text-center text-slate-500 py-6">No posted movements for this period</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
