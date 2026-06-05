import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { requirePermission } from '../../server/middlewares/requirePermission';
import { getCampaigns, createCampaign, launchCampaign } from '../../server/controllers/crm';
import { trackQrScan } from '../../server/controllers/crmIntegration';
import { errorHandler } from '../../server/middlewares/errorHandler';

vi.mock('../../server/lib/prisma', () => {
    const prismaMock = {
      crmCampaign: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn()
      },
      customer: {
        findMany: vi.fn(),
        findFirst: vi.fn()
      },
      communicationQueue: {
        create: vi.fn()
      },
      crmTrackingLink: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      crmActivity: {
        create: vi.fn()
      },
      tenantUser: {
        findFirst: vi.fn()
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

app.post('/api/crm/campaigns', mockAuth, requirePermission('customers:write'), asyncHandler(createCampaign));
app.post('/api/crm/campaigns/:id/launch', mockAuth, requirePermission('customers:write'), asyncHandler(launchCampaign));
app.post('/api/crm/portal/qr/scan', asyncHandler(trackQrScan));
app.use(errorHandler);

describe('CRM Phase 2 Integrity Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        prismaMock.tenantUser.findFirst.mockResolvedValue({ status: 'active', role: { systemKey: 'admin', permissions: [] } });
    });

    it('should create a new campaign', async () => {
        prismaMock.crmCampaign.create.mockResolvedValueOnce({ id: 'camp_1', name: 'Promo 1' });
        
        const res = await request(app)
            .post('/api/crm/campaigns')
            .send({
                name: 'Promo 1',
                channel: 'whatsapp'
            });

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe('camp_1');
        expect(prismaMock.crmCampaign.create).toHaveBeenCalled();
    });

    it('should launch campaign and queue messages', async () => {
        prismaMock.crmCampaign.findFirst.mockResolvedValueOnce({ id: 'camp_1', status: 'draft', channel: 'whatsapp', template: { body: 'Hello {{name}}' } });
        prismaMock.customer.findMany.mockResolvedValueOnce([
            { id: 'cust_1', name: 'John Doe', phone: '11999999999' },
            { id: 'cust_2', name: 'Jane Doe', phone: '11988888888' }
        ]);
        prismaMock.communicationQueue.create.mockResolvedValue({});
        prismaMock.crmCampaign.update.mockResolvedValueOnce({});
        prismaMock.crmCampaign.findUnique.mockResolvedValueOnce({ id: 'camp_1', status: 'completed' });

        const res = await request(app)
            .post('/api/crm/campaigns/camp_1/launch');

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('completed');
        expect(prismaMock.communicationQueue.create).toHaveBeenCalledTimes(2);
    });

    it('should track qr scan and identify customer', async () => {
        prismaMock.crmTrackingLink.findUnique.mockResolvedValueOnce({ id: 'link_1', tenantId: 'tenant_1', token: 'qr_abc', source: 'package_1' });
        prismaMock.crmTrackingLink.update.mockResolvedValueOnce({});
        prismaMock.customer.findFirst.mockResolvedValueOnce({ id: 'cust_1' });
        prismaMock.crmActivity.create.mockResolvedValueOnce({});

        const res = await request(app)
            .post('/api/crm/portal/qr/scan')
            .send({
                token: 'qr_abc',
                phoneNumber: '11999999999'
            });

        expect(res.status).toBe(200);
        expect(prismaMock.crmTrackingLink.update).toHaveBeenCalled();
        expect(prismaMock.crmActivity.create).toHaveBeenCalled();
    });
});
