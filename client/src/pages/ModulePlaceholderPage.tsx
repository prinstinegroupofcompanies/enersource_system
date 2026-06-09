import { useParams, Link, Navigate } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';
import { NAV_ITEMS } from '../config/navigation';
import { Card } from '../components/ui/Card';

const PHASE_DETAILS: Record<number, { title: string; items: string[] }> = {
  2: {
    title: 'Financial Management',
    items: ['Chart of Accounts', 'General Journal & Ledger', 'Trial Balance', 'Financial Statements'],
  },
  3: {
    title: 'Sales & Revenue',
    items: ['Quotations', 'Invoices', 'Accounts Receivable', 'Sales Dashboard'],
  },
  4: {
    title: 'Inventory Management',
    items: ['Solar panels, batteries, inverters', 'Stock levels', 'Transfers & adjustments'],
  },
  5: {
    title: 'Procurement & Petty Cash',
    items: ['Requisition workflow', 'Payment requests', 'Petty cash reconciliation'],
  },
  6: {
    title: 'Project Management',
    items: ['Installations & maintenance', 'Milestones', 'Budget & materials'],
  },
  7: {
    title: 'CRM',
    items: ['Client database', 'Leads & pipeline', 'Follow-up reminders'],
  },
  8: {
    title: 'Human Resources',
    items: ['Employee records', 'Attendance', 'KPIs & appraisals'],
  },
  9: {
    title: 'Communication & Documents',
    items: ['Staff messaging', 'Document archive', 'Version control'],
  },
  10: {
    title: 'Assets & Support',
    items: ['Asset registry', 'Internal & customer tickets'],
  },
  11: {
    title: 'Reporting & BI',
    items: ['Financial & operational reports', 'Dashboard analytics', 'Export PDF/Excel'],
  },
};

export function ModulePlaceholderPage() {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  if (moduleKey === 'finance') return <Navigate to="/finance" replace />;
  if (moduleKey === 'sales') return <Navigate to="/sales" replace />;
  if (moduleKey === 'inventory') return <Navigate to="/inventory" replace />;
  if (moduleKey === 'procurement') return <Navigate to="/procurement" replace />;
  if (moduleKey === 'petty-cash') return <Navigate to="/petty-cash" replace />;
  if (moduleKey === 'projects') return <Navigate to="/projects" replace />;
  if (moduleKey === 'crm') return <Navigate to="/crm" replace />;
  if (moduleKey === 'hr') return <Navigate to="/hr" replace />;
  if (moduleKey === 'communication') return <Navigate to="/communication" replace />;
  if (moduleKey === 'documents') return <Navigate to="/documents" replace />;
  if (moduleKey === 'assets') return <Navigate to="/assets" replace />;
  if (moduleKey === 'support') return <Navigate to="/support" replace />;
  if (moduleKey === 'reports') return <Navigate to="/reports" replace />;
  if (moduleKey === 'audit') return <Navigate to="/audit" replace />;
  if (moduleKey === 'settings') return <Navigate to="/profile" replace />;
  if (moduleKey === 'users') return <Navigate to="/users" replace />;
  if (moduleKey === 'dashboard') return <Navigate to="/" replace />;
  const nav = NAV_ITEMS.find((n) => n.key === moduleKey);
  const phase = nav?.phase ?? 2;
  const details = PHASE_DETAILS[phase] ?? { title: nav?.label ?? 'Module', items: [] };

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
        <Construction className="h-8 w-8 text-amber-700" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">{nav?.label ?? moduleKey}</h1>
      <p className="text-slate-600">
        This module is scheduled for <strong>Phase {phase}</strong> of the Enersource ERP rollout.
      </p>

      <Card title={`Coming in Phase ${phase}: ${details.title}`}>
        <ul className="space-y-2 text-left text-sm text-slate-700">
          {details.items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
    </div>
  );
}
