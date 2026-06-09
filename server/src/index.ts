import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());

function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = env.clientUrl.split(',').map((o) => o.trim()).filter(Boolean);
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
  // Vercel production and preview deployments
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  if (env.nodeEnv === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts. Try again later.' },
  })
);

app.use('/api', apiRoutes);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Enersource ERP API running on http://localhost:${env.port}`);
  console.log(`Database: ${env.databaseProvider}`);
});
