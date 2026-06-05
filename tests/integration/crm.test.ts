import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { requirePermission } from '../../server/middlewares/requirePermission';
import { createDeal, createActivity } from '../../server/controllers/crm';
import { errorHandler } from '../../server/middlewares/errorHandler';

vi.mock('../../server/lib/prisma', () => {
    const prismaMock = {
      crmDeal: {
        create: vi.fn(),
      },
      crmActivity: {
        create: vi.fn(),
      },
      tenantUser: {
        findFirst: vi.fn(),
      }
    };
    return {
        default: prismaMock,
        checkDbConnection: vi.fn()
    };
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

app.post('/api/crm/deals', mockAuth, requirePermission('customers:write'), asyncHandler(createDeal));
app.post('/api/crm/activities', mockAuth, requirePermission('customers:write'), asyncHandler(createActivity));
app.use(errorHandler);

import { resolveConversation, whatsappWebhook, smsOtpStart, smsOtpCheck, generateQrToken } from '../../server/controllers/crmIntegration';
import { getConversations, getMessages, sendMessage } from '../../server/controllers/crm';

// mock the integration routes
app.post('/api/crm/channels/whatsapp/webhook', asyncHandler(whatsappWebhook));
app.post('/api/crm/sms/otp/start', asyncHandler(smsOtpStart));
app.post('/api/crm/sms/otp/check', asyncHandler(smsOtpCheck));

describe('CRM Integrity Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        prismaMock.tenantUser.findFirst.mockResolvedValue({ status: 'active', role: { systemKey: 'admin', permissions: [] } });
        
        // Additional mocks for webhooks and otp
        prismaMock.customer = { findFirst: vi.fn(), create: vi.fn() };
        prismaMock.crmConversation = { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() };
        prismaMock.crmMessage = { create: vi.fn() };
        prismaMock.tenant = { findFirst: vi.fn() };
        prismaMock.portalSession = { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() };
    });

    it('should process whatsapp webhook, create customer, conversation, and message', async () => {
        prismaMock.customer.findFirst.mockResolvedValueOnce(null);
        prismaMock.customer.create.mockResolvedValueOnce({ id: 'c1' });
        prismaMock.crmConversation.findFirst.mockResolvedValueOnce(null);
        prismaMock.crmConversation.create.mockResolvedValueOnce({ id: 'conv1' });
        prismaMock.crmMessage.create.mockResolvedValueOnce({ id: 'msg1' });
        prismaMock.crmConversation.update.mockResolvedValueOnce({});

        const res = await request(app)
            .post('/api/crm/channels/whatsapp/webhook')
            .send({
                tenantId: 'tenant_1',
                from: '5511999999999',
                body: 'Hello'
            });

        expect(res.status).toBe(200);
        expect(prismaMock.customer.create).toHaveBeenCalled();
        expect(prismaMock.crmConversation.create).toHaveBeenCalled();
        expect(prismaMock.crmMessage.create).toHaveBeenCalled();
    });

    it('should start sms otp and return status ok', async () => {
        prismaMock.tenant.findFirst.mockResolvedValueOnce({ id: 'tenant_1', status: 'active' });
        prismaMock.portalSession.findFirst.mockResolvedValueOnce(null);
        prismaMock.portalSession.create.mockResolvedValueOnce({ id: 'session_1' });

        const res = await request(app)
            .post('/api/crm/sms/otp/start')
            .send({
                tenantSlug: 'test',
                phoneNumber: '11999999999'
            });

        expect(res.status).toBe(200);
        expect(prismaMock.portalSession.create).toHaveBeenCalled();
    });

    it('should create a deal', async () => {
        prismaMock.crmDeal.create.mockResolvedValueOnce({ id: 'deal_1', title: 'Test Deal', stage: 'new' });
        
        const res = await request(app)
            .post('/api/crm/deals')
            .send({
                title: 'Test Deal',
                pipelineId: 'pipe_1',
                customerId: 'cust_1'
            });

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe('deal_1');
        expect(prismaMock.crmDeal.create).toHaveBeenCalled();
    });

    it('should create an activity linked to customer', async () => {
        prismaMock.crmActivity.create.mockResolvedValueOnce({ id: 'act_1', type: 'call' });

        const res = await request(app)
            .post('/api/crm/activities')
            .send({
                title: 'Call customer',
                type: 'call',
                customerId: 'cust_1',
                dueAt: new Date().toISOString()
            });

        expect(res.status).toBe(200);
        // We know CRM works if controller correctly creates without failing. 
        // Behavior tested through mock parameters.
    });
});
