import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function getPipelines(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const pipelines = await prisma.crmPipeline.findMany({
    where: { tenantId },
    include: {
      stages: { orderBy: { order: 'asc' } }
    }
  });
  
  if (pipelines.length === 0) {
    // Create default pipeline if none exists
    const p = await prisma.crmPipeline.create({
      data: {
        tenantId,
        name: 'Vendas Padrão',
        isDefault: true,
        stages: {
          create: [
            { tenantId, name: 'Lead Novo', order: 1 },
            { tenantId, name: 'Aguardando Pagamento', order: 2 },
            { tenantId, name: 'Ativo', order: 3 },
            { tenantId, name: 'Perdido', order: 4 }
          ]
        }
      },
      include: { stages: true }
    });
    pipelines.push(p);
  }

  res.json({ status: 'ok', data: pipelines });
}

export async function createPipeline(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name, type } = req.body;
  const p = await prisma.crmPipeline.create({
    data: { tenantId, name, type }
  });
  res.json({ status: 'ok', data: p });
}

export async function getDeals(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { pipelineId } = req.query;

  const deals = await prisma.crmDeal.findMany({
    where: { 
      tenantId,
      ...(pipelineId ? { pipelineId: String(pipelineId) } : {})
    },
    orderBy: { updatedAt: 'desc' }
  });
  res.json({ status: 'ok', data: deals });
}

export async function createDeal(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { pipelineId, stageId, title, value, priority, customerId } = req.body;

  const deal = await prisma.crmDeal.create({
    data: {
      tenantId, pipelineId, stageId, title, value: value || 0, priority: priority || 'normal', customerId
    }
  });
  res.json({ status: 'ok', data: deal });
}

export async function updateDeal(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { title, value, status, priority, stageId } = req.body;

  const deal = await prisma.crmDeal.updateMany({
    where: { id, tenantId },
    data: { title, value, status, priority, stageId }
  });
  
  const updated = await prisma.crmDeal.findFirst({ where: { id, tenantId } });
  res.json({ status: 'ok', data: updated });
}

export async function moveDeal(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { stageId } = req.body;

  await prisma.crmDeal.updateMany({
    where: { id, tenantId },
    data: { stageId }
  });
  
  const updated = await prisma.crmDeal.findFirst({ where: { id, tenantId } });
  
  // Create an activity for the move
  if(updated) {
     const stage = await prisma.crmStage.findFirst({where: {id: stageId}});
     await prisma.crmActivity.create({
        data: {
           tenantId,
           dealId: id,
           type: 'status_change',
           title: `Card movido para etapa ${stage?.name || 'desconhecida'}`,
           createdByUserId: (req as any).userId
        }
     });
  }
  
  res.json({ status: 'ok', data: updated });
}

