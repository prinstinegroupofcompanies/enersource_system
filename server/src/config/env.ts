import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  databaseProvider: process.env.DATABASE_PROVIDER ?? 'sqlite',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  mfaIssuer: process.env.MFA_ISSUER ?? 'Enersource ERP',
  passwordPolicy: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH ?? '10', 10),
    requireUppercase: bool(process.env.PASSWORD_REQUIRE_UPPERCASE, true),
    requireLowercase: bool(process.env.PASSWORD_REQUIRE_LOWERCASE, true),
    requireNumber: bool(process.env.PASSWORD_REQUIRE_NUMBER, true),
    requireSpecial: bool(process.env.PASSWORD_REQUIRE_SPECIAL, true),
  },
};
