import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, reportsApi } from '../../lib/reportsApi';
import type { OperationalSection } from '../../types/phase11';
import { Card } from '../../components/ui/Card';

const METRIC_LABELS: Record<string, string> = {
  items: 'Items',
  valuation: 'Valuation',
  lowStock: 'Low stock',
  movements30d: 'Movements (30d)',
  active: 'Active',
  completed: 'Completed',
  delayed: 'Delayed',
  budgetPerformance: 'Budget %',
  openLeads: 'Open leads',
  pipelineValue: 'Pipeline value',
  pendingReminders: 'Reminders',
  conversionRate: 'Conversion %',
  employees: 'Employees',
  presentToday: 'Present today',
  attendanceRate: 'Attendance %',
  pendingAppraisals: 'Pending appraisals',
  open: 'Open',
  inProgress: 'In progress',
  customerOpen: 'Customer open',
  urgent: 'Urgent',
  count: 'Asset count',
  totalCost: 'Total cost',
  bookValue: 'Book value',
  depreciation: 'Depreciation',
};

function formatMetric(key: string, value: number) {
  if (['valuation', 'pipelineValue', 'totalCost', 'bookValue', 'depreciation'].includes(key)) {
    return formatMoney(value);
  }
  if (key.endsWith('Rate') || key === 'budgetPerformance' || key === 'conversionRate') {
    return `${value}%`;
  }
  return String(value);
}

export function ReportsOperationalPage() {
  const { accessToken } = useAuth();
  const [sections, setSections] = useState<OperationalSection[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    reportsApi.operational(accessToken).then((r) => setSections(r.sections));
  }, [accessToken]);

  if (!sections.length) {
    return (
      <Card title="Operational Reports">
        <p className="text-sm text-slate-600">No operational report sections are available for your role.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.key} title={section.title}>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(section.metrics).map(([key, value]) => (
              <div key={key}>
                <dt className="text-slate-500">{METRIC_LABELS[key] ?? key}</dt>
                <dd className="font-semibold">{formatMetric(key, value)}</dd>
              </div>
            ))}
          </dl>
          <Link
            to={section.link}
            className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Open module →
          </Link>
        </Card>
      ))}
    </div>
  );
}
