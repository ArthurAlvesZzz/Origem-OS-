import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { requirePermission } from '../../server/middlewares/requirePermission';
import { 
  getCampaigns, createCampaign, launchCampaign, 
  getConversations, createConversation, sendMessage, getMessages,
  assignConversation, updateConversation
} from '../../server/controllers/crm';
import { 
  trackQrScan, whatsappWebhook, smsOtpStart, smsOtpCheck, getPortalSession, resolveConversation, archiveConversation
} from '../../server/controllers/crmIntegration';
import { getCustomerProfile, exportCustomerData, requestCustomerErasure } from '../../server/modules/customers/customers.controller';
import { getQueueStatus, processQueueOnce, getDiagnostics } from '../../server/controllers/crm';
import { saveWhatsappSetup, saveSmsSetup } from '../../server/controllers/crmIntegration';
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[IntegrationTest Error]:', err);
  res.status(500).json({ error: String(err) });
};

const app = express();
app.use(express.json());

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Mock prisma and auth
vi.mock('../../server/lib/prisma', () => {
    const prismaMock = {
      crmCampaign: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
      customer: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
      communicationQueue: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
      crmTrackingLink: { findUnique: vi.fn(), update: vi.fn() },
      crmActivity: { create: vi.fn() },
      tenantUser: { findFirst: vi.fn() },
      crmConversation: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
      crmMessage: { create: vi.fn(), findMany: vi.fn() },
      crmChannelConnection: { findFirst: vi.fn(), deleteMany: vi.fn(), create: vi.fn() },
      auditLog: { create: vi.fn() },
      activityLog: { create: vi.fn() },
      tenant: { findFirst: vi.fn() },
      portalSession: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }
    };
    return { default: prismaMock, checkDbConnection: vi.fn() };
});

import prismaMockDefault from '../../server/lib/prisma';
const prismaMock = prismaMockDefault as Record<string, any>;

