import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../server/middlewares/requireAuth';
import { requirePermission } from '../../server/middlewares/requirePermission';
import { getMovements, createMovement } from '../../server/modules/inventory/inventory.controller';
import { errorHandler } from '../../server/middlewares/errorHandler';

vi.mock('../../server/lib/prisma', () => {
    const prismaMock = {
        appSetting: {
            findUnique: vi.fn(),
        },
        stockMovement: {
            findMany: vi.fn(),
            create: vi.fn(),
            aggregate: vi.fn(),
        },
        product: {
            findUnique: vi.fn(),
        },
        tenantUser: {
            findFirst: vi.fn(),
        },
        auditLog: {
            create: vi.fn()
        }
    };
    // @ts-ignore
    prismaMock.$transaction = vi.fn((cb) => cb(prismaMock));
    
    return {
        default: prismaMock,
        checkDbConnection: vi.fn()
    }
});

import prismaMockDefault from '../../server/lib/prisma';
const prismaMock = prismaMockDefault as Record<string, any>;

const mockAuth = (req: Request, res: Response, next: NextFunction) => {
  (req as any).user = { userId: 'user_1' };
  (req as any).tenantId = 'tenant_1';
  (req as any).userId = 'user_1';
  return next();
};

const app = express();
app.use(express.json());

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.post('/api/inventory/movements', mockAuth, requirePermission('inventory:write'), asyncHandler(createMovement));
app.use(errorHandler);

describe('Inventory Integrity Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        prismaMock.tenantUser.findFirst.mockResolvedValue({ status: 'active', role: { systemKey: 'admin', permissions: [] } });
    });

    it('should block negative stock if negative stock is not allowed', async () => {
        prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'prod_1', name: 'Product' });
        prismaMock.appSetting.findUnique.mockResolvedValueOnce({ value: JSON.stringify({ allowNegativeStock: false }) });
        prismaMock.stockMovement.aggregate.mockResolvedValueOnce({ _sum: { qty: 10 } });
        
        const res = await request(app)
            .post('/api/inventory/movements')
            .send({
                productId: 'prod_1',
                type: 'out',
                qty: 15,
                source: 'manual',
                reason: 'Venda'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Estoque insuficiente');
    });

    it('should allow negative stock if configuration permits', async () => {
        prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'prod_1', name: 'Product' });
        prismaMock.appSetting.findUnique.mockResolvedValueOnce({ value: JSON.stringify({ allowNegativeStock: true }) });
        prismaMock.stockMovement.create.mockResolvedValueOnce({ 
            id: 'mov_1', 
            createdAt: new Date(),
            product: { name: 'Product' },
            movementType: 'out',
            qty: 15,
            productId: 'prod_1',
            reason: 'Venda Especial'
        });

        const res = await request(app)
            .post('/api/inventory/movements')
            .send({
                productId: 'prod_1',
                type: 'out',
                qty: 15,
                source: 'manual',
                reason: 'Venda Especial'
            });

        expect(res.status).toBe(201);
    });
});