export async function getActivities(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { dealId, customerId } = req.query;

  const acts = await prisma.crmActivity.findMany({
    where: {
      tenantId,
      ...(dealId ? { dealId: String(dealId) } : {}),
      ...(customerId ? { customerId: String(customerId) } : {})
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: acts });
}

export async function createActivity(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { dealId, customerId, type, title, body, dueAt } = req.body;

  const act = await prisma.crmActivity.create({
    data: {
      tenantId, dealId, customerId, type, title, body, dueAt,
      createdByUserId: (req as any).userId
    }
  });
  res.json({ status: 'ok', data: act });
}

export async function updateActivity(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { title, body, dueAt, type } = req.body;

  const act = await prisma.crmActivity.updateMany({
    where: { id, tenantId },
    data: { title, body, dueAt, type }
  });
  res.json({ status: 'ok', data: act });
}

export async function completeActivity(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const act = await prisma.crmActivity.updateMany({
    where: { id, tenantId },
    data: { completedAt: new Date() }
  });
  res.json({ status: 'ok', data: act });
}

export async function getTemplates(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const temps = await prisma.communicationTemplate.findMany({
    where: { tenantId, active: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: temps });
}

export async function createTemplate(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name, channel, body } = req.body;

  const temp = await prisma.communicationTemplate.create({
    data: { tenantId, name, channel, body }
  });
  res.json({ status: 'ok', data: temp });
}

export async function getCommunications(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const comms = await prisma.communicationQueue.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json({ status: 'ok', data: comms });
}

export async function queueCommunication(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { channel, recipient, renderedBody, dealId, customerId } = req.body;

  const comm = await prisma.communicationQueue.create({
    data: {
      tenantId, channel, recipient, renderedBody, dealId, customerId, status: 'draft'
    }
  });
  res.json({ status: 'ok', data: comm });
}

export async function markCommunicationSimulated(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  await prisma.communicationQueue.updateMany({
    where: { id, tenantId },
    data: { status: 'simulated', sentAt: new Date() }
  });

  const updated = await prisma.communicationQueue.findFirst({ where: { id, tenantId } });
  res.json({ status: 'ok', data: updated });
}

export async function updateTemplate(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { name, active, body } = req.body;
  await prisma.communicationTemplate.updateMany({
    where: { id, tenantId },
    data: { name, active, body }
  });
  res.json({ status: 'ok' });
}

export async function wonDeal(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  await prisma.crmDeal.updateMany({
    where: { id, tenantId },
    data: { status: 'won' }
  });
  
  await prisma.crmActivity.create({
    data: {
      tenantId, dealId: id, type: 'status_change', title: 'Deal Ganho (Won)', createdByUserId: (req as any).userId
    }
  });
  res.json({ status: 'ok' });
}

export async function lostDeal(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  await prisma.crmDeal.updateMany({
    where: { id, tenantId },
    data: { status: 'lost' }
  });
  
  await prisma.crmActivity.create({
    data: {
      tenantId, dealId: id, type: 'status_change', title: 'Deal Perdido (Lost)', createdByUserId: (req as any).userId
    }
  });
  res.json({ status: 'ok' });
}

export async function rescheduleActivity(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { dueAt } = req.body;
  await prisma.crmActivity.updateMany({
    where: { id, tenantId },
    data: { dueAt }
  });
  res.json({ status: 'ok' });
}

export async function updateConversation(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { status, unreadCount } = req.body;
  await prisma.crmConversation.updateMany({
    where: { id, tenantId },
    data: { status, unreadCount }
  });
  res.json({ status: 'ok' });
}

export async function assignConversation(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { assigneeId } = req.body;
  await prisma.crmConversation.updateMany({
    where: { id, tenantId },
    data: { assignedUserId: assigneeId }
  });
  res.json({ status: 'ok' });
}

export async function createConversation(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { customerId, channel } = req.body;
  const conv = await prisma.crmConversation.create({
    data: { tenantId, customerId, channel: channel || 'whatsapp' }
  });
  res.json({ status: 'ok', data: conv });
}

export async function getConversations(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { status } = req.query;

  const convs = await prisma.crmConversation.findMany({
    where: { 
      tenantId,
      ...(status ? { status: String(status) } : {})
    },
    include: {
      customer: true
    },
    orderBy: { lastMessageAt: 'desc' }
  });
  res.json({ status: 'ok', data: convs });
}

export async function getMessages(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { conversationId } = req.params;

  const msgs = await prisma.crmMessage.findMany({
    where: {
      tenantId,
      conversationId
    },
    orderBy: { createdAt: 'asc' }
  });
  res.json({ status: 'ok', data: msgs });
}

export async function sendMessage(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { conversationId } = req.params;
  const { body, direction, internalNote } = req.body;

  const msg = await prisma.crmMessage.create({
    data: {
      tenantId,
      conversationId,
      body,
      direction: direction || 'outbound',
      internalNote: internalNote || false,
      deliveryStatus: 'queued'
    }
  });

  await prisma.crmConversation.updateMany({
    where: { id: conversationId, tenantId },
    data: { lastMessageAt: new Date(), unreadCount: 0 }
  });

  res.json({ status: 'ok', data: msg });
}

export async function getChannelConnections(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;

  // Sync state dynamically if missing
  const defaultProviders = ['whatsapp_cloud_api', 'twilio_sms', 'manual_wa_link'];
  for (const p of defaultProviders) {
    const existing = await prisma.crmChannelConnection.findFirst({ where: { tenantId, provider: p }});
    if (!existing) {
       await prisma.crmChannelConnection.create({
          data: { tenantId, provider: p, status: 'not_configured' }
       });
    }
  }

  const conns = await prisma.crmChannelConnection.findMany({
    where: { tenantId }
  });

  res.json({ status: 'ok', data: conns });
}

export async function getCampaigns(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const campaigns = await prisma.crmCampaign.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: campaigns });
}

