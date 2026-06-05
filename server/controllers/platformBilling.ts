import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { getBillingProvider } from '../services/billing/PlatformBillingProvider';

export async function getPlans(req: Request, res: Response) {
  const plans = await prisma.platformPlan.findMany({
    where: { isActive: true }
  });
  res.json({ status: 'ok', data: plans });
}

export async function checkout(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { planId } = req.body;
  
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  
  const plan = await prisma.platformPlan.findUnique({ where: { id: planId } });
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const provider = getBillingProvider();
  
  let customerId = tenant.billingCustomerId;
  if (!customerId) {
    customerId = await provider.createCustomer(tenant);
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { billingCustomerId: customerId, billingProvider: 'manual' }
    });
  }

  const { subscriptionId, url } = await provider.createSubscription(tenant, plan);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { 
      platformPlanId: plan.id, 
      billingSubscriptionId: subscriptionId,
      billingStatus: 'active' // For manual, assume active immediately or trialing
    }
  });

  res.json({ status: 'ok', data: { url, subscriptionId } });
}

export async function getSubscription(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const tenant = await prisma.tenant.findUnique({ 
    where: { id: tenantId },
    include: { platformPlan: true }
  });
  
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  res.json({ 
    status: 'ok', 
    data: { 
      status: tenant.billingStatus,
      plan: tenant.platformPlan,
      trialEndsAt: tenant.trialEndsAt,
      currentPeriodEnd: tenant.currentPeriodEnd,
      provider: tenant.billingProvider
    }
  });
}

export async function cancelSubscription(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  if (tenant.billingSubscriptionId) {
    const provider = getBillingProvider();
    await provider.cancelSubscription(tenant.billingSubscriptionId);
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { billingStatus: 'canceled' }
  });

  res.json({ status: 'ok' });
}

export async function changePlan(req: Request, res: Response) {
    // Basic alias to checkout for now
    return checkout(req, res);
}

export async function getInvoices(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const invoices = await prisma.billingInvoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: invoices });
}

export async function generatePortalUrl(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.billingCustomerId) {
       return res.status(400).json({ error: 'No billing portal available' });
  }

  const provider = getBillingProvider();
  const url = await provider.generatePortalUrl(tenant.billingCustomerId);
  res.json({ status: 'ok', data: { url } });
}

export async function webhook(req: Request, res: Response) {
    // Process provider webhooks ideally idempotently
    res.json({ status: 'received' });
}

export async function getStatus(req: Request, res: Response) {
   // Simplified version
   res.json({ status: 'ok', data: { provider: process.env.STRIPE_SECRET_KEY ? 'stripe' : 'manual' }});
}
