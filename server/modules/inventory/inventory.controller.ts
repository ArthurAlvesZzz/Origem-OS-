import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

export const movementSchema = z.object({
  body: z.object({
    productId: z.string(),
    type: z.enum(['Entrada', 'Saída', 'Ajuste', 'Perda', 'Consignado', 'Devolvido']),
    qty: z.number().min(0, "A quantidade deve ser positiva"),
    reason: z.string().optional(),
    unitCost: z.number().optional().default(0),
    lotId: z.string().optional(),
  })
});

export const getMovements = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const movements = await prisma.stockMovement.findMany({
    where: { 
      tenantId,
      deletedAt: null
    },
    include: {
      product: { select: { name: true, sku: true } },
      lot: { select: { code: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100 // limit to last 100 for now
  });

  // Map to domain format
  const mapped = movements.map(m => ({
    id: m.id,
    date: m.createdAt.toISOString(),
    product: m.product.name,
    productId: m.productId,
    type: m.movementType,
    qty: m.qty,
    reason: m.reason || '',
    lotCode: m.lot?.code
  }));

  res.json({ data: mapped });
};

export const createMovement = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).userId || (req as any).user?.id || 'system';
  const data = req.body;

  try {
    const movement = await prisma.$transaction(async (tx) => {
      // Fetch product to check stock rules
      const product = await tx.product.findUnique({
        where: { id: data.productId, tenantId }
      });

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      // Verify business rules for negative stock
      const businessRulesRaw = await tx.appSetting.findUnique({
        where: { tenantId_key: { tenantId, key: 'businessRules' } }
      });
      const businessRules = businessRulesRaw ? JSON.parse(businessRulesRaw.value) : { allowNegativeStock: false };

      if (data.type === 'out' && !businessRules.allowNegativeStock) {
        // Calculate current stock dynamically
        const aggregate = await tx.stockMovement.aggregate({
          _sum: { qty: true },
          where: { tenantId, productId: data.productId, deletedAt: null }
        });
        const currentStock = aggregate._sum.qty || 0;

        if (currentStock < data.qty) {
          throw new Error('Estoque insuficiente limit blocker');
        }
      }

      const created = await tx.stockMovement.create({
        data: {
          tenantId,
          userId,
          productId: data.productId,
          movementType: data.type,
          qty: data.qty,
          reason: data.reason || null,
          unitCost: data.unitCost || 0,
          lotId: data.lotId || null,
        },
        include: { product: true }
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          tableName: 'StockMovement',
          recordId: created.id,
          action: 'CREATE',
          newData: data
        }
      });

      return created;
    });

    res.status(201).json({
      data: {
        id: movement.id,
        date: movement.createdAt.toISOString(),
        product: movement.product.name,
        productId: movement.productId,
        type: movement.movementType,
        qty: movement.qty,
        reason: movement.reason || ''
      }
    });
  } catch (err: any) {
    if (err.message === 'Estoque insuficiente limit blocker') {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }
    if (err.message === 'Produto não encontrado') {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    throw err;
  }
};

export const getInventorySummary = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;

  // Real world: we'd compute from stock movements OR read from a materialized table.
  // We'll compute it dynamically for now since scale is small.
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      productId: true,
      movementType: true,
      qty: true,
    }
  });

  const balances: Record<string, number> = {};
  for (const m of movements) {
    if (balances[m.productId] === undefined) balances[m.productId] = 0;
    
    if (m.movementType === 'Entrada' || m.movementType === 'Devolvido') {
      balances[m.productId] += m.qty;
    } else if (m.movementType === 'Saída' || m.movementType === 'Perda' || m.movementType === 'Consignado') {
      balances[m.productId] -= m.qty;
    } else if (m.movementType === 'Ajuste') {
      balances[m.productId] = m.qty;
    }
  }

  // To map balances to actual products:
  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null, active: true },
    select: { id: true, name: true, sku: true, category: true, minStock: true, unitCost: true, unitPrice: true }
  });

  const summary = products.map(p => ({
    ...p,
    currentStock: balances[p.id] || 0
  }));

  res.json({ data: summary });
};

export const getLowStock = async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  const movements = await prisma.stockMovement.findMany({
    where: { tenantId, deletedAt: null },
    select: { productId: true, movementType: true, qty: true }
  });

  const balances: Record<string, number> = {};
  for (const m of movements) {
    if (balances[m.productId] === undefined) balances[m.productId] = 0;
    
    if (m.movementType === 'Entrada' || m.movementType === 'Devolvido') {
      balances[m.productId] += m.qty;
    } else if (m.movementType === 'Saída' || m.movementType === 'Perda' || m.movementType === 'Consignado') {
      balances[m.productId] -= m.qty;
    } else if (m.movementType === 'Ajuste') {
      balances[m.productId] = m.qty;
    }
  }

  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null, active: true },
  });

  const lowStock = products.map(p => ({
    product: p,
    currentStock: balances[p.id] || 0,
    minStock: p.minStock
  })).filter(x => x.currentStock <= x.minStock);

  res.json({ data: lowStock });
};
