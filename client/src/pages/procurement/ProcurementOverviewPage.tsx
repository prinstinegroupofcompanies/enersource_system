import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { procurementApi } from '../../lib/procurementApi';
import { Card } from '../../components/ui/Card';

export function ProcurementOverviewPage() {
  const { accessToken } = useAuth();
  const [s, setS] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    procurementApi.summary(accessToken).then(setS);
  }, [accessToken]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <ClipboardList className="h-5 w-5 text-brand-600" />
        <p className="mt-2 text-sm text-slate-500">Open requisitions</p>
        <p className="text-2xl font-bold">{s?.pendingRequisitions ?? 0}</p>
        <Link to="/procurement/requisitions" className="mt-2 text-sm font-semibold text-brand-700">
          View requisitions →
        </Link>
      </Card>
      <Card>
        <CreditCard className="h-5 w-5 text-brand-600" />
        <p className="mt-2 text-sm text-slate-500">Pending payments</p>
        <p className="text-2xl font-bold">{s?.pendingPayments ?? 0}</p>
        <Link to="/procurement/payments" className="mt-2 text-sm font-semibold text-brand-700">
          View payments →
        </Link>
      </Card>
    </div>
  );
}
