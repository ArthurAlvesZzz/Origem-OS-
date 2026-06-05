import { Request, Response, NextFunction } from 'express';
import prisma, { checkDbConnection } from '../lib/prisma';

export function requireEntitlement(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isDbConnected = await checkDbConnection();
      if (!isDbConnected || process.env.DATA_MODE === 'mock') {
        return next(); // Fallback to allow if no DB available (mock mode)
      }

      const tenantId = (req as any).tenantId;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { platformPlan: true }
      });

      if (!tenant) {
        return res.status(401).json({ error: 'Tenant not found' });
      }
      
      // If past due or canceled, block new actions (assuming typical write limitation)
      // Read actions might be allowed, but we'll assume we use requireEntitlement mostly for active features.
      
      const requiresActiveBilling = ['campaigns', 'crm', 'menu']; // features that require an active subscription
      
      if (requiresActiveBilling.includes(featureKey)) {
         if (tenant.billingStatus === 'canceled' || tenant.billingStatus === 'suspended') {
             return res.status(403).json({ error: 'Subscription is inactive. Please renew.' });
         }
         
         if (tenant.billingStatus === 'past_due' && req.method !== 'GET') {
             return res.status(403).json({ error: 'Account is past due. New actions blocked.' });
         }
      }

      const featuresJson = tenant.platformPlan?.featuresJson;
      let features: string[] = [];
      if (typeof featuresJson === 'string') {
          features = JSON.parse(featuresJson);
      } else if (Array.isArray(featuresJson)) {
          features = featuresJson;
      }
      
      // Allow free trial and custom overrides
      if (tenant.billingStatus === 'trialing' || features.includes(featureKey) || features.includes('*')) {
          return next();
      }

      return res.status(402).json({ error: `Requires entitlement: ${featureKey}. Please upgrade your plan.` });
    } catch (err) {
      console.error('[requireEntitlement]', err);
      // Fail open in dev/mock if it's a prisma error, otherwise fail
      if (process.env.NODE_ENV !== 'production' || process.env.DATA_MODE === 'mock') {
          return next();
      }
      return res.status(500).json({ error: 'Internal server error checking entitlement' });
    }
  };
}
