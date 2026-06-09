import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, BarChart2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reportsApi } from '../../lib/reportsApi';
import type { PowerBiConfig, ReportCatalogItem } from '../../types/phase11';
import { Card } from '../../components/ui/Card';

export function ReportsAnalyticsPage() {
  const { accessToken } = useAuth();
  const [powerBi, setPowerBi] = useState<PowerBiConfig | null>(null);
  const [catalog, setCatalog] = useState<ReportCatalogItem[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    reportsApi.powerBi(accessToken).then(setPowerBi);
    reportsApi.catalog(accessToken).then((c) => setCatalog(c.catalog));
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <Card title={powerBi?.title ?? 'Power BI Analytics'}>
        {powerBi?.enabled && powerBi.embedUrl ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <iframe
              title={powerBi.title}
              src={powerBi.embedUrl}
              className="h-[480px] w-full"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <BarChart2 className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600">{powerBi?.message}</p>
            <p className="mt-2 text-xs text-slate-500">
              Configure <code className="rounded bg-slate-200 px-1">POWER_BI_EMBED_URL</code> in the server environment.
            </p>
          </div>
        )}
      </Card>

      <Card title="All Available Reports">
        <ul className="divide-y divide-slate-100">
          {catalog.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500">{item.description}</p>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {item.module}
                </span>
              </div>
              <Link
                to={item.path}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Open <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
