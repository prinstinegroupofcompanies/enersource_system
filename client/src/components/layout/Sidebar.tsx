import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BrandLogo } from '../brand/BrandLogo';
import { NAV_ITEMS } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const { hasPermission, user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.permission && !hasPermission(item.permission.module, item.permission.action)) {
      return false;
    }
    if (item.module === 'dashboard') return true;
    return hasPermission(item.module, 'view') || user?.role.slug === 'super-administrator';
  });

  const content = (
    <>
      <div className={`border-b border-white/10 px-4 py-5 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="rounded-xl bg-white px-2 py-1 shadow-sm">
            <img src="/enersource_logo.jpeg" alt="EnerSource" className="h-8 w-auto object-contain" />
          </div>
        ) : (
          <BrandLogo size="md" subtitle="Solar ERP Platform" variant="on-dark" className="fade-in" />
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 touch-target ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-950/40'
                    : 'text-brand-100 hover:bg-brand-800/60 hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              {!collapsed ? (
                <span className="flex flex-1 items-center justify-between gap-2 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.phase > 1 && !['finance', 'sales', 'inventory', 'procurement', 'petty-cash', 'projects', 'crm', 'hr', 'communication', 'documents', 'assets', 'support', 'reports', 'audit'].includes(item.key) ? (
                    <span className="shrink-0 rounded-md bg-brand-900/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-300">
                      P{item.phase}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="hidden border-t border-brand-800/50 p-3 lg:block">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-brand-300 transition-colors hover:bg-brand-800/60 hover:text-white touch-target"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed ? <span className="text-xs">Collapse</span> : null}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col bg-gradient-to-b from-slate-900 via-brand-950 to-brand-900 transition-all duration-300 ease-out lg:sticky lg:z-30 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {content}
      </aside>
    </>
  );
}
