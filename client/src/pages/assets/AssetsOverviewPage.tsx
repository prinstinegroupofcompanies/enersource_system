import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, TrendingDown, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { assetsApi, formatMoney, CATEGORY_LABELS } from '../../lib/assetsApi';
import type { AssetsSummary } from '../../types/phase10';
import { Card } from '../../components/ui/Card';

export function AssetsOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<AssetsSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    assetsApi.summary(accessToken).then(setS);
  }, [accessToken]);

  const cards = [
    { label: 'Active assets', value: String(s?.totalAssets ?? 0), icon: Wrench },
    { label: 'Total cost', value: formatMoney(s?.totalCost ?? 0), icon: DollarSign },
    { label: 'Book value', value: formatMoney(s?.totalBookValue ?? 0), icon: DollarSign },
    { label: 'Depreciation', value: formatMoney(s?.totalDepreciation ?? 0), icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-500">{c.label}</p>
                  <p className="mt-1 text-xl font-bold">{c.value}</p>
                </div>
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
            </Card>
          );
        })}
      </div>

      {s?.byCategory?.length ? (
        <Card title="By category">
          <div className="flex flex-wrap gap-2">
            {s.byCategory.map((c) => (
              <span key={c.category} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {CATEGORY_LABELS[c.category] ?? c.category}: {c.count}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      <Link to="/assets/registry" className="inline-flex rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100">
        View asset registry →
      </Link>
    </div>
  );
}
