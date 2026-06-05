import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuthOrCron(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  // 1. Check if it's the internal cron token
  if (process.env.INTERNAL_CRON_TOKEN && token === process.env.INTERNAL_CRON_TOKEN) {
    (req as any).isCron = true; // no tenantId set, runs globally
    return next();
  }

  // 2. Otherwise try JWT
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key') as any;
    (req as any).user = payload;
    (req as any).tenantId = payload.tenantId;
    return next();
  } catch (e) {
    if (process.env.NODE_ENV === 'production' && !process.env.INTERNAL_CRON_TOKEN) {
      console.warn('[Security] INTERNAL_CRON_TOKEN missing in production');
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
