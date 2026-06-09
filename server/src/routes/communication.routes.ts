import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as communicationService from '../services/communication/communication.service.js';

const router = Router();
router.use(authenticate);

router.get('/summary', requirePermission('communication', 'view'), async (req, res, next) => {
  try {
    res.json(await communicationService.getCommunicationSummary(req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/channels', requirePermission('communication', 'view'), async (req, res, next) => {
  try {
    res.json(await communicationService.listChannels(req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.get('/channels/:id/messages', requirePermission('communication', 'view'), async (req, res, next) => {
  try {
    res.json(await communicationService.getChannelMessages(String(req.params.id), req.user!.id));
  } catch (e) {
    next(e);
  }
});

router.post('/channels/:id/messages', requirePermission('communication', 'create'), async (req, res, next) => {
  try {
    const body = z.object({ body: z.string().min(1).max(4000) }).parse(req.body);
    res.status(201).json(
      await communicationService.sendMessage(String(req.params.id), body.body, req.user!.id)
    );
  } catch (e) {
    next(e);
  }
});

router.post('/channels', requirePermission('communication', 'create'), async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        slug: z.string().min(1),
        type: z.string().optional(),
        departmentId: z.string().uuid().optional(),
        description: z.string().optional(),
      })
      .parse(req.body);
    res.status(201).json(await communicationService.createChannel(body, req.user!.id));
  } catch (e) {
    next(e);
  }
});

export default router;
