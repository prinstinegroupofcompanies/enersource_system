import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { hashPassword, validatePassword, verifyPassword } from '../utils/password.js';
import {
  signAccessToken,
  signMfaToken,
  signRefreshToken,
  verifyMfaToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { createAuditLog } from './audit.service.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function login(
  email: string,
  password: string,
  meta: { ip?: string; userAgent?: string }
) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { role: true, department: true },
  });

  if (!user || !user.isActive) {
    throw new Error('Invalid email or password');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('Account temporarily locked. Try again later.');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts, lockedUntil },
    });
    throw new Error('Invalid email or password');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  if (user.mfaEnabled && user.mfaSecret) {
    const mfaToken = signMfaToken(user.id);
    return { requiresMfa: true, mfaToken, userId: user.id };
  }

  return completeLogin(user.id, meta);
}

export async function verifyMfaAndLogin(
  mfaToken: string,
  code: string,
  meta: { ip?: string; userAgent?: string }
) {
  const { sub: userId } = verifyMfaToken(mfaToken);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.mfaEnabled || !user.mfaSecret) {
    throw new Error('MFA not configured');
  }

  const valid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!valid) throw new Error('Invalid verification code');

  return completeLogin(userId, meta);
}

async function completeLogin(
  userId: string,
  meta: { ip?: string; userAgent?: string }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      department: true,
    },
  });

  if (!user) throw new Error('User not found');

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: crypto.randomUUID(),
      userAgent: meta.userAgent,
      ipAddress: meta.ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createAuditLog({
    actorId: user.id,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.id,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  const permissions = user.role.permissions.map((rp) => ({
    module: rp.permission.module,
    action: rp.permission.action,
  }));

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roleSlug: user.role.slug,
  });

  const refreshToken = signRefreshToken(user.id, session.id);

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user, permissions),
  };
}

export async function refreshSession(refreshToken: string) {
  const { sub: userId, sid: sessionId } = verifyRefreshToken(refreshToken);

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId, refreshToken },
  });

  if (!session || session.expiresAt < new Date()) {
    throw new Error('Session expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
      department: true,
    },
  });

  if (!user?.isActive) throw new Error('User inactive');

  const permissions = user.role.permissions.map((rp) => ({
    module: rp.permission.module,
    action: rp.permission.action,
  }));

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    roleSlug: user.role.slug,
  });

  return { accessToken, user: sanitizeUser(user, permissions) };
}

export async function logout(userId: string, refreshToken?: string) {
  if (refreshToken) {
    try {
      const { sid } = verifyRefreshToken(refreshToken);
      await prisma.session.deleteMany({ where: { id: sid, userId } });
    } catch {
      await prisma.session.deleteMany({ where: { userId } });
    }
  } else {
    await prisma.session.deleteMany({ where: { userId } });
  }

  await createAuditLog({
    actorId: userId,
    action: 'LOGOUT',
    entityType: 'User',
    entityId: userId,
  });
}

export async function setupMfa(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `${env.mfaIssuer} (${userId.slice(0, 8)})`,
    length: 20,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: secret.base32, mfaEnabled: false },
  });

  const qr = await QRCode.toDataURL(secret.otpauth_url ?? '');
  return { secret: secret.base32, qrCode: qr };
}

export async function enableMfa(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecret) throw new Error('MFA setup required first');

  const valid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!valid) throw new Error('Invalid verification code');

  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  });

  await createAuditLog({
    actorId: userId,
    action: 'MFA_ENABLED',
    entityType: 'User',
    entityId: userId,
  });
}

export async function disableMfa(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecret) return;

  const valid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!valid) throw new Error('Invalid verification code');

  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: false, mfaSecret: null },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const validation = validatePassword(newPassword);
  if (!validation.valid) throw new Error(validation.errors.join('. '));

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new Error('Current password is incorrect');

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(newPassword),
      passwordChangedAt: new Date(),
      mustChangePassword: false,
    },
  });

  await prisma.session.deleteMany({ where: { userId } });

  await createAuditLog({
    actorId: userId,
    action: 'PASSWORD_CHANGED',
    entityType: 'User',
    entityId: userId,
  });
}

function sanitizeUser(
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl: string | null;
    mfaEnabled: boolean;
    mustChangePassword: boolean;
    role: { id: string; name: string; slug: string };
    department: { id: string; name: string; code: string } | null;
  },
  permissions: { module: string; action: string }[]
) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    mfaEnabled: user.mfaEnabled,
    mustChangePassword: user.mustChangePassword,
    role: user.role,
    department: user.department,
    permissions,
  };
}

export { validatePassword, hashPassword };
