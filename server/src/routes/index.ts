import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationsRoutes from './notifications.routes.js';
import financeRoutes from './finance.routes.js';
import salesRoutes from './sales.routes.js';
import inventoryRoutes from './inventory.routes.js';
import procurementRoutes from './procurement.routes.js';
import projectsRoutes from './projects.routes.js';
import crmRoutes from './crm.routes.js';
import hrRoutes from './hr.routes.js';
import communicationRoutes from './communication.routes.js';
import documentsRoutes from './documents.routes.js';
import assetsRoutes from './assets.routes.js';
import supportRoutes from './support.routes.js';
import reportsRoutes from './reports.routes.js';
import auditRoutes from './audit.routes.js';
import uploadsRoutes from './uploads.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'enersource-erp-api', version: '1.0.0' });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/finance', financeRoutes);
router.use('/sales', salesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/procurement', procurementRoutes);
router.use('/projects', projectsRoutes);
router.use('/crm', crmRoutes);
router.use('/hr', hrRoutes);
router.use('/communication', communicationRoutes);
router.use('/documents', documentsRoutes);
router.use('/assets', assetsRoutes);
router.use('/support', supportRoutes);
router.use('/reports', reportsRoutes);
router.use('/audit', auditRoutes);
router.use('/uploads', uploadsRoutes);

export default router;
