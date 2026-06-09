import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../lib/prisma.js';
import { permissionKey } from '../constants/permissions.js';

export interface AuthUser {
  id: string;
  email: string;
  roleSlug: string;
  permissions: Set<string>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!user?.isActive) {
      res.status(401).json({ error: 'User inactive' });
      return;
    }

    const permissions = new Set(
      user.role.permissions.map((rp) =>
        permissionKey(rp.permission.module, rp.permission.action)
      )
    );

    req.user = {
      id: user.id,
      email: user.email,
      roleSlug: user.role.slug,
      permissions,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requirePermission(module: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const key = permissionKey(module, action);
    if (
      req.user.roleSlug === 'super-administrator' ||
      req.user.permissions.has(key)
    ) {
      next();
      return;
    }

    res.status(403).json({ error: 'Insufficient permissions' });
  };
}

export function requireRole(...slugs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (slugs.includes(req.user.roleSlug) || req.user.roleSlug === 'super-administrator') {
      next();
      return;
    }
    res.status(403).json({ error: 'Role not authorized' });
  };
}
