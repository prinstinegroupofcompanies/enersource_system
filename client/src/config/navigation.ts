import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Landmark,
  ShoppingCart,
  Package,
  ClipboardList,
  Wallet,
  FolderKanban,
  Contact,
  UserCircle,
  MessageSquare,
  FileArchive,
  Wrench,
  Headphones,
  BarChart3,
  Shield,
  Settings,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  module: string;
  phase: number;
  permission?: { module: string; action: string };
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard, module: 'dashboard', phase: 1 },
  { key: 'users', label: 'User Management', path: '/users', icon: Users, module: 'users', phase: 1, permission: { module: 'users', action: 'view' } },
  { key: 'finance', label: 'Financial Management', path: '/finance', icon: Landmark, module: 'finance', phase: 2 },
  { key: 'sales', label: 'Sales & Revenue', path: '/sales', icon: ShoppingCart, module: 'sales', phase: 3 },
  { key: 'inventory', label: 'Inventory', path: '/inventory', icon: Package, module: 'inventory', phase: 4 },
  { key: 'procurement', label: 'Procurement', path: '/procurement', icon: ClipboardList, module: 'procurement', phase: 5 },
  { key: 'petty-cash', label: 'Petty Cash', path: '/petty-cash', icon: Wallet, module: 'petty-cash', phase: 5 },
  { key: 'projects', label: 'Projects', path: '/projects', icon: FolderKanban, module: 'projects', phase: 6 },
  { key: 'crm', label: 'CRM', path: '/crm', icon: Contact, module: 'crm', phase: 7 },
  { key: 'hr', label: 'Human Resources', path: '/hr', icon: UserCircle, module: 'hr', phase: 8 },
  { key: 'communication', label: 'Communication', path: '/communication', icon: MessageSquare, module: 'communication', phase: 9 },
  { key: 'documents', label: 'Documents', path: '/documents', icon: FileArchive, module: 'documents', phase: 9 },
  { key: 'assets', label: 'Asset Registry', path: '/assets', icon: Wrench, module: 'assets', phase: 10 },
  { key: 'support', label: 'Support Tickets', path: '/support', icon: Headphones, module: 'support', phase: 10 },
  { key: 'reports', label: 'Reports & BI', path: '/reports', icon: BarChart3, module: 'reports', phase: 11 },
  { key: 'audit', label: 'Audit Trail', path: '/audit', icon: Shield, module: 'audit', phase: 1, permission: { module: 'audit', action: 'view' } },
  { key: 'settings', label: 'Profile', path: '/profile', icon: Settings, module: 'settings', phase: 1 },
];
