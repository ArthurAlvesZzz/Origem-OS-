import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    type: z.string().optional(),
    name: z.string().min(1),
    legalName: z.string().optional(),
    documentType: z.string().optional(),
    document: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    whatsappOptIn: z.boolean().optional(),
    smsOptIn: z.boolean().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    status: z.string().optional(),
    defaultPaymentTermsDays: z.number().optional(),
    creditLimit: z.number().optional(),
    notes: z.string().optional(),
    tags: z.string().optional(),
    address: z.object({
      street: z.string().min(1),
      number: z.string(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().optional(),
      country: z.string().optional()
    }).optional()
  })
});

export const updateCustomerSchema = z.object({
  body: z.object({
    type: z.string().optional(),
    name: z.string().min(1).optional(),
    legalName: z.string().optional(),
    documentType: z.string().optional(),
    document: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    whatsappOptIn: z.boolean().optional(),
    smsOptIn: z.boolean().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    status: z.string().optional(),
    defaultPaymentTermsDays: z.number().optional(),
    creditLimit: z.number().optional(),
    notes: z.string().optional(),
    tags: z.string().optional()
  })
});

export const getCustomerProfile = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const customer = await prisma.customer.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      CrmActivity: { orderBy: { createdAt: 'desc' }, take: 20 },
      CrmDeal: { orderBy: { createdAt: 'desc' }, take: 5 },
      addresses: true
    }
  });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json({ status: 'ok', data: customer });
};

export const updateCustomerPreferences = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { whatsappOptIn, smsOptIn } = req.body;
  const customer = await prisma.customer.updateMany({
    where: { id, tenantId },
    data: { whatsappOptIn, smsOptIn }
  });
  res.json({ status: 'ok', data: { updated: true } });
};

export const addCustomerTag = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { tag } = req.body;
  const customer = await prisma.customer.findFirst({ where: { id, tenantId } });
  if (!customer) return res.status(404).json({ error: 'Not found' });
  
  const currentTags = customer.tags ? customer.tags.split(',').map(t => t.trim()) : [];
  if (!currentTags.includes(tag)) {
    currentTags.push(tag);
    await prisma.customer.update({
      where: { id },
      data: { tags: currentTags.join(',') }
    });
  }
  res.json({ status: 'ok', data: { tags: currentTags.join(',') } });
};

export const removeCustomerTag = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id, tag } = req.params;
  const customer = await prisma.customer.findFirst({ where: { id, tenantId } });
  if (!customer) return res.status(404).json({ error: 'Not found' });
  
  const currentTags = customer.tags ? customer.tags.split(',').map(t => t.trim()) : [];
  const newTags = currentTags.filter(t => t !== tag);
  await prisma.customer.update({
    where: { id },
    data: { tags: newTags.join(',') }
  });
  res.json({ status: 'ok', data: { tags: newTags.join(',') } });
};

export const getCustomers = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const customers = await prisma.customer.findMany({
    where: { tenantId, deletedAt: null },
    include: { addresses: true },
    orderBy: { name: 'asc' }
  });
  res.json({ data: customers });
};

export const getCustomerById = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { addresses: true }
  });

  if (!customer || customer.tenantId !== tenantId || customer.deletedAt) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  res.json({ data: customer });
};

export const createCustomer = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { address, ...data } = req.body;

  if (data.document && data.documentType !== 'none') {
    const existing = await prisma.customer.findFirst({
      where: { tenantId, document: data.document, deletedAt: null }
    });
    if (existing) {
      throw new Error(`Documento ${data.document} já está cadastrado para outro cliente.`);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        tenantId,
        createdBy: userId,
        ...data,
      }
    });

    if (address) {
      await tx.customerAddress.create({
        data: {
          customerId: created.id,
          isDefault: true,
          ...address
        }
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Customer',
        recordId: created.id,
        action: 'CREATE',
        newData: { type: created.type, name: created.name }
      }
    });

    return created;
  });

  const full = await prisma.customer.findUnique({
    where: { id: result.id },
    include: { addresses: true }
  });

  res.status(201).json({ data: full });
};

export const updateCustomer = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;
  const data = req.body;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.tenantId !== tenantId || customer.deletedAt) {
    throw new Error('Cliente não encontrado.');
  }

  if (data.document && data.documentType !== 'none' && data.document !== customer.document) {
    const existing = await prisma.customer.findFirst({
      where: { tenantId, document: data.document, deletedAt: null, id: { not: id } }
    });
    if (existing) {
      throw new Error(`Documento ${data.document} já está cadastrado para outro cliente.`);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.customer.update({
      where: { id },
      data
    });

    if ('whatsappOptIn' in data && data.whatsappOptIn === false) {
      await tx.communicationQueue.updateMany({
        where: { customerId: id, channel: 'whatsapp', status: { in: ['queued', 'draft'] } },
        data: { status: 'cancelled', errorMessage: 'Cliente cancelou opt-in' }
      });
    }

    if ('smsOptIn' in data && data.smsOptIn === false) {
      await tx.communicationQueue.updateMany({
        where: { customerId: id, channel: 'sms', status: { in: ['queued', 'draft'] } },
        data: { status: 'cancelled', errorMessage: 'Cliente cancelou opt-in' }
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Customer',
        recordId: id,
        action: 'UPDATE',
        newData: data
      }
    });

    return updated;
  });

  const full = await prisma.customer.findUnique({
    where: { id: result.id },
    include: { addresses: true }
  });

  res.json({ data: full });
};

