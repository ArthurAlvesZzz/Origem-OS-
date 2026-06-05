import { Request, Response, NextFunction } from 'express';

export function requireCronToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : req.query.token;

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.INTERNAL_CRON_TOKEN) {
      console.warn('[Security Warning] INTERNAL_CRON_TOKEN not configured in production, rejecting cron requests');
      return res.status(403).json({ error: 'INTERNAL_CRON_TOKEN missing in server configuration' });
    }
    
    if (token !== process.env.INTERNAL_CRON_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized: Invalid cron token' });
    }
  }

  // In non-production or if token is valid
  next();
}
