import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { financeApi, formatMoney } from '../../lib/financeApi';
import { Card } from '../../components/ui/Card';

type Tab = 'income' | 'balance' | 'cashflow';

export function FinanceReportsPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>('income');
  const [period, setPeriod] = useState('monthly');
  const [income, setIncome] = useState<Record<string, unknown> | null>(null);
  const [balance, setBalance] = useState<Record<string, unknown> | null>(null);
  const [cashFlow, setCashFlow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    if (tab === 'income') financeApi.incomeStatement(accessToken, period).then(setIncome);
    if (tab === 'balance') financeApi.balanceSheet(accessToken).then(setBalance);
    if (tab === 'cashflow') financeApi.cashFlow(accessToken, period).then(setCashFlow);
  }, [accessToken, tab, period]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'income', label: 'Income Statement' },
    { id: 'balance', label: 'Balance Sheet' },
    { id: 'cashflow', label: 'Cash Flow' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab !== 'balance' ? (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="ml-auto rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        ) : null}
      </div>

      {tab === 'income' && income ? (
        <Card title="Income Statement">
          <dl className="space-y-3 text-sm">
            <Row label="Revenue" value={formatMoney((income.revenue as { total: number })?.total ?? 0)} bold />
            <Row label="Cost of Sales" value={formatMoney((income.costOfSales as number) ?? 0)} />
            <Row label="Gross Profit" value={formatMoney((income.grossProfit as number) ?? 0)} bold />
            <Row
              label="Operating Expenses"
              value={formatMoney((income.operatingExpenses as { total: number })?.total ?? 0)}
            />
            <Row label="Net Profit" value={formatMoney((income.netProfit as number) ?? 0)} highlight />
          </dl>
        </Card>
      ) : null}

      {tab === 'balance' && balance ? (
        <div className="grid gap-4 md:grid-cols-3">
          <ReportSection
            title="Assets"
            total={formatMoney((balance.assets as { total: number })?.total ?? 0)}
            accounts={(balance.assets as { accounts: { code: string; name: string; balance: number }[] })?.accounts ?? []}
          />
          <ReportSection
            title="Liabilities"
            total={formatMoney((balance.liabilities as { total: number })?.total ?? 0)}
            accounts={(balance.liabilities as { accounts: { code: string; name: string; balance: number }[] })?.accounts ?? []}
          />
          <ReportSection
            title="Equity"
            total={formatMoney((balance.equity as { total: number })?.total ?? 0)}
            accounts={(balance.equity as { accounts: { code: string; name: string; balance: number }[] })?.accounts ?? []}
          />
        </div>
      ) : null}

      {tab === 'cashflow' && cashFlow ? (
        <Card title="Cash Flow Statement">
          <dl className="space-y-2 text-sm">
            <Row label="Operating Activities" value={formatMoney((cashFlow.operatingActivities as number) ?? 0)} />
            <Row label="Investing Activities" value={formatMoney((cashFlow.investingActivities as number) ?? 0)} />
            <Row label="Financing Activities" value={formatMoney((cashFlow.financingActivities as number) ?? 0)} />
            <Row label="Net Cash Change" value={formatMoney((cashFlow.netCashChange as number) ?? 0)} highlight />
          </dl>
        </Card>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between border-b border-slate-50 pb-2 ${
        highlight ? 'border-brand-200 bg-brand-50/50 -mx-2 px-2 py-2 rounded-lg font-bold text-brand-900' : ''
      }`}
    >
      <dt className={bold ? 'font-semibold text-slate-800' : 'text-slate-600'}>{label}</dt>
      <dd className={bold ? 'font-bold' : ''}>{value}</dd>
    </div>
  );
}

function ReportSection({
  title,
  total,
  accounts,
}: {
  title: string;
  total: string;
  accounts: { code: string; name: string; balance: number }[];
}) {
  return (
    <Card title={title}>
      <p className="mb-3 text-lg font-bold text-slate-900">{total}</p>
      <ul className="max-h-64 space-y-1 overflow-y-auto text-xs text-slate-600">
        {accounts
          .filter((a) => a.balance !== 0)
          .map((a) => (
            <li key={a.code} className="flex justify-between gap-2">
              <span>
                {a.code} {a.name}
              </span>
              <span className="font-medium text-slate-800">{formatMoney(a.balance)}</span>
            </li>
          ))}
      </ul>
    </Card>
  );
}
