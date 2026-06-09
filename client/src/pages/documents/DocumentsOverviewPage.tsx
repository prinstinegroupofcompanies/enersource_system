import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileArchive, FolderOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { documentsApi, CATEGORY_LABELS } from '../../lib/documentsApi';
import type { DocumentsSummary } from '../../types/phase9';
import { Card } from '../../components/ui/Card';

export function DocumentsOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<DocumentsSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    documentsApi.summary(accessToken).then(setS);
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-500">Active documents</p>
              <p className="mt-1 text-xl font-bold">{s?.totalDocuments ?? 0}</p>
            </div>
            <FileArchive className="h-5 w-5 text-brand-600" />
          </div>
        </Card>
        <Card>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-500">Categories</p>
              <p className="mt-1 text-xl font-bold">{s?.categories?.length ?? 0}</p>
            </div>
            <FolderOpen className="h-5 w-5 text-brand-600" />
          </div>
        </Card>
      </div>

      {s?.categories?.length ? (
        <Card title="By category">
          <div className="flex flex-wrap gap-2">
            {s.categories.map((c) => (
              <span key={c.category} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                {CATEGORY_LABELS[c.category] ?? c.category}: {c.count}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {s?.recentUploads?.length ? (
        <Card title="Recent uploads">
          <ul className="divide-y divide-slate-100 text-sm">
            {s.recentUploads.map((u) => (
              <li key={u.id} className="flex justify-between py-2">
                <span>
                  <span className="font-mono text-brand-800">{u.documentNumber}</span> — {u.title}
                  <span className="block text-xs text-slate-500">
                    v{u.versionNumber} · {u.fileName}
                  </span>
                </span>
                <span className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Link
        to="/documents/library"
        className="inline-flex rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
      >
        Browse library →
      </Link>
    </div>
  );
}
