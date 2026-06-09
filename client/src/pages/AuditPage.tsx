import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auditApi } from '../lib/auditApi';
import type { AuditLogEntry } from '../types/audit';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FORM_SPACING } from '../components/ui/formLayout';

export function AuditPage() {
  const { accessToken, hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');

  useEffect(() => {
    if (!accessToken || !hasPermission('audit', 'view')) return;
    auditApi
      .list(accessToken, { search: search || undefined, entityType: entityType || undefined })
      .then(setLogs);
  }, [accessToken, search, entityType, hasPermission]);

  if (!hasPermission('audit', 'view')) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="font-semibold text-amber-900">You do not have access to the audit trail.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Audit Trail</h1>
        <p className="mt-1 text-slate-600">System-wide activity log for security and compliance review</p>
      </div>

      <div className={`${FORM_SPACING} sm:grid sm:grid-cols-2 lg:grid-cols-3`}>
        <Input
          label="Search"
          placeholder="Action, entity, or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select label="Entity type" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">All types</option>
          <option value="User">User</option>
          <option value="JournalEntry">Journal Entry</option>
          <option value="Invoice">Invoice</option>
          <option value="Asset">Asset</option>
          <option value="SupportTicket">Support Ticket</option>
          <option value="Document">Document</option>
          <option value="Project">Project</option>
        </Select>
      </div>

      <Card title={`Recent events (${logs.length})`}>
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-1 border-b border-slate-50 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{log.entityType}</span>
                  {log.entityId ? (
                    <span className="truncate font-mono text-xs text-slate-500">{log.entityId.slice(0, 8)}…</span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-slate-500">
                  {log.actor?.name ?? 'System'} · {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              {log.hasChanges ? (
                <span className="shrink-0 text-xs font-medium text-brand-700">Has change data</span>
              ) : null}
            </div>
          ))}
          {!logs.length ? <p className="py-8 text-center text-slate-500">No audit events match your filters.</p> : null}
        </div>
      </Card>
    </div>
  );
}
