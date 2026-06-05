import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

export const getSystemHealth = async (req: Request, res: Response) => {
  const isPrismaConfigured = !!(process.env.DATABASE_URL);
  
  let databaseStatus = 'unknown';
  if (isPrismaConfigured) {
      try {
          await prisma.$queryRaw`SELECT 1`;
          databaseStatus = 'connected';
      } catch (e: any) {
          databaseStatus = 'error: ' + e.message;
      }
  } else {
      databaseStatus = 'missing_env';
  }

  const paymentMode = process.env.PAYMENT_MODE || 'mock';
  const dataMode = process.env.DATA_MODE || 'api';

  res.json({
      data: {
          database: {
              configured: isPrismaConfigured,
              status: databaseStatus
          },
          modes: {
              data: dataMode,
              payment: paymentMode
          },
          environment: process.env.NODE_ENV || 'development'
      }
  });
};
