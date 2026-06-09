import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
