import prisma from '../../lib/prisma';

export async function calculateCustomerScore(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    include: {
      orders: { orderBy: { orderDate: 'desc' } }
    }
  });

  if (!customer) return null;

  const orders = customer.orders;
  const now = new Date().getTime();

  let riskOfChurn = false;
  let purchaseFrequency = 0;
  
  if (orders.length > 0) {
    const primaryOrderDate = orders[0].orderDate.getTime();
    const daysSinceLastOrder = (now - primaryOrderDate) / (1000 * 60 * 60 * 24);
    
    // Simplistic heuristic: if they bought > 1 time, average days between.
    if (orders.length > 1) {
       const oldest = orders[orders.length - 1].orderDate.getTime();
       purchaseFrequency = ((primaryOrderDate - oldest) / (1000 * 60 * 60 * 24)) / (orders.length - 1);
       
       if (daysSinceLastOrder > (purchaseFrequency * 1.5)) {
          riskOfChurn = true;
       }
    } else {
       if (daysSinceLastOrder > 60) riskOfChurn = true;
    }
  }

  // NPS handling
  let mappedNps = customer.npsScore || 0;
  const recentNps = await prisma.customerFeedback.findFirst({
    where: { tenantId, customerId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (recentNps) {
    mappedNps = recentNps.score;
  }

  // Update customer
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      riskOfChurn,
      purchaseFrequency,
      npsScore: mappedNps || undefined
    }
  });

  return {
    riskOfChurn,
    purchaseFrequency,
    npsScore: mappedNps,
    orderCount: orders.length
  };
}
