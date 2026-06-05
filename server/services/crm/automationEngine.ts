import prisma from '../../lib/prisma';

export async function processInboundAutomations(tenantId: string, customerId: string, messageBody: string) {
  if (!messageBody) return;
  const lowerBody = messageBody.toLowerCase();

  const customer = await prisma.customer.findFirst({ where: { id: customerId }});
  if (!customer) return;

  // Keyword: BOLO -> SpecialOrder + Deal + Activity
  if (lowerBody.includes('bolo')) {
    // find/create Encomendas pipeline
    let p = await prisma.crmPipeline.findFirst({ where: { tenantId, type: 'events' }});
    if (!p) {
        p = await prisma.crmPipeline.findFirst({ where: { tenantId, name: 'Encomendas' }});
    }
    if (!p) {
        p = await prisma.crmPipeline.findFirst({ where: { tenantId }});
    }
    if(p) {
        const stage = await prisma.crmStage.findFirst({ where: { pipelineId: p.id }, orderBy: { order: 'asc' }});
        if(stage) {
            const deal = await prisma.crmDeal.create({
                data: {
                    tenantId,
                    pipelineId: p.id,
                    stageId: stage.id,
                    customerId,
                    title: 'Orçamento de Bolo (Automação)',
                    priority: 'high',
                }
            });
            await prisma.specialOrder.create({
                data: {
                    tenantId, customerId, dealId: deal.id, theme: 'Bolo via Automação', status: 'quote_requested'
                }
            });
            await prisma.crmActivity.create({
                data: {
                    tenantId, dealId: deal.id, customerId, type: 'whatsapp', 
                    title: 'Responder pedido de bolo no WhatsApp', dueAt: new Date(Date.now() + 1000 * 60 * 15)
                }
            });
            return; // stop here so we don't trigger both
        }
    }
  }

  // Keyword: EVENTO -> B2B Deal
  if (lowerBody.includes('evento')) {
      let pb2b = await prisma.crmPipeline.findFirst({ where: { tenantId, type: 'b2b' }});
      if (!pb2b) {
          pb2b = await prisma.crmPipeline.findFirst({ where: { tenantId }});
      }
      if(pb2b) {
          const stage = await prisma.crmStage.findFirst({ where: { pipelineId: pb2b.id }, orderBy: { order: 'asc' }});
          if(stage) {
              const deal = await prisma.crmDeal.create({
                  data: {
                      tenantId,
                      pipelineId: pb2b.id,
                      stageId: stage.id,
                      customerId,
                      title: 'Coffee Break (Automação)',
                      priority: 'high',
                  }
              });
              await prisma.crmActivity.create({
                   data: {
                       tenantId, dealId: deal.id, customerId, type: 'task', 
                       title: 'Ligar para fechar detalhes do evento', dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
                   }
               });
          }
      }
  }
}
