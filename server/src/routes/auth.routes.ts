import { Router } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/mfa/verify', async (req, res, next) => {
  try {
    const body = z
      .object({ mfaToken: z.string(), code: z.string().length(6) })
      .parse(req.body);
    const result = await authService.verifyMfaAndLogin(body.mfaToken, body.code, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const result = await authService.refreshSession(refreshToken);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.body?.refreshToken as string | undefined;
    await authService.logout(req.user!.id, refreshToken);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post('/password/change', authenticate, async (req, res, next) => {
  try {
    const body = z
      .object({ currentPassword: z.string(), newPassword: z.string() })
      .parse(req.body);
    await authService.changePassword(req.user!.id, body.currentPassword, body.newPassword);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.get('/mfa/setup', authenticate, async (req, res, next) => {
  try {
    const result = await authService.setupMfa(req.user!.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/mfa/enable', authenticate, async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().length(6) }).parse(req.body);
    await authService.enableMfa(req.user!.id, code);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post('/mfa/disable', authenticate, async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().length(6) }).parse(req.body);
    await authService.disableMfa(req.user!.id, code);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
