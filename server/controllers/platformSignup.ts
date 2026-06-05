import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

export async function signup(req: Request, res: Response) {
  const { companyName, document, name, email, password } = req.body;
  
  if (!email || !password || !companyName) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  // check if tenant exists by document (optional but good idea)
  if (document) {
      const existingTenant = await prisma.tenant.findFirst({ where: { document } });
      if (existingTenant) {
          return res.status(400).json({ error: 'Document already registered' });
      }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create Tenant, User, and default Role atomically
  const result = await prisma.$transaction(async (tx) => {
      // Set trial for 14 days
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const tenant = await tx.tenant.create({
          data: {
              name: companyName,
              document,
              billingStatus: 'trialing',
              trialEndsAt,
              status: 'active'
          }
      });

      const user = await tx.user.create({
          data: {
              name,
              email,
              passwordHash: hashedPassword
          }
      });

      // Role Platform Admin for the first user
      const perms = ['platform:admin', 'customers:read', 'customers:write', 'crm:read', 'crm:write', 'crm:send_message', 'crm:manage_channels', 'settings:read', 'settings:write'];
      const role = await tx.role.create({
          data: {
              tenantId: tenant.id,
              name: 'Owner',
              description: 'System owner',
              systemKey: 'owner',
              permissions: {
                  create: perms.map(p => ({ permission: { connect: { key: p } } }))
              }
          }
      });

      await tx.tenantUser.create({
          data: {
              tenantId: tenant.id,
              userId: user.id,
              roleId: role.id
          }
      });

      const token = jwt.sign({ userId: user.id, tenantId: tenant.id, role: 'owner' }, JWT_SECRET, { expiresIn: '7d' });

      return { tenant, user, token };
  });

  res.json({ status: 'ok', data: { token: result.token, tenantId: result.tenant.id } });
}

export async function getSignupStatus(req: Request, res: Response) {
    res.json({ status: 'ok', data: { active: true } });
}

export async function startTrial(req: Request, res: Response) {
    const tenantId = (req as any).tenantId;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { billingStatus: 'trialing', trialEndsAt }
    });

    res.json({ status: 'ok' });
}
