import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { calculateCustomerScore } from '../services/crm/scoreEngine';

// ==== SPECIAL ORDERS ====

export async function getSpecialOrders(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const orders = await prisma.specialOrder.findMany({
    where: { tenantId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: orders });
}

export async function createSpecialOrder(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const data = req.body;
  const order = await prisma.specialOrder.create({
    data: {
      ...data,
      tenantId,
      customerId: data.customerId
    }
  });
  
  if (data.eventDate) {
    await prisma.calendarEvent.create({
      data: {
        tenantId,
        title: `Encomenda: ${data.theme || 'Evento'}`,
        type: 'special_order',
        startAt: new Date(data.eventDate),
        referenceId: order.id,
      }
    });
  }

  res.json({ status: 'ok', data: order });
}

export async function updateSpecialOrder(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const id = req.params.id;
  await prisma.specialOrder.updateMany({
    where: { id, tenantId },
    data: req.body
  });
  const updated = await prisma.specialOrder.findFirst({ where: { id, tenantId }});
  res.json({ status: 'ok', data: updated });
}

// ==== CALENDAR ====

export async function getCalendarEvents(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const events = await prisma.calendarEvent.findMany({
    where: { tenantId },
    orderBy: { startAt: 'asc' }
  });
  res.json({ status: 'ok', data: events });
}

export async function createCalendarEvent(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const data = req.body;
  const ev = await prisma.calendarEvent.create({
    data: {
      ...data,
      tenantId,
    }
  });
  res.json({ status: 'ok', data: ev });
}

export async function updateCalendarEvent(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const id = req.params.id;
  await prisma.calendarEvent.updateMany({
    where: { id, tenantId },
    data: req.body
  });
  const updated = await prisma.calendarEvent.findFirst({ where: { id, tenantId }});
  res.json({ status: 'ok', data: updated });
}

// ==== LOYALTY ====

export async function getLoyaltyProgram(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  let prog = await prisma.loyaltyProgram.findFirst({ where: { tenantId } });
  if (!prog) {
    prog = await prisma.loyaltyProgram.create({
      data: { tenantId }
    });
  }
  res.json({ status: 'ok', data: prog });
}

export async function updateLoyaltyProgram(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const prog = await prisma.loyaltyProgram.findFirst({ where: { tenantId } });
  if (prog) {
    await prisma.loyaltyProgram.update({
      where: { id: prog.id },
      data: req.body
    });
  }
  const updated = await prisma.loyaltyProgram.findFirst({ where: { tenantId } });
  res.json({ status: 'ok', data: updated });
}

export async function adjustLoyaltyPoints(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { customerId } = req.params;
  const { points, description, referenceId } = req.body;

  const ev = await prisma.loyaltyEvent.create({
    data: {
      tenantId,
      customerId,
      points,
      description,
      type: points > 0 ? (referenceId ? 'earned' : 'adjusted') : 'redeemed',
      referenceId
    }
  });

  const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId }});
  if (customer) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { increment: points } }
    });
  }

  res.json({ status: 'ok', data: ev });
}

// ==== FEEDBACK & TICKETS ====

export async function getFeedback(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const fb = await prisma.customerFeedback.findMany({
    where: { tenantId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: fb });
}

export async function createFeedback(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const data = req.body;
  const fb = await prisma.customerFeedback.create({
    data: {
      ...data,
      tenantId,
      customerId: data.customerId
    }
  });
  
  if(fb.score <= 6) {
    await prisma.serviceTicket.create({
      data: {
        tenantId,
        customerId: fb.customerId,
        feedbackId: fb.id,
        status: 'open',
        priority: 'critical',
        category: 'complaint'
      }
    });
  }
  
  res.json({ status: 'ok', data: fb });
}

export async function getTickets(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const tickets = await prisma.serviceTicket.findMany({
    where: { tenantId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: tickets });
}

export async function createTicket(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const data = req.body;
  const tpl = await prisma.serviceTicket.create({
    data: {
      ...data,
      tenantId,
    }
  });
  res.json({ status: 'ok', data: tpl });
}

export async function resolveTicket(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const id = req.params.id;
  await prisma.serviceTicket.updateMany({
    where: { id, tenantId },
    data: {
      status: 'resolved',
      resolution: req.body.resolution
    }
  });
  const updated = await prisma.serviceTicket.findFirst({ where: { id, tenantId }});
  res.json({ status: 'ok', data: updated });
}

// ==== CUSTOMER INSIGHTS ====

export async function recalculateInsights(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const customers = await prisma.customer.findMany({ where: { tenantId }});
  for (const c of customers) {
    await calculateCustomerScore(tenantId, c.id);
  }
  res.json({ status: 'ok' });
}

export async function getCustomerInsights(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const customerId = req.params.id;
  const data = await calculateCustomerScore(tenantId, customerId);
  res.json({ status: 'ok', data });
}
