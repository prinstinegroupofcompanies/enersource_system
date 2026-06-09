import { useEffect, useState } from 'react';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { FORM_SPACING, FORM_GRID } from '../components/ui/formLayout';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: { name: string };
  department?: { name: string } | null;
}

interface Role {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export function UsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
    departmentId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!accessToken) return;
    Promise.all([
      api.get<UserRow[]>('/users', accessToken),
      api.get<Role[]>('/users/roles', accessToken),
      api.get<Department[]>('/users/departments', accessToken),
    ]).then(([u, r, d]) => {
      setUsers(u);
      setRoles(r);
      setDepartments(d);
    });
  };

  useEffect(load, [accessToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError('');
    setLoading(true);
    try {
      await api.post(
        '/users',
        {
          ...form,
          departmentId: form.departmentId || undefined,
        },
        accessToken
      );
      setModalOpen(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', roleId: '', departmentId: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (user: UserRow) => {
    if (!accessToken) return;
    await api.patch(`/users/${user.id}`, { isActive: !user.isActive }, accessToken);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600">Roles, departments, and access control</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/50">
                  <td className="py-3 font-medium text-slate-800">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="py-3 text-slate-600">{u.email}</td>
                  <td className="py-3">{u.role.name}</td>
                  <td className="py-3 text-slate-600">{u.department?.name ?? '—'}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(u)}
                      className="touch-target rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                      title={u.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create User">
        <form onSubmit={handleCreate} className={FORM_SPACING}>
          <div className={FORM_GRID}>
            <Input
              label="First name"
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <Input
              label="Last name"
              required
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Temporary password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <Select
            label="Role"
            required
            value={form.roleId}
            onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
          >
            <option value="">None</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>
            Create User
          </Button>
        </form>
      </Modal>
    </div>
  );
}
