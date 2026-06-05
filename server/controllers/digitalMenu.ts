import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { PaymentProviderAdapter } from '../services/paymentProvider';

export const getConfig = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  const config = await prisma.digitalMenuConfig.findUnique({ where: { tenantId } });
  res.json(config);
};

export const updateConfig = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  const data = req.body;
  let config = await prisma.digitalMenuConfig.findUnique({ where: { tenantId } });
  if (config) {
    config = await prisma.digitalMenuConfig.update({
      where: { tenantId },
      data: {
        slug: data.slug,
        publicName: data.publicName,
        logoUrl: data.logoUrl,
        coverUrl: data.coverUrl,
        description: data.description,
        whatsapp: data.whatsapp,
        isOpen: data.isOpen,
        closedMessage: data.closedMessage,
        allowOrdersOutsideHours: data.allowOrdersOutsideHours,
        acceptsPickup: data.acceptsPickup,
        acceptsDelivery: data.acceptsDelivery,
        deliveryFee: data.deliveryFee,
        minimumOrder: data.minimumOrder,
        estimatedPrepMinutes: data.estimatedPrepMinutes,
        estimatedDeliveryMinutes: data.estimatedDeliveryMinutes,
        paymentMethodsJson: data.paymentMethodsJson ? JSON.parse(data.paymentMethodsJson) : '[]', 
        openingHoursJson: data.openingHoursJson,
        deliveryZonesJson: data.deliveryZonesJson,
        platformFeeType: data.platformFeeType,
        platformFeeValue: data.platformFeeValue,
        paymentProvider: data.paymentProvider,
        pixKeyManual: data.pixKeyManual,
      } as any
    });
  } else {
    config = await prisma.digitalMenuConfig.create({
      data: {
        tenantId,
        slug: data.slug || `menu-${Date.now()}`,
        publicName: data.publicName || 'Novo Menu',
        ...data,
      }
    });
  }
  res.json(config);
};

export const getCategories = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  const categories = await prisma.digitalMenuCategory.findMany({
    where: { tenantId },
    orderBy: { order: 'asc' }
  });
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  const category = await prisma.digitalMenuCategory.create({
    data: { tenantId, ...req.body }
  });
  res.json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tenantId, id: _, createdAt, updatedAt, ...updates } = req.body;
  const category = await prisma.digitalMenuCategory.update({
    where: { id },
    data: updates
  });
  res.json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.digitalMenuCategory.delete({ where: { id } });
  res.json({ success: true });
};

export const getItems = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  const { categoryId } = req.query;
  const where: any = { tenantId };
  if (categoryId) {
    where.categoryId = categoryId;
  }
  const items = await prisma.digitalMenuItem.findMany({ where });
  res.json(items);
};

export const createItem = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  const item = await prisma.digitalMenuItem.create({
    data: { tenantId, ...req.body }
  });
  res.json(item);
};

export const updateItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tenantId, id: _, createdAt, updatedAt, category, product, ...updates } = req.body;
  const item = await prisma.digitalMenuItem.update({
    where: { id },
    data: updates
  });
  res.json(item);
};

export const deleteItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.digitalMenuItem.delete({ where: { id } });
  res.json({ success: true });
};

// MODIFIERS

export const getModifiers = async (req: Request, res: Response) => {
  const { itemId } = req.query;
  const groups = await prisma.digitalMenuModifierGroup.findMany({
      where: { itemId: itemId as string },
      orderBy: { order: 'asc' },
      include: {
          options: {
              orderBy: { order: 'asc' }
          }
      }
  });
  res.json(groups);
}

export const createModifierGroup = async (req: Request, res: Response) => {
   const tenantId = (req as any).user?.tenantId;
   const group = await prisma.digitalMenuModifierGroup.create({
       data: { tenantId, ...req.body }
   });
   res.json(group);
}

export const updateModifierGroup = async (req: Request, res: Response) => {
   const { id } = req.params;
   const { tenantId, id: _, createdAt, updatedAt, options, ...updates } = req.body;
   const group = await prisma.digitalMenuModifierGroup.update({
       where: { id },
       data: updates
   });
   res.json(group);
}

export const deleteModifierGroup = async (req: Request, res: Response) => {
   const { id } = req.params;
   await prisma.digitalMenuModifierGroup.delete({ where: { id } });
   res.json({ success: true });
}

export const createModifierOption = async (req: Request, res: Response) => {
   const tenantId = (req as any).user?.tenantId;
   const option = await prisma.digitalMenuModifierOption.create({
       data: { tenantId, ...req.body }
   });
   res.json(option);
}