const mockAuth = (permissions: string[]) => (req: Request, res: Response, next: NextFunction) => {
  (req as any).user = { userId: 'user_1' };
  (req as any).tenantId = 'tenant_1';
  (req as any).userId = 'user_1';
  res.locals.permissions = permissions;
  const requirePermMock = (required: string) => {
    if (!permissions.includes(required) && !permissions.includes('admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  };
  (req as any).checkPerm = requirePermMock;
  return next();
};

const withPerm = (perm: string) => (req: Request, res: Response, next: NextFunction) => {
  const check = (req as any).checkPerm(perm);
  if (check) return; // already sent 403
  next();
}

app.post('/api/crm/campaigns/:id/launch', mockAuth(['crm:campaigns']), withPerm('crm:campaigns'), asyncHandler(launchCampaign));
app.post('/api/crm/conversations', mockAuth(['crm:write']), withPerm('crm:write'), asyncHandler(createConversation));
app.post('/api/crm/conversations/:id/assign', mockAuth(['crm:write']), withPerm('crm:write'), asyncHandler(assignConversation));
app.post('/api/crm/conversations/:conversationId/messages', mockAuth(['crm:send_message']), withPerm('crm:send_message'), asyncHandler(sendMessage));
app.post('/api/crm/queue/process-once', mockAuth(['crm:write']), withPerm('crm:write'), asyncHandler(processQueueOnce));
app.get('/api/crm/diagnostics', mockAuth(['settings:read']), withPerm('settings:read'), asyncHandler(getDiagnostics));
app.post('/api/crm/customers/:id/export-data', mockAuth(['customers:read']), withPerm('customers:read'), asyncHandler(exportCustomerData));
app.post('/api/crm/customers/:id/request-erasure', mockAuth(['customers:write']), withPerm('customers:write'), asyncHandler(requestCustomerErasure));
app.patch('/api/crm/channels/whatsapp/setup', mockAuth(['crm:manage_channels']), withPerm('crm:manage_channels'), asyncHandler(saveWhatsappSetup));
app.patch('/api/crm/channels/sms/setup', mockAuth(['crm:manage_channels']), withPerm('crm:manage_channels'), asyncHandler(saveSmsSetup));

app.post('/api/crm/channels/whatsapp/webhook', asyncHandler(whatsappWebhook));
app.post('/api/crm/sms/otp/start', asyncHandler(smsOtpStart));
app.post('/api/crm/sms/otp/check', asyncHandler(smsOtpCheck));
app.get('/api/crm/portal/:tenantSlug/session/:token', asyncHandler(getPortalSession));
app.post('/api/crm/portal/qr/scan', asyncHandler(trackQrScan));

app.use(errorHandler);

describe('CRM Phase 6C Audited Endpoints', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should block message send without crm:send_message permission', async () => {
        // Need to mount a distinct route for fail because express doesn't unmount
        app.post('/api/crm/fail/messages', mockAuth(['crm:read']), withPerm('crm:send_message'), asyncHandler(sendMessage));
        const res = await request(app).post('/api/crm/fail/messages').send({ body: 'test' });
        expect(res.status).toBe(403);
    });

    it('should allow message send with crm:send_message permission', async () => {
        prismaMock.crmMessage.create.mockResolvedValueOnce({ id: 'msg_1' });
        prismaMock.crmConversation.updateMany.mockResolvedValueOnce({});
        const res = await request(app)
            .post('/api/crm/conversations/conv_1/messages')
            .send({ body: 'Hello', direction: 'outbound' });
        expect(res.status).toBe(200);
        expect(prismaMock.crmMessage.create).toHaveBeenCalled();
    });

    it('webhook should create Customer, Conversation, and Message on inbound message', async () => {
        prismaMock.customer.findFirst.mockResolvedValueOnce(null);
        prismaMock.customer.create.mockResolvedValueOnce({ id: 'new_cust_1', phone: '11999999999' });
        prismaMock.crmConversation.findFirst.mockResolvedValueOnce(null);
        prismaMock.crmConversation.create.mockResolvedValueOnce({ id: 'new_conv_1' });
        prismaMock.crmMessage.create.mockResolvedValueOnce({ id: 'msg_2' });
        prismaMock.crmConversation.update.mockResolvedValueOnce({});

        const res = await request(app)
            .post('/api/crm/channels/whatsapp/webhook')
            .send({ tenantId: 'tenant_1', from: '11999999999', body: 'Olá' });

        expect(res.status).toBe(200);
        expect(prismaMock.customer.create).toHaveBeenCalled();
        expect(prismaMock.crmConversation.create).toHaveBeenCalled();
        expect(prismaMock.crmMessage.create).toHaveBeenCalled();
    });

    it('campaign launch should only queue for opt-in customers', async () => {
        prismaMock.crmCampaign.findFirst.mockResolvedValueOnce({ id: 'camp_1', status: 'draft' });
        // Only return 1 opt-in customer
        prismaMock.customer.findMany.mockResolvedValueOnce([{ id: 'c1', phone: '11999999999', whatsappOptIn: true }]);
        prismaMock.communicationQueue.create.mockResolvedValueOnce({});
        prismaMock.crmCampaign.update.mockResolvedValueOnce({});
        prismaMock.crmCampaign.findUnique.mockResolvedValueOnce({ status: 'completed' });

        const res = await request(app).post('/api/crm/campaigns/camp_1/launch').send();
        expect(res.status).toBe(200);
        expect(prismaMock.communicationQueue.create).toHaveBeenCalledTimes(1); // One queued
    });

    it('SMS OTP check generates valid session token for portal', async () => {
        prismaMock.tenant.findFirst.mockResolvedValueOnce({ id: 'tenant_1' });
        const mockHash = require('crypto').createHash('sha256').update('123456').digest('hex');
        prismaMock.portalSession.findFirst.mockResolvedValueOnce({ id: 'sess_1', otpHash: mockHash, token: 'fake_token' });
        prismaMock.portalSession.update.mockResolvedValueOnce({});

        const res = await request(app).post('/api/crm/sms/otp/check').send({ tenantSlug: 'demo', phoneNumber: '119', otp: '123456' });
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBe('fake_token');
    });

    it('Portal session gets customer data with valid token', async () => {
        prismaMock.tenant.findFirst.mockResolvedValueOnce({ id: 'tenant_1' });
        prismaMock.portalSession.findFirst.mockResolvedValueOnce({ id: 'sess_1', phoneNumber: '119' });
        prismaMock.customer.findFirst.mockResolvedValueOnce({ id: 'c1', name: 'John' });

        const res = await request(app).get('/api/crm/portal/demo/session/fake_token');
        expect(res.status).toBe(200);
        expect(res.body.data.customer.name).toBe('John');
    });

    it('Dispatcher skips queue items if customer has opt-out', async () => {
        const item = { id: 'q1', customerId: 'c1', channel: 'whatsapp', body: 'test', customer: { id: 'c1', whatsappOptIn: false } };
        // first findMany in claimItems
        prismaMock.communicationQueue.findMany.mockResolvedValueOnce([item]);
        // second findMany in claimItems
        prismaMock.communicationQueue.findMany.mockResolvedValueOnce([item]);

        prismaMock.communicationQueue.updateMany.mockResolvedValueOnce({});
        prismaMock.communicationQueue.update.mockResolvedValue({});

        const res = await request(app).post('/api/crm/queue/process-once').send();
        expect(res.status).toBe(200);
        expect(prismaMock.communicationQueue.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'cancelled' })
        }));
    });

    it('Dispatcher processes mocked provider successfully and creates timeline message', async () => {
        const item = { id: 'q2', tenantId: 't1', customerId: 'c2', channel: 'whatsapp', body: 'test real', customer: { id: 'c2', phone: '119', whatsappOptIn: true } };
        
        prismaMock.communicationQueue.findMany.mockResolvedValueOnce([item]);
        prismaMock.communicationQueue.findMany.mockResolvedValueOnce([item]);
        
        prismaMock.communicationQueue.updateMany.mockResolvedValueOnce({});
        prismaMock.communicationQueue.update.mockResolvedValue({});
        
        prismaMock.crmConversation.findFirst.mockResolvedValueOnce({ id: 'conv_1' });
        prismaMock.crmMessage.create.mockResolvedValueOnce({});

        const res = await request(app).post('/api/crm/queue/process-once').send();
        expect(res.status).toBe(200);
        expect(prismaMock.communicationQueue.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'sent', provider: 'mock' })
        }));
        expect(prismaMock.crmMessage.create).toHaveBeenCalled();
    });
});

