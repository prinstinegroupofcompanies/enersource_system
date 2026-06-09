import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roleSlug: string;
  type: 'access';
}

export interface MfaTokenPayload {
  sub: string;
  type: 'mfa-pending';
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function signMfaToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'mfa-pending' } as MfaTokenPayload, env.jwtSecret, {
    expiresIn: '5m',
  });
}

export function signRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sid: sessionId, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtSecret) as AccessTokenPayload & { type: string };
  if (payload.type !== 'access') throw new Error('Invalid token type');
  return payload;
}

export function verifyMfaToken(token: string): MfaTokenPayload {
  const payload = jwt.verify(token, env.jwtSecret) as MfaTokenPayload;
  if (payload.type !== 'mfa-pending') throw new Error('Invalid MFA token');
  return payload;
}

export function verifyRefreshToken(token: string): { sub: string; sid: string } {
  const payload = jwt.verify(token, env.jwtRefreshSecret) as { sub: string; sid: string; type: string };
  if (payload.type !== 'refresh') throw new Error('Invalid refresh token');
  return { sub: payload.sub, sid: payload.sid };
}
