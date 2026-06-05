import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

vi.mock('../../server/lib/prisma', () => {
    const prismaMock = {
        tenant: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
        user: { findUnique: vi.fn(), create: vi.fn() },
        role: { create: vi.fn() },
        tenantUser: { create: vi.fn(), findFirst: vi.fn() },
        platformPlan: { findUnique: vi.fn(), findMany: vi.fn() },
        billingInvoice: { findMany: vi.fn() },
        $transaction: vi.fn((cb) => cb(prismaMock)),
    };
    return {
        default: prismaMock,
        __esModule: true
    };
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const validToken = jwt.sign({ userId: 'u1', tenantId: 't1', role: 'owner' }, JWT_SECRET, { expiresIn: '1h' });

const adminToken = jwt.sign({ userId: 'u2', tenantId: 't2', role: 'owner' }, JWT_SECRET, { expiresIn: '1h' });
import prisma from '../../server/lib/prisma';
const prismaMock = prisma as any;


// We need an app instance to test routes
const app = express();
app.use(express.json());

// Fake middlewares
import { requireAuth } from '../../server/middlewares/requireAuth';
import { requirePermission } from '../../server/middlewares/requirePermission';
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next);

// Controllers
import * as platformSignup from '../../server/controllers/platformSignup';
import * as platformBilling from '../../server/controllers/platformBilling';
import * as platformAdmin from '../../server/controllers/platformAdmin';

app.post('/api/platform/signup', asyncHandler(platformSignup.signup));
app.post('/api/platform/trial/start', requireAuth, asyncHandler(platformSignup.startTrial));
app.post('/api/platform/billing/checkout', requireAuth, asyncHandler(platformBilling.checkout));
app.get('/api/platform/billing/subscription', requireAuth, asyncHandler(platformBilling.getSubscription));
app.get('/api/platform/admin/metrics', requireAuth, requirePermission('platform:admin'), asyncHandler(platformAdmin.getPlatformMetrics));

describe('Phase 7A: Monetization & SaaS Billing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        prismaMock.tenantUser.findFirst.mockImplementation(async (args: any) => {
            if (args?.where?.tenantId === 't2') {
                return { status: 'active', role: { permissions: [{ permissionKey: 'platform:admin' }] } };
            }
            return { status: 'active', role: { permissions: [{ permissionKey: 'customers:read' }] } };
        });
    });
    
    it('signup creates tenant, owner, roles and returns token', async () => {
        prismaMock.tenant.findFirst.mockResolvedValueOnce(null);
        prismaMock.user.findUnique.mockResolvedValueOnce(null);
        
        prismaMock.tenant.create.mockResolvedValueOnce({ id: 't99' });
        prismaMock.user.create.mockResolvedValueOnce({ id: 'u99' });
        prismaMock.role.create.mockResolvedValueOnce({ id: 'r99' });
        prismaMock.tenantUser.create.mockResolvedValueOnce({});
        
        const res = await request(app).post('/api/platform/signup').send({
            companyName: 'Test Inc',
            document: '123456789',
            name: 'John Test',
            email: 'test@example.com',
            password: 'pass'
        });
        
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.tenantId).toBe('t99');
        
        expect(prismaMock.tenant.create).toHaveBeenCalled();
        expect(prismaMock.user.create).toHaveBeenCalled();
    });
    
    it('trial starts correctly', async () => {
        prismaMock.tenant.update.mockResolvedValueOnce({});
        
        const res = await request(app)
            .post('/api/platform/trial/start')
            .set('Authorization', `Bearer ${validToken}`)
            .send();
            
        expect(res.status).toBe(200);
        expect(prismaMock.tenant.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ billingStatus: 'trialing' })
            })
        );
    });
    
    it('checkout process upgrades plan', async () => {
        prismaMock.tenant.findUnique.mockResolvedValueOnce({ id: 't1' });
        prismaMock.platformPlan.findUnique.mockResolvedValueOnce({ id: 'p1', name: 'Pro' });
        prismaMock.tenant.update.mockResolvedValue({});
        
        const res = await request(app)
            .post('/api/platform/billing/checkout')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ planId: 'p1' });
            
        expect(res.status).toBe(200);
        expect(prismaMock.tenant.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ platformPlanId: 'p1', billingStatus: 'active' })
            })
        );
    });
    
    it('platform:admin accesses panel', async () => {
        prismaMock.tenant.findMany.mockResolvedValueOnce([]);
        
        const res = await request(app)
            .get('/api/platform/admin/metrics')
            .set('Authorization', `Bearer ${adminToken}`);
            
        expect(res.status).toBe(200);
        expect(res.body.data.mrr).toBe(0);
    });
    
    it('user common denied from platform admin panel', async () => {
        const res = await request(app)
            .get('/api/platform/admin/metrics')
            .set('Authorization', `Bearer ${validToken}`);
            
        expect(res.status).toBe(403);
    });
});