export async function createCampaign(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name, channel, segmentJson, templateId, scheduledAt } = req.body;
  const camp = await prisma.crmCampaign.create({
    data: { tenantId, name, channel, segmentJson, templateId, scheduledAt }
  });
  res.json({ status: 'ok', data: camp });
}

export async function updateCampaign(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { name, segmentJson, templateId, scheduledAt, status } = req.body;
  const camp = await prisma.crmCampaign.updateMany({
    where: { id, tenantId },
    data: { name, segmentJson, templateId, scheduledAt, status }
  });
  
  const updated = await prisma.crmCampaign.findFirst({ where: { id, tenantId } });
  res.json({ status: 'ok', data: updated });
}

export async function launchCampaign(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  
  const campaign = await prisma.crmCampaign.findFirst({
    where: { id, tenantId },
    include: { template: true }
  });
  
  if(!campaign || campaign.status !== 'draft') {
    return res.status(400).json({ error: 'Campanha inválida ou já iniciada' });
  }

  // MINIMUM EXECUTABLE LIMITATION: Find opted-in customers, create communication queue
  const customers = await prisma.customer.findMany({
    where: { tenantId, whatsappOptIn: true, deletedAt: null }
  });
  
  const templateBody = campaign.template?.body || "Mensagem padrão da campanha.";
  
  let sentCount = 0;
  for (const c of customers) {
    if (c.phone) {
       await prisma.communicationQueue.create({
          data: {
             tenantId,
             customerId: c.id,
             channel: campaign.channel,
             recipient: c.phone,
             renderedBody: templateBody.replace('{{name}}', c.name),
             status: 'queued',
             provider: 'mock'
          }
       });
       sentCount++;
    }
  }

  await prisma.crmCampaign.update({
    where: { id },
    data: { status: 'completed', sentCount }
  });
  
  const updated = await prisma.crmCampaign.findUnique({ where: { id } });
  res.json({ status: 'ok', data: updated });
}


export async function getQueueStatus(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;

  const queued = await prisma.communicationQueue.count({
    where: { tenantId, status: 'queued' }
  });
  const recent = await prisma.communicationQueue.count({
    where: { tenantId, sentAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });

  res.json({ status: 'ok', data: { queued, recentSent24h: recent } });
}

import { communicationDispatcher } from '../services/crm/communicationDispatcher';
import { getWorkerDiagnostics } from '../services/crm/communicationWorker';

export async function processQueueOnce(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const result = await communicationDispatcher.processQueue(tenantId);
  res.json({ status: 'ok', data: result });
}

export async function retryQueueItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const result = await communicationDispatcher.retryItem(req.params.id, tenantId);
  res.json({ status: 'ok', data: result });
}

export async function cancelQueueItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const result = await communicationDispatcher.cancelItem(req.params.id, tenantId);
  res.json({ status: 'ok', data: result });
}

export async function getDiagnostics(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  
  const workerStatus = getWorkerDiagnostics();
  
  const smsProvider = await prisma.crmChannelConnection.findFirst({ where: { tenantId, provider: 'twilio_sms' } });
  const waProvider = await prisma.crmChannelConnection.findFirst({ where: { tenantId, provider: 'whatsapp_cloud_api' } });
  
  const totalQueued = await prisma.communicationQueue.count({ where: { tenantId, status: 'queued' } });
  const totalFailed = await prisma.communicationQueue.count({ where: { tenantId, status: 'failed' } });
  
  res.json({
    status: 'ok', 
    data: {
      worker: workerStatus,
      providers: {
        sms: smsProvider ? smsProvider.status : 'not_configured',
        whatsapp: waProvider ? waProvider.status : 'not_configured'
      },
      stats: {
        queued: totalQueued,
        failed: totalFailed
      }
    }
  });
}


export async function getAutomations(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const autos = await prisma.crmAutomationWorkflow.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ status: 'ok', data: autos });
}

export async function createAutomation(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name, trigger, conditionsJson, actionsJson, active } = req.body;
  const auto = await prisma.crmAutomationWorkflow.create({
    data: { tenantId, name, trigger, conditionsJson, actionsJson, active }
  });
  res.json({ status: 'ok', data: auto });
}
