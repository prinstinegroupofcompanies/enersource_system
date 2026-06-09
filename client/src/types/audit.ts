export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: { id: string; name: string; email: string } | null;
  ipAddress: string | null;
  createdAt: string;
  hasChanges: boolean;
}
