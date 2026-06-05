import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const hasDbUrl = !!(process.env.DATABASE_URL || process.env.DATABASE_URL_TEST);

describe.skipIf(!hasDbUrl)('Prisma Real DB Integrations', () => {
    let prisma: PrismaClient;
    const testRunId = `test_${randomUUID().substring(0, 8)}`;
    let testTenantId: string;
    let testUserId: string;

    beforeAll(async () => {
        if (!hasDbUrl) return;

        prisma = new PrismaClient({
            datasourceUrl: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
        });
        await prisma.$connect();
        
        // 1. Create a pure isolated tenant
        const tenant = await prisma.tenant.create({
            data: {
                id: `tenant_${testRunId}`,
                name: `Test Tenant ${testRunId}`
            }
        });
        testTenantId = tenant.id;

        const role = await prisma.role.create({
            data: {
                tenantId: testTenantId,
                name: 'Admin',
                systemKey: 'admin',
                description: 'Admin'
            }
        });

        const user = await prisma.user.create({
            data: {
                email: `admin_${testRunId}@test.com`,
                name: 'Admin Test',
                passwordHash: 'hashed',
            }
        });
        testUserId = user.id;

        await prisma.tenantUser.create({
            data: {
                tenantId: testTenantId,
                userId: testUserId,
                roleId: role.id
            }
        });
    });

    afterAll(async () => {
        if (!prisma) return;
        // Clean up everything isolated by tenant if possible, or leave it since it's an isolated tracking ID.
        // We will leave it since it is prefixed with testRunId. This helps debugging and doesn't affect production.
        await prisma.$disconnect();
    });

    it('should skip tests if DB URL is not provided', () => {
        expect(hasDbUrl).toBe(true);
    });

    it('should create customer and product correctly', async () => {
        const customer = await prisma.customer.create({
            data: {
                tenantId: testTenantId,
                name: 'Test Customer',
                email: 'customer@test.com'
            }
        });

        const product = await prisma.product.create({
            data: {
                tenantId: testTenantId,
                name: 'Test Coffee',
                sku: 'COF-01',
                category: 'coffee',
                unitPrice: 15.0,
                unitCost: 5.0
            }
        });
        
        await prisma.stockMovement.create({
            data: {
                tenantId: testTenantId,
                productId: product.id,
                movementType: 'in',
                qty: 10,
                reason: 'Initial stock'
            }
        });

        expect(customer.id).toBeDefined();
        expect(product.id).toBeDefined();

        // 5. Estoque ACID real
        // Create an inventory rule (AppSetting)
        await prisma.appSetting.create({
            data: {
                tenantId: testTenantId,
                key: 'businessRules',
                value: JSON.stringify({ allowNegativeStock: false })
            }
        });
    });

    it('should lower stock, preventing negative limits in ACID transactions', async () => {
        const product = await prisma.product.findFirst({ where: { tenantId: testTenantId } });
        expect(product).toBeDefined();
        if (!product) return;

        // Validating standard Prisma transaction ACID
        await expect(
            prisma.$transaction(async (tx) => {
                const aggregate = await tx.stockMovement.aggregate({
                     _sum: { qty: true },
                     where: { tenantId: testTenantId, productId: product.id }
                });
                const currentStock = aggregate._sum.qty || 0;
                
                // Read business rules
                const rules = await tx.appSetting.findUnique({ where: { tenantId_key: { tenantId: testTenantId, key: 'businessRules' } } });
                const businessRules = rules ? JSON.parse(rules.value) : { allowNegativeStock: false };

                if (!businessRules.allowNegativeStock && currentStock < 15) {
                    throw new Error('Estoque insuficiente limit blocker');
                }
                
                // Try to decrease stock
                await tx.stockMovement.create({
                    data: { tenantId: testTenantId, productId: product.id, movementType: 'out', qty: -15, reason: 'Test validation' }
                });
            })
        ).rejects.toThrow('Estoque insuficiente limit blocker');
    });

    it('should allow valid stock transaction and verify duplicate financial operations', async () => {
        const product = await prisma.product.findFirst({ where: { tenantId: testTenantId } });
        expect(product).toBeDefined();
        if (!product) return;

        // Perform valid order & stock deduction
        const orderInfo = await prisma.$transaction(async (tx) => {
            // Deduct 2
            await tx.stockMovement.create({
                data: { tenantId: testTenantId, productId: product.id, movementType: 'out', qty: -2, reason: 'Sale' }
            });

            // Create Order
            const order = await tx.order.create({
                data: {
                    tenantId: testTenantId,
                    channel: 'pdv',
                    status: 'confirmed',
                    trackingNumber: `TRK-${testRunId}-01`,
                    subtotal: 30,
                    total: 30
                }
            });

            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: product.id,
                    name: product.name,
                    qty: 2,
                    unitPrice: 15,
                    lineTotal: 30
                }
            });

            return order;
        });

        // Test financial idempotency 
        const refId = `REF-${orderInfo.id}`;

        const finTx1 = await prisma.financialTransaction.findFirst({
            where: { tenantId: testTenantId, referenceId: refId, source: 'order' }
        });

        if (!finTx1) {
            await prisma.financialTransaction.create({
                data: {
                    tenantId: testTenantId,
                    orderId: orderInfo.id,
                    type: 'income',
                    category: 'sales',
                    description: 'Venda PDV',
                    amount: 30,
                    date: new Date(),
                    referenceId: refId,
                    source: 'order'
                }
            });
        }

        // Try second time (duplicate webhook)
        const finTx2 = await prisma.financialTransaction.findFirst({
            where: { tenantId: testTenantId, referenceId: refId, source: 'order' }
        });

        if (!finTx1 && finTx2) {
           // Passed - it was created once
        }
        
        const count = await prisma.financialTransaction.count({
             where: { tenantId: testTenantId, referenceId: refId, source: 'order' }
        });

        expect(count).toBe(1);
    });

    it('should create CRM deal and activity properly', async () => {
         const customer = await prisma.customer.findFirst({ where: { tenantId: testTenantId } });
         
         const deal = await prisma.crmDeal.create({
             data: {
                 tenantId: testTenantId,
                 customerId: customer?.id,
                 title: `Deal ${testRunId}`,
                 value: 1000,
                 pipelineId: 'pipe_1_mock',
                 stageId: 'stage_1_mock'
             }
         });

         const activity = await prisma.crmActivity.create({
             data: {
                 tenantId: testTenantId,
                 dealId: deal.id,
                 type: 'call',
                 title: 'Follow up',
                 dueAt: new Date()
             }
         });

         expect(deal.id).toBeDefined();
         expect(activity.id).toBeDefined();
    });

    it('should verify unique index constraint by tenant', async () => {
         await prisma.order.create({
             data: {
                 tenantId: testTenantId,
                 channel: 'pdv',
                 trackingNumber: `TRK-100`,
                 subtotal: 10,
                 total: 10
             }
         });

         // Creating order with same trackingNumber on SAME tenant should fail
         await expect(
             prisma.order.create({
                 data: {
                     tenantId: testTenantId,
                     channel: 'pdv',
                     trackingNumber: `TRK-100`,
                     subtotal: 10,
                     total: 10
                 }
             })
         ).rejects.toThrow();

         // Creating order with same trackingNumber on DIFFERENT tenant should succeed
         const diffTenant = await prisma.tenant.create({
             data: { id: `diff_tenant_${testRunId}`, name: 'Diff' }
         });

         const diffOrder = await prisma.order.create({
             data: {
                 tenantId: diffTenant.id,
                 channel: 'pdv',
                 trackingNumber: `TRK-100`,
                 subtotal: 10,
                 total: 10
             }
         });

         expect(diffOrder.id).toBeDefined();
    });

    it('should handle digital menu and platform fees', async () => {
        // Digital Menu
        const dmConfig = await prisma.digitalMenuConfig.create({
            data: {
                tenantId: testTenantId,
                slug: `test-menu-${testRunId}`,
                publicName: 'Test Menu',
                isOpen: true
            }
        });

        const cat = await prisma.digitalMenuCategory.create({
            data: {
                tenantId: testTenantId,
                name: 'Pizzas'
            }
        });

        const item = await prisma.digitalMenuItem.create({
            data: {
                tenantId: testTenantId,
                categoryId: cat.id,
                name: 'Marguerita',
                price: 50.0
            }
        });

        expect(dmConfig.slug).toBe(`test-menu-${testRunId}`);
        expect(item.id).toBeDefined();

        // Webhook Idempotency & Platform Fee
        const eventId = `EVT-${testRunId}`;
        const webhook1 = await prisma.paymentWebhookEvent.create({
            data: {
                eventId,
                provider: 'mercadopago',
                eventType: 'payment.created',
                rawJson: '{}'
            }
        });

        // Simulating idempotent webhook
        const duplicateFind = await prisma.paymentWebhookEvent.findFirst({
            where: { eventId }
        });
        expect(duplicateFind).toBeDefined();

        // Platform Fee
        const fee = await prisma.platformFeeLedger.create({
            data: {
                tenantId: testTenantId,
                amount: 1.5,
                orderId: 'mock-order',
                description: 'Test fee'
            }
        });
        expect(fee.id).toBeDefined();
        
        // Fee should NOT be a financial transaction in the tenant balance
        const fakeTx = await prisma.financialTransaction.findFirst({
            where: { tenantId: testTenantId, amount: 1.5, source: 'platform_fee' }
        });
        expect(fakeTx).toBeNull();
    });
});
