import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
     console.warn('⚠️ WARNING: Running seed in PRODUCTION mode. Default credentials will be created unless they exist.');
  }

  // 1. Create a Demo Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { document: '00.000.000/0001-00' }
  });
  
  if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Demonstração COFCOF.CO',
          document: '00.000.000/0001-00',
          plan: 'pro'
        }
      });
  }

  // 2. Create an Admin Role
  const role = await prisma.role.findFirst({ where: { tenantId: tenant.id, name: 'owner' } }) 
    || await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'owner',
        systemKey: 'admin',
        description: 'Dono do sistema'
      }
    });

  // 3. Create a Demo User (Upsert)
  const userEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@demo.local';
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  
  if (!user) {
      if (isProduction && !process.env.DEFAULT_ADMIN_PASSWORD) {
          throw new Error('In production, DEFAULT_ADMIN_PASSWORD must be provided for seedling.');
      }
      const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          name: 'Admin Demo',
          email: userEmail,
          passwordHash,
        }
      });
  }

  // 4. Link User to Tenant
  const existingLink = await prisma.tenantUser.findFirst({
      where: { tenantId: tenant.id, userId: user.id }
  });
  if (!existingLink) {
      await prisma.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: role.id
        }
      });
  }

  // App Settings
  await prisma.appSetting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: 'businessRules' } },
      update: {},
      create: {
          tenantId: tenant.id,
          key: 'businessRules',
          value: JSON.stringify({ allowNegativeStock: false })
      }
  });

  await prisma.appSetting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: 'onboardingStatus' } },
      update: {},
      create: {
          tenantId: tenant.id,
          key: 'onboardingStatus',
          value: JSON.stringify({ completed: false, steps: ['welcome'] })
      }
  });

  // Setup initial products only if none exist
  const prodCount = await prisma.product.count({ where: { tenantId: tenant.id }});
  if (prodCount === 0) {
      await prisma.product.createMany({
        data: [
          {
            tenantId: tenant.id,
            name: 'Café Especial Torrado 250g',
            category: 'Café Torrado',
            sku: 'CAFE-250G',
            unit: 'pct',
            unitCost: 15.50,
            unitPrice: 45.00
          },
          {
            tenantId: tenant.id,
            name: 'Embalagem Kraft com Válvula 250g',
            category: 'Insumo',
            sku: 'EMB-KRAFT-250',
            unit: 'un',
            unitCost: 1.20,
            unitPrice: 0
          }
        ]
      });

      const p = await prisma.product.findFirst({ where: { tenantId: tenant.id, sku: 'CAFE-250G' } });
      if (p) {
          await prisma.stockMovement.create({
              data: { tenantId: tenant.id, productId: p.id, movementType: 'in', qty: 50, reason: 'Saldo Inicial' }
          });
      }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
