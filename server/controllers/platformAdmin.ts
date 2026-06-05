import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getTenants(req: Request, res: Response) {
  const tenants = await prisma.tenant.findMany({
    include: { platformPlan: true, usageMeters: true, billingInvoices: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json({ status: 'ok', data: tenants });
}

export async function getPlatformMetrics(req: Request, res: Response) {
  const tenants = await prisma.tenant.findMany({
      include: { platformPlan: true }
  });
  
  let mrr = 0;
  let activeTrials = 0;
  let activePaid = 0;
  let churned = 0;
  let pastDue = 0;
  
  for (const t of tenants) {
      if (t.billingStatus === 'trialing') activeTrials++;
      if (t.billingStatus === 'active') {
          activePaid++;
          if (t.platformPlan) { // simplistic MRR calculation
             mrr += t.platformPlan.price;
          }
      }
      if (t.billingStatus === 'canceled' || t.billingStatus === 'suspended') churned++;
      if (t.billingStatus === 'past_due') pastDue++;
  }
  
  res.json({ 
      status: 'ok', 
      data: {
          mrr,
          activeTrials,
          activePaid,
          churned,
          pastDue,
          totalTenants: tenants.length
      } 
  });
}

export async function changeTenantStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status, billingStatus } = req.body;
    
    await prisma.tenant.update({
        where: { id },
        data: { status, billingStatus }
    });
    
    res.json({ status: 'ok' });
}
