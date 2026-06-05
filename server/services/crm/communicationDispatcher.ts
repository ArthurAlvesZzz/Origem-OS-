import prisma from '../../lib/prisma';
import { randomUUID } from 'crypto';

export class CommunicationDispatcher {
  private async claimItems(limit: number, tenantId?: string) {
    const workerId = randomUUID();
    const now = new Date();
    // A 5 minute window for processing, else it counts as stuck/failed.
    const lockedUntil = new Date(now.getTime() + 5 * 60 * 1000); 

    const filters: any = { 
      status: 'queued', 
      scheduledAt: { lte: now },
      OR: [
        { lockedUntil: null },
        { lockedUntil: { lt: now } }
      ]
    };
    if (tenantId) filters.tenantId = tenantId;

    // We can't do a limit inside updateMany directly in Prisma, 
    // so we find them first (with lock logic), then update them with their IDs.
    const itemsToClaim = await prisma.communicationQueue.findMany({
      where: filters,
      select: { id: true },
      take: limit,
      orderBy: { createdAt: 'asc' }
    });

    if (itemsToClaim.length === 0) return [];

    const ids = itemsToClaim.map(i => i.id);

    await prisma.communicationQueue.updateMany({
      where: {
        id: { in: ids },
        status: 'queued', // ensure they are still queued
      },
      data: {
        claimedBy: workerId,
        claimedAt: now,
        lockedUntil,
        status: 'sending'
      }
    });

    // Now retrieve the ones we successfully claimed
    const claimedItems = await prisma.communicationQueue.findMany({
      where: { id: { in: ids }, claimedBy: workerId, status: 'sending' },
      include: {
        customer: true,
        tenant: true
      }
    });

    return claimedItems;
  }

  /**
   * Procesa a fila e faz os despachos reias das comunicações agendadas
   */
  async processQueue(tenantId?: string) {
    const claimedItems = await this.claimItems(50, tenantId);

    if (!claimedItems.length) return { processed: 0, items: [] };

    const results = [];

    for (const item of claimedItems) {
      if (!item.customer) {
        await this.markSkipped(item.id, 'Cliente não encontrado');
        continue;
      }

      // Check opt-out limits
      if (item.channel === 'whatsapp' && !item.customer.whatsappOptIn) {
        await this.markSkipped(item.id, 'Cliente com opt-out no WhatsApp');
        continue;
      }

      if (item.channel === 'sms' && !item.customer.smsOptIn) {
        await this.markSkipped(item.id, 'Cliente com opt-out no SMS');
        continue;
      }

      try {
        let providerId = null;
        let finalStatus = 'sent';
        let errorMsg = null;

        // Try dispatching
        if (item.channel === 'whatsapp') {
          const provider = await this.getWhatsAppAdapter(item.tenantId);
          providerId = provider.name;
          const sendResult = await provider.sendMessage(item.customer.phone || item.customer.whatsapp || '', item.renderedBody);
          if (sendResult.status === 'failed') {
             finalStatus = 'failed';
             errorMsg = sendResult.error;
          }
        } else if (item.channel === 'sms') {
          const provider = await this.getSmsAdapter(item.tenantId);
          providerId = provider.name;
          const sendResult = await provider.sendMessage(item.customer.phone || '', item.renderedBody);
          if (sendResult.status === 'failed') {
             finalStatus = 'failed';
             errorMsg = sendResult.error;
          }
        } else {
          finalStatus = 'failed';
          errorMsg = 'Canal não suportado';
        }

        let newAttemptCount = (item.attemptCount || 0) + 1;
        
        // Retries if failed
        if (finalStatus === 'failed' && newAttemptCount < 3) { // max 3 attempts
           finalStatus = 'queued'; // push back to queue
        }

        const dataUpdate: any = {
          status: finalStatus,
          errorMessage: errorMsg ? String(errorMsg) : null,
          provider: providerId || 'mock',
          attemptCount: newAttemptCount,
          lockedUntil: null // unlock for next pass if retried
        };
        
        if (finalStatus === 'sent') {
           dataUpdate.sentAt = new Date();
           dataUpdate.errorMessage = null; // clear any past error 
        } else if (finalStatus === 'queued') {
           // delay retry by 1 minute * attempt count
           dataUpdate.scheduledAt = new Date(Date.now() + newAttemptCount * 60000);
        }

        await prisma.communicationQueue.update({
          where: { id: item.id },
          data: dataUpdate
        });
        
        // Se enviado via mock provider, também gerar CrmMessage para manter histórico
        if (finalStatus === 'sent') {
            await this.logMessage(item);
        }

        results.push({ id: item.id, status: finalStatus, error: errorMsg });

      } catch (err: any) {
        let newAttemptCount = (item.attemptCount || 0) + 1;
        let pStatus = 'failed';
        if (newAttemptCount < 3) {
           pStatus = 'queued';
        }
        await prisma.communicationQueue.update({
          where: { id: item.id },
          data: { 
            status: pStatus, 
            errorMessage: err?.message || 'Erro desconhecido', 
            attemptCount: newAttemptCount,
            lockedUntil: null,
            scheduledAt: pStatus === 'queued' ? new Date(Date.now() + newAttemptCount * 60000) : item.scheduledAt
          }
        });
        results.push({ id: item.id, status: pStatus, error: err?.message });
      }
    }

    return { processed: results.length, items: results };
  }

  private async markSkipped(itemId: string, reason: string) {
    await prisma.communicationQueue.update({
      where: { id: itemId },
      data: { status: 'cancelled', errorMessage: reason, lockedUntil: null }
    });
  }

  private async getWhatsAppAdapter(tenantId: string) {
    // In future this retrieves settings. For now returning mock
    return {
      name: 'mock',
      sendMessage: async (phone: string, text: string) => {
        if (!phone) return { status: 'failed', error: 'Missing phone' };
        return { status: 'sent', id: 'mock_' + Date.now() };
      }
    };
  }

  private async getSmsAdapter(tenantId: string) {
    return {
      name: 'mock',
      sendMessage: async (phone: string, text: string) => {
        if (!phone) return { status: 'failed', error: 'Missing phone' };
        return { status: 'sent', id: 'mock_' + Date.now() };
      }
    };
  }

  private async logMessage(item: any) {
     try {
       // Buscar ou criar conversa para o cliente
       let conv = await prisma.crmConversation.findFirst({
           where: { tenantId: item.tenantId, customerId: item.customerId }
       });
       if (!conv) {
           conv = await prisma.crmConversation.create({
               data: { tenantId: item.tenantId, customerId: item.customerId, channel: item.channel }
           });
       }
       await prisma.crmMessage.create({
           data: {
               tenantId: item.tenantId,
               conversationId: conv.id,
               direction: 'outbound',
               body: item.renderedBody,
               deliveryStatus: 'sent'
           }
       });
     } catch(e) {
         console.error('Failed to log message to timeline', e);
     }
  }
  async retryItem(id: string, tenantId: string) {
    const item = await prisma.communicationQueue.findFirst({ where: { id, tenantId } });
    if (!item) throw new Error('Item not found');
    if (item.status === 'sent') return { status: 'ok', message: 'Already sent' };
    
    await prisma.communicationQueue.update({
      where: { id },
      data: { status: 'queued', errorMessage: null }
    });
    return { status: 'ok' };
  }

  async cancelItem(id: string, tenantId: string) {
    await prisma.communicationQueue.updateMany({
      where: { id, tenantId },
      data: { status: 'cancelled' }
    });
    return { status: 'ok' };
  }
}

export const communicationDispatcher = new CommunicationDispatcher();