export const updateModifierOption = async (req: Request, res: Response) => {
   const { id } = req.params;
   const { tenantId, id: _, createdAt, updatedAt, ...updates } = req.body;
   const option = await prisma.digitalMenuModifierOption.update({
       where: { id },
       data: updates
   });
   res.json(option);
}

export const deleteModifierOption = async (req: Request, res: Response) => {
   const { id } = req.params;
   await prisma.digitalMenuModifierOption.delete({ where: { id } });
   res.json({ success: true });
}

export const getOrders = async (req: Request, res: Response) => {
  const tenantId = (req as any).user?.tenantId;
  const orders = await prisma.order.findMany({
    where: { tenantId, channel: 'digital_menu' },
    orderBy: { createdAt: 'desc' },
    include: { items: true, customer: true }
  });
  res.json(orders);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const tenantId = (req as any).user?.tenantId;

  const order = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
          where: { id },
          include: { items: true }
      });

      if (!currentOrder) throw new Error('Pedido não encontrado');
      if (currentOrder.status === 'cancelled' && status !== 'cancelled') {
         throw new Error('Não é possível reabrir um pedido cancelado');
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status }
      });

      if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
          // Revert stock
          for (const item of currentOrder.items) {
             if (item.productId) {
                  await tx.stockMovement.create({
                      data: {
                          tenantId,
                          productId: item.productId,
                          movementType: 'Entrada',
                          qty: item.qty,
                          unitCost: item.unitCost || 0,
                          reason: 'Estorno Cancelamento Digital',
                          referenceType: 'order_cancellation',
                          referenceId: currentOrder.id,
                          userId: (req as any).user?.id || 'system'
                      }
                  });
             }
          }
      }

      return updated;
  });

  res.json(order);
};

// PUBLIC ROUTES

export const getPublicMenu = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const config = await prisma.digitalMenuConfig.findUnique({
    where: { slug }
  });
  
  if (!config) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  const categories = await prisma.digitalMenuCategory.findMany({
    where: { tenantId: config.tenantId },
    orderBy: { order: 'asc' },
    include: {
      items: {
        where: { active: true },
        include: {
          modifierGroups: {
             where: { active: true },
             orderBy: { order: 'asc' },
             include: {
                 options: {
                     where: { active: true },
                     orderBy: { order: 'asc' }
                 }
             }
          }
        }
      }
    }
  });

  res.json({ config, categories });
};