export const exportCustomerData = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const id = req.params.id;
  
  const customer = await prisma.customer.findFirst({
    where: { id, tenantId },
    include: {
      orders: true,
      paymentIntents: true,
      CrmConversation: true
    }
  });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: (req as any).user?.id || 'system',
      action: 'customer_data_exported',
      tableName: 'customer',
      recordId: customer.id,
      newData: { exportDate: new Date() }
    }
  });

  res.json({ status: 'ok', data: customer });
};

export const requestCustomerErasure = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const id = req.params.id;
  const customer = await prisma.customer.findFirst({ where: { id, tenantId } });
  
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  await prisma.customer.update({
    where: { id },
    data: { 
      status: 'erasure_requested', 
      whatsappOptIn: false, 
      smsOptIn: false 
    }
  });

  await prisma.communicationQueue.updateMany({
    where: { customerId: id, status: { in: ['queued', 'draft'] } },
    data: { status: 'cancelled', errorMessage: 'Right to erasure requested' }
  });

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: (req as any).user?.id || 'system',
      action: 'customer_erasure_requested',
      tableName: 'customer',
      recordId: customer.id,
      newData: { requestDate: new Date() }
    }
  });

  res.json({ status: 'ok', message: 'Erasure requested logically.' });
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user.id;
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.tenantId !== tenantId || customer.deletedAt) {
    throw new Error('Cliente não encontrado.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        tableName: 'Customer',
        recordId: id,
        action: 'DELETE'
      }
    });
  });

  res.json({ success: true });
};

export const getCustomerBalance = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer || customer.tenantId !== tenantId) {
    throw new Error('Cliente não encontrado');
  }

  // Calculate balance based on unpaid sales to this customer and unpaid consignments
  // Actually, we can check orders
  const orders = await prisma.order.findMany({
    where: { tenantId, customerId: id, status: { notIn: ['cancelled'] }, paymentStatus: 'pending' }
  });
  const openReceivables = orders.reduce((acc, o) => acc + o.total, 0); // Simplified

  // Unpaid finance transactions
  // Also we might have some direct financial entries (type Receita, source 'order' or whatever)
  // Let's sum pending 'Receita' linking this customer. Need a link in financial.
  // Wait, our financial transaction doesn't have a direct customerId link without orderId.
  // Oh, wait, the openReceivables calculation is fine for orders.
  // What about consignments?
  const consignments = await prisma.consignment.findMany({
    where: { tenantId, partnerId: id, status: { in: ['open', 'partially_settled'] }, deletedAt: null },
    include: { items: true }
  });
  
  let consignmentBalance = 0;
  for (const c of consignments) {
    for (const item of c.items) {
       const qty = item.sentQty - item.soldQty - item.returnedQty - item.lostQty;
       if (qty > 0) {
         consignmentBalance += qty * item.unitPrice;
       }
    }
  }

  res.json({ 
    data: {
      openReceivables,
      consignmentBalance,
      totalExposure: openReceivables + consignmentBalance
    }
  });
};

export const getCustomerActivity = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  
  // Recent orders
  const orders = await prisma.order.findMany({
    where: { tenantId, customerId: id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Recent consignments
  const consignments = await prisma.consignment.findMany({
    where: { tenantId, partnerId: id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Recent CRM Activities
  const crmActivities = await prisma.crmActivity.findMany({
    where: { tenantId, customerId: id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Recent Deals
  const deals = await prisma.crmDeal.findMany({
    where: { tenantId, customerId: id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Merge and sort
  const act1 = orders.map(o => ({
    id: o.id,
    type: 'pedido',
    date: o.orderDate,
    description: `Pedido ${o.id.split('-')[0]} - R$ ${o.total.toFixed(2)} (${o.paymentStatus})`
  }));
  const act2 = consignments.map(c => ({
    id: c.id,
    type: 'consignacao',
    date: c.date,
    description: `Remessa ${c.id.split('-')[0]} - R$ ${c.totalValue.toFixed(2)} (${c.status})`
  }));
  const act3 = crmActivities.map(c => ({
    id: c.id,
    type: 'atividade_crm',
    date: c.createdAt,
    description: `Atividade: ${c.type} - ${c.title}`
  }));
  const act4 = deals.map(d => ({
    id: d.id,
    type: 'oportunidade',
    date: d.createdAt,
    description: `Negócio: ${d.title} (R$ ${d.value.toFixed(2)}) - ${d.status}`
  }));

  const activity = [...act1, ...act2, ...act3, ...act4].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({ data: activity });
};