describe('Phase 6E: Observability and Worker endpoints', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 200 for diagnostics', async () => {
        const res = await request(app).get('/api/crm/diagnostics');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('worker');
        expect(res.body.data).toHaveProperty('providers');
    });

    it('should export customer data', async () => {
        const fakeCustomer = { id: 'cust1', name: 'John Doe', CrmConversation: [], orders: [] };
        prismaMock.customer.findFirst.mockResolvedValue(fakeCustomer as any);
        const res = await request(app).post('/api/crm/customers/cust1/export-data');
        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('John Doe');
        expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ action: 'customer_data_exported' })
        }));
    });

    it('should request customer erasure logically', async () => {
        const fakeCustomer = { id: 'cust1', name: 'John Doe' };
        prismaMock.customer.findFirst.mockResolvedValue(fakeCustomer as any);
        const res = await request(app).post('/api/crm/customers/cust1/request-erasure');
        expect(res.status).toBe(200);
        expect(prismaMock.customer.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'erasure_requested', whatsappOptIn: false })
        }));
        expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ action: 'customer_erasure_requested' })
        }));
    });

    it('should configure WhatsApp manual link', async () => {
        const res = await request(app).patch('/api/crm/channels/whatsapp/setup').send({ provider: 'manual_wa_link' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('manual_wa_link');
    });

    it('should configure SMS twilio mock', async () => {
        const res = await request(app).patch('/api/crm/channels/sms/setup').send({ provider: 'mock' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('mock');
    });
});


