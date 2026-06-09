import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { to: '/crm', label: 'Overview', end: true },
  { to: '/crm/leads', label: 'Leads' },
  { to: '/crm/pipeline', label: 'Pipeline' },
  { to: '/crm/clients', label: 'Clients' },
  { to: '/crm/reminders', label: 'Reminders' },
];

export function CrmLayout() {
  const { hasPermission } = useAuth();

  if (!hasPermission('crm', 'view')) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="font-semibold text-amber-900">You do not have access to CRM.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">CRM</h1>
        <p className="mt-1 text-slate-600">Leads, sales pipeline, client relationships & follow-up reminders</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive ? 'bg-brand-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
