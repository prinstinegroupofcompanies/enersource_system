export interface Permission {
  module: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  mfaEnabled: boolean;
  mustChangePassword: boolean;
  role: Role;
  department?: Department | null;
  permissions: Permission[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  module?: string | null;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  welcome: string;
  metrics: Record<string, number | string>;
  system: {
    activeUsers: number;
    notifications: number;
    unreadNotifications: number;
  };
  modules: { key: string; name: string; status: string; enabled: boolean }[];
  phase: number;
  message: string;
}
