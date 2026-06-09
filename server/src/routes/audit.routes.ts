import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as auditService from '../services/audit.service.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('audit', 'view'), async (req, res, next) => {
  try {
    res.json(
      await auditService.listAuditLogs({
        entityType: req.query.entityType as string | undefined,
        action: req.query.action as string | undefined,
        search: req.query.search as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('audit', 'view'), async (req, res, next) => {
  try {
    const log = await auditService.getAuditLog(String(req.params.id));
    if (!log) {
      res.status(404).json({ message: 'Audit log not found' });
      return;
    }
    res.json(log);
  } catch (e) {
    next(e);
  }
});

export default router;