export const createPublicOrder = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const payload = req.body;
  
  const config = await prisma.digitalMenuConfig.findUnique({
    where: { slug }
  });
  
  if (!config) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  // Validate store hours
  if (!config.isOpen && !config.allowOrdersOutsideHours && process.env.NODE_ENV === 'production') {
     return res.status(400).json({ error: config.closedMessage || 'A loja está fechada no momento' });
  }

  // Calculate totals and validate
  let total = 0;
  const orderItemsData: any[] = [];
  
  for (const reqItem of payload.items) {
    const dbItem = await prisma.digitalMenuItem.findUnique({
      where: { id: reqItem.itemId }
    });
    if (dbItem && dbItem.active) {
      let itemPrice = dbItem.price;

      // add modifiers price if passed
      if (reqItem.modifiers && Array.isArray(reqItem.modifiers)) {
          // This allows mock to work without strict db checking, but we should validate in prod
          for (const mod of reqItem.modifiers) {
              if (mod.price) itemPrice += mod.price;
          }
      }

      const lineTotal = itemPrice * reqItem.qty;
      total += lineTotal;
      orderItemsData.push({
        productId: dbItem.productId || undefined,
        name: dbItem.name,
        qty: reqItem.qty,
        unitPrice: itemPrice,
        lineTotal,
        notes: reqItem.notes,
        modifiersJson: reqItem.modifiers ? JSON.stringify(reqItem.modifiers) : null
      });
    }
  }

  if (payload.deliveryMethod === 'delivery') {
      if (config.minimumOrder && total < config.minimumOrder) {
          return res.status(400).json({ error: `Valor mínimo para entrega é R$ ${config.minimumOrder.toFixed(2)}` });
      }

      let reqDeliveryFee = config.deliveryFee;
      // if zone sent, use zone fee
      if (payload.deliveryZone && config.deliveryZonesJson) {
           try {
             const zones = JSON.parse(config.deliveryZonesJson);
             const matched = zones.find((z:any)=> z.name === payload.deliveryZone && z.active);
             if (matched) {
                 reqDeliveryFee = matched.fee;
                 if (matched.minimumOrder && total < matched.minimumOrder) {
                     return res.status(400).json({ error: `Valor mínimo para entrega nesta área é R$ ${matched.minimumOrder.toFixed(2)}` });
                 }
             }
           } catch(e) {}
      }
      total += reqDeliveryFee;
  }

  let customerId = null;
  
  if (payload.customerPhone) {
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: config.tenantId,
        phone: payload.customerPhone
      }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: config.tenantId,
          name: payload.customerName,
          phone: payload.customerPhone,
          type: 'b2c'
        }
      });
    }
    customerId = customer.id;
  }
  
  let trackingNumber = '';
  let order = null;
  let retries = 0;
  const maxRetries = 3;

  while (!order && retries < maxRetries) {
    // Generate a random 12-character uppercase tracking number (48 bits entropy)
    trackingNumber = crypto.randomBytes(6).toString('hex').toUpperCase();

    try {
        order = await prisma.$transaction(async (tx) => {
          const newOrder = await tx.order.create({
            data: {
              tenantId: config.tenantId,
              customerId,
              customerName: payload.customerName,
              subtotal: total,
              total: total,
              channel: 'digital_menu',
              trackingNumber,
              paymentMethod: payload.paymentMethod,
              paymentStatus: 'pending',
              status: 'received',
              notes: payload.notes,
              items: {
                create: orderItemsData
              }
            }
          });
          
          for (const item of orderItemsData) {
              if (item.productId) {
                  await tx.stockMovement.create({
                      data: {
                          tenantId: config.tenantId,
                          productId: item.productId,
                          movementType: 'Saída',
                          qty: item.qty,
                          unitCost: 0,
                          reason: 'Venda Cardápio Digital',
                          referenceType: 'order',
                          referenceId: newOrder.id,
                          userId: 'system'
                      }
                  });
              }
          }
          return newOrder;
        });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('trackingNumber')) {
        // Unique constraint violation, retry
        retries++;
      } else {
        throw e;
      }
    }
  }

  if (!order) {
     return res.status(500).json({ error: 'Failed to generate a unique tracking number after multiple attempts' });
  }

  // Delegate payment intent creation to adapter
  const paymentIntentResult = await PaymentProviderAdapter.createIntent(
    config.paymentProvider || 'manual_pix',
    {
      tenantId: config.tenantId,
      slug: slug,
      orderId: order.id,
      trackingNumber: order.trackingNumber,
      total,
      paymentMethod: payload.paymentMethod,
      customerName: payload.customerName,
      platformFeeType: config.platformFeeType,
      platformFeeValue: config.platformFeeValue,
      pixKeyManual: config.pixKeyManual,
      items: orderItemsData
    }
  );

  let platformFeeAmount = 0;
  if (config.platformFeeType === 'fixed') {
    platformFeeAmount = config.platformFeeValue || 0;
  } else if (config.platformFeeType === 'percent') {
    platformFeeAmount = (total * (config.platformFeeValue || 0)) / 100;
  }

  // Create real PaymentIntent in DB
  await prisma.paymentIntent.create({
    data: {
      tenantId: config.tenantId,
      customerId,
      orderId: order.id,
      amount: total,
      platformFeeAmount,
      currency: 'BRL',
      status: 'pending',
      provider: config.paymentProvider || 'manual',
      providerIntentId: paymentIntentResult.paymentIntentId,
      checkoutUrl: paymentIntentResult.checkoutUrl,
      pixQrCode: paymentIntentResult.pixQrCodeText || paymentIntentResult.pixQrCode
    }
  });

  res.json({ 
    orderId: order.id,
    trackingNumber: order.trackingNumber, 
    total, 
    paymentIntentId: paymentIntentResult.paymentIntentId,
    pixQrCode: paymentIntentResult.pixQrCodeText || paymentIntentResult.pixQrCode, 
    checkoutUrl: paymentIntentResult.checkoutUrl
  });
};

export const getPublicOrder = async (req: Request, res: Response) => {
  const { slug, id } = req.params;
  const config = await prisma.digitalMenuConfig.findUnique({
    where: { slug }
  });
  
  if (!config) {
    return res.status(404).json({ error: 'Menu not found' });
  }

  const isProd = process.env.NODE_ENV === 'production';

  const order = await prisma.order.findFirst({
    where: { 
      // In production, search strictly by trackingNumber. Allow fallback to id in dev/mock.
      ...(isProd ? { trackingNumber: id } : { OR: [{ id }, { trackingNumber: id }] }),
      tenantId: config.tenantId 
    },
    include: { items: true }
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
};
