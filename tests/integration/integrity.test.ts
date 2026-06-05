import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../server/middlewares/requireAuth';
import { requirePermission } from '../../server/middlewares/requirePermission';
import { getOnboardingStatus, updateOnboardingStatus } from '../../server/modules/settings/settings.controller';
import { getTransactions } from '../../server/modules/finance/finance.controller';
import { errorHandler } from '../../server/middlewares/errorHandler';

vi.mock('../../server/lib/prisma', () => ({
  default: {
    appSetting: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      findFirst: vi.fn(),
    },
    financialTransaction: {
      findMany: vi.fn(),
    },
    tenantUser: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn()
    }
  },
  checkDbConnection: vi.fn()
}));

// We can get the mocked module to assert
import prismaMockDefault from '../../server/lib/prisma';
const prismaMock = prismaMockDefault as any;

const mockAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  
  if (token === 'Bearer VALID_TOKEN') {
    (req as any).user = { userId: 'user_1' };
    (req as any).tenantId = 'tenant_1';
    (req as any).userId = 'user_1';
    return next();
  }
  
  if (token === 'Bearer NO_PERMS') {
    (req as any).user = { userId: 'user_2' };
    (req as any).tenantId = 'tenant_1';
    (req as any).userId = 'user_2';
    return next();
  }

  res.status(401).json({ error: 'Invalid token' });
};

// Mount App
const app = express();
app.use(express.json());

// Override requireAuth locally for the test route (if we want to test the middleware itself)
// But since we can't easily override the imported one for existing routes unless mocked,
// let's just mock requireAuth itself by intercepting.
vi.mock('../../server/middlewares/requireAuth', () => ({
  requireAuth: vi.fn((req, res, next) => mockAuth(req, res, next))
}));

// We need to re-import controllers after mocking
// Use dynamic imports or simply test the mocked behavior

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// We will test requireAuth + requirePermission
app.get('/api/test-auth', mockAuth, requirePermission('finance:read'), (req, res) => {
    res.json({ ok: true });
});

app.get('/api/onboarding/status', mockAuth, asyncHandler(getOnboardingStatus));
app.patch('/api/onboarding/status', mockAuth, asyncHandler(updateOnboardingStatus));
app.get('/api/finance/transactions', mockAuth, requirePermission('finance:read'), asyncHandler(getTransactions));

app.use(errorHandler);

describe('Integrity & Behavior Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        prismaMock.tenantUser.findFirst.mockImplementation(async (args: any) => {
             if (args.where.userId === 'user_1') {
                 return { status: 'active', role: { systemKey: 'admin', permissions: [] } };
             }
             if (args.where.userId === 'user_2') {
                 return { status: 'active', role: { systemKey: 'user', permissions: [] } };
             }
             return null;
        });
    });

    describe('1. RBAC Tests', () => {
        it('should return 401 if no auth is provided', async () => {
            const res = await request(app).get('/api/test-auth');
            expect(res.status).toBe(401);
        });

        it('should return 403 if token is valid but lacks permission', async () => {
            const res = await request(app)
                .get('/api/test-auth')
                .set('Authorization', 'Bearer NO_PERMS');
            expect(res.status).toBe(403);
            expect(res.body.error).toContain('Missing required permission');
        });

        it('should allow access if token has permission', async () => {
            const res = await request(app)
                .get('/api/test-auth')
                .set('Authorization', 'Bearer VALID_TOKEN');
            expect(res.status).toBe(200);
        });
    });

    describe('2. Onboarding API Integration', () => {
        it('should fetch onboarding status with default if none exists', async () => {
            prismaMock.appSetting.findUnique.mockResolvedValueOnce(null);
            prismaMock.appSetting.create.mockResolvedValueOnce({ value: JSON.stringify({ companyProfileCompleted: false }) });
            
            const res = await request(app)
                .get('/api/onboarding/status')
                .set('Authorization', 'Bearer VALID_TOKEN');
            expect(res.status).toBe(200);
            expect(res.body.data.companyProfileCompleted).toBe(false);
        });

        it('should update onboarding status properly', async () => {
            // First mock is for getOrSet read
            prismaMock.appSetting.findUnique.mockResolvedValueOnce({ value: JSON.stringify({ companyProfileCompleted: false }) });
            // Let setSetting succeed by mocking $transaction and related calls
            // This is complex, easier to mock update/unique
            vi.spyOn(prismaMock.appSetting, 'findUnique').mockResolvedValueOnce({ value: JSON.stringify({ companyProfileCompleted: false }) });
            
            // To handle setSetting's $transaction, let's mock prisma.$transaction
            prismaMock.$transaction = vi.fn().mockImplementation(async (cb) => {
                 return cb(prismaMock);
            });
            
            prismaMock.appSetting.upsert = vi.fn().mockResolvedValueOnce({ value: JSON.stringify({ companyProfileCompleted: true }) });
            
            const res = await request(app)
                .patch('/api/onboarding/status')
                .set('Authorization', 'Bearer VALID_TOKEN')
                .send({ companyProfileCompleted: true });

            expect(res.status).toBe(200);
            expect(res.body.data.companyProfileCompleted).toBe(true);
        });
    });

    describe('3. Finance Idempotency validation concept', () => {
        it('should not allow fetching without finance read perms', async () => {
             const res = await request(app)
                .get('/api/finance/transactions')
                .set('Authorization', 'Bearer NO_PERMS');
            expect(res.status).toBe(403);
        });
        
        it('should fetch transactions correctly', async () => {
            prismaMock.financialTransaction.findMany.mockResolvedValueOnce([
                { id: '1', amount: 100, type: 'revenue', status: 'paid', date: new Date() }
            ]);
            const res = await request(app)
                .get('/api/finance/transactions')
                .set('Authorization', 'Bearer VALID_TOKEN');
            expect(res.status).toBe(200);
            expect(res.body.data[0].amount).toBe(100);
        });
    });
});

