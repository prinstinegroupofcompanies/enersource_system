import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Hash, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { communicationApi } from '../../lib/communicationApi';
import type { CommunicationSummary } from '../../types/phase9';
import { Card } from '../../components/ui/Card';

export function CommunicationOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<CommunicationSummary | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    communicationApi.summary(accessToken).then(setS);
  }, [accessToken]);

  const cards = [
    { label: 'Channels', value: String(s?.channelCount ?? 0), icon: Hash },
    { label: 'Messages today', value: String(s?.messagesToday ?? 0), icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
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

      {s?.recentMessages?.length ? (
        <Card title="Recent messages">
          <ul className="divide-y divide-slate-100 text-sm">
            {s.recentMessages.map((m) => (
              <li key={m.id} className="py-2">
                <p className="font-medium text-slate-800">{m.sender}</p>
                <p className="text-slate-600">{m.body}</p>
                <p className="text-xs text-slate-400">
                  #{m.channel} · {new Date(m.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Get started">
        <Link
          to="/communication/channels"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
        >
          <Radio className="h-4 w-4" /> Open channels
        </Link>
      </Card>
    </div>
  );
}
