import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { errorHandler } from './server/middlewares/errorHandler';
import { requireAuth } from './server/middlewares/requireAuth';
import { requireAuthOrCron } from './server/middlewares/requireAuthOrCron';
import { checkDbConnection } from './server/lib/prisma';

// Auth Routes
import { login, getMe, loginSchema } from './server/modules/auth/auth.controller';
import { validate } from './server/middlewares/validate';

// Product Routes
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, productSchema } from './server/modules/products/products.controller';

// Inventory Routes
import { getMovements, createMovement, getInventorySummary, getLowStock, movementSchema } from './server/modules/inventory/inventory.controller';

// Orders Routes
import { getOrders, getOrderById, createOrder, cancelOrder, createOrderSchema } from './server/modules/orders/orders.controller';
import { getBatches, getBatchById, createBatch, finalizeBatch, cancelBatch, createProductionBatchSchema, finalizeProductionBatchSchema } from './server/modules/production/production.controller';
import { getConsignments, getConsignmentById, createConsignment, settleConsignment, cancelConsignment, createConsignmentSchema, settleConsignmentSchema, getPartners, createPartner, updatePartner, createPartnerSchema } from './server/modules/consignments/consignments.controller';
import { getTransactions, createExpense, markAsPaid, cancelTransaction, getFinancialSummary, getCashFlow, getSimpleDre, expenseSchema } from './server/modules/finance/finance.controller';
import { getSummary, getAlerts, getRecentActivity } from './server/modules/dashboard/dashboard.controller';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer, getCustomerBalance, getCustomerActivity, createCustomerSchema, updateCustomerSchema, exportCustomerData, requestCustomerErasure } from './server/modules/customers/customers.controller';
import { getProfile, updateProfile, getBranches, createBranch, updateBranch, deleteBranch, getBusinessRules, updateBusinessRules, getProductionRules, updateProductionRules, getModuleFlags, updateModuleFlags, getOnboardingStatus, updateOnboardingStatus } from './server/modules/settings/settings.controller';
import { getSystemHealth } from './server/modules/settings/system.controller';
import { getSalesReports, getFinanceReports, getInventoryReports, generateDocument, getDocuments, voidDocument } from './server/modules/reports/reports.controller';

import { 
  getStorefrontProducts, 
  getStorefrontPlans, 
  createSubscriptionRequest,
  getPlans,
  createPlan,
  updatePlan,
  getRequests,
  updateRequestStatus,
  getSubscriptions,
  updateSubscriptionStatus
} from './server/controllers/storefront';

import { requirePermission } from './server/middlewares/requirePermission';
import { 
  getTeamMembers, 
  getRoles, 
  getPermissionsList, 
  createRole, 
  updateRole, 
  updateTeamMember, 
  suspendTeamMember, 
  reactivateTeamMember, 
  createInvitation, 
  getAuditLogs, 
  getMyPermissions 
} from './server/controllers/team';

import {
  createPaymentIntentPublic,
  webhookHandler,
  getIntents,
  markAsPaidManual,
  cancelIntent,
  getWebhookEvents,
  getProviderConfig,
  updateProviderConfig
} from './server/controllers/payments';

import {
  getPipelines,
  createPipeline,
  getDeals,
  createDeal,
  updateDeal,
  moveDeal,
  getActivities,
  createActivity,
  updateActivity,
  completeActivity,
  getTemplates,
  createTemplate,
  getCommunications,
  queueCommunication,
  markCommunicationSimulated,
  getConversations,
  getMessages,
  sendMessage,
  getChannelConnections,
  getCampaigns,
  createCampaign,
  updateCampaign,
  launchCampaign,
  processQueueOnce,
  getQueueStatus,
  retryQueueItem,
  cancelQueueItem,
  getDiagnostics,
  getAutomations,
  createAutomation,
  createConversation,
  updateConversation,
  assignConversation,
  rescheduleActivity,
  wonDeal,
  lostDeal,
  updateTemplate
} from './server/controllers/crm';

import {
  getSpecialOrders, createSpecialOrder, updateSpecialOrder,
  getCalendarEvents, createCalendarEvent, updateCalendarEvent,
  getLoyaltyProgram, updateLoyaltyProgram, adjustLoyaltyPoints,
  getFeedback, createFeedback,
  getTickets, createTicket, resolveTicket,
  recalculateInsights, getCustomerInsights
} from './server/controllers/crmVertical';

import {
  resolveConversation,
  archiveConversation,
  getConversation,
  whatsappWebhook,
  smsOtpStart,
  smsOtpCheck,
  generateQrToken,
  trackQrScan,
  getPortalSession,
  getWhatsappStatus,
  getWhatsappConnectUrl,
  disconnectWhatsapp,
  testWhatsappMessage,
  saveWhatsappSetup,
  getWhatsappWebhookInfo,
  getSmsStatus,
  saveSmsSetup,
  disableSmsSetup
} from './server/controllers/crmIntegration';

import {
  getCustomerProfile,
  updateCustomerPreferences,
  addCustomerTag,
  removeCustomerTag
} from './server/modules/customers/customers.controller';

import {
  getGreenLots, createGreenLot, updateGreenLot,
  getRecipes, createRecipe, updateRecipe,
  getRoastProfiles, createRoastProfile, updateRoastProfile,
  getProductionDemand,
  createBatchFromDemand,
  reserveBatchInputs, startBatch, completeBatch, cancelBatch as advCancelBatch
} from './server/controllers/advancedProduction';

import {
  getReviews, createReview, updateReview, approveReview, rejectReview, getDescriptors, getDefects
} from './server/controllers/quality';

import {
  getB2BCatalog, createB2BCatalogItem, updateB2BCatalogItem
} from './server/controllers/b2bCatalog';

import {
  getPublicTrace, getTraces, getTraceById, createTraceFromQualityInfo, updateTrace, publishTrace, unpublishTrace
} from './server/controllers/traceability';

import {
  getConfig, updateConfig, getCategories, createCategory, updateCategory, deleteCategory,
  getItems, createItem, updateItem, deleteItem, getOrders as getDigitalMenuOrders, updateOrderStatus,
  getPublicMenu, createPublicOrder, getPublicOrder,
  getModifiers, createModifierGroup, updateModifierGroup, deleteModifierGroup,
  createModifierOption, updateModifierOption, deleteModifierOption
} from './server/controllers/digitalMenu';

import {
  getConnectUrl, oauthCallback, getStatus as getMpStatus, disconnect as disconnectMp, webhook as mpWebhook
} from './server/controllers/paymentMercadoPago';

import {
  rotateWhatsappCredentials,
  revokeWhatsappCredentials,
  testWhatsappCredentials,
  rotateSmsCredentials,
  revokeSmsCredentials,
  testSmsCredentials
} from './server/controllers/crmIntegration';

import {
  signup,
  getSignupStatus,
  startTrial
} from './server/controllers/platformSignup';

import {
  getPlans as getPlatformPlans,
  checkout,
  getSubscription,
  changePlan,
  cancelSubscription,
  webhook as billingWebhook,
  getInvoices,
  generatePortalUrl,
  getStatus as getBillingStatus
} from './server/controllers/platformBilling';

import {
  getTenants,
  getPlatformMetrics,
  changeTenantStatus
} from './server/controllers/platformAdmin';

import { requireEntitlement } from './server/middlewares/requireEntitlement';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/version', (req, res) => res.json({ version: '1.0.0-phase2' }));
  app.get('/api/health', async (req, res) => {
    const isDbConnected = await checkDbConnection();
    res.json({ status: isDbConnected ? 'ok' : 'error', database: isDbConnected });
  });

  app.get('/api/system/status', async (req, res) => {
    const isDbConnected = await checkDbConnection();
    res.json({
      appVersion: '1.0.0-phase2',
      nodeEnv: process.env.NODE_ENV || 'development',
      dbConnected: isDbConnected,
      dataMode: process.env.DATA_MODE || 'api',
      tenantMode: 'multi',
      uptime: process.uptime()
    });
  });

  // DB strict middleware for actual API data routes
  const requireDb = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const isDbConnected = await checkDbConnection();
    if (!isDbConnected) {
      return res.status(503).json({ error: 'Database is not configured or offline. Please use mock mode.' });
    }
    next();
  };

  // Middleware overrides for Async Errors
  const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  app.post('/api/auth/login', requireDb, validate(loginSchema), asyncHandler(login));
  app.get('/api/me', requireDb, requireAuth, asyncHandler(getMe));

  app.get('/api/products', requireDb, requireAuth, asyncHandler(getProducts));
  app.get('/api/products/:id', requireDb, requireAuth, asyncHandler(getProductById));
  app.post('/api/products', requireDb, requireAuth, requirePermission('products:write'), validate(productSchema), asyncHandler(createProduct));
  app.patch('/api/products/:id', requireDb, requireAuth, requirePermission('products:write'), validate(productSchema), asyncHandler(updateProduct));
  app.delete('/api/products/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(deleteProduct));

  // Stub routes for domains
  app.post('/api/auth/refresh', (req, res) => res.json({ token: 'dummy-jwt-token-refresh' }));
  // Inventory Routes
  app.get('/api/inventory/movements', requireDb, requireAuth, asyncHandler(getMovements));
  app.post('/api/inventory/movements', requireDb, requireAuth, requirePermission('inventory:write'), validate(movementSchema), asyncHandler(createMovement));
  app.get('/api/inventory/summary', requireDb, requireAuth, requirePermission('inventory:read'), asyncHandler(getInventorySummary));
  app.get('/api/inventory/low-stock', requireDb, requireAuth, requirePermission('inventory:read'), asyncHandler(getLowStock));

  // Orders Routes
  app.get('/api/orders', requireDb, requireAuth, requirePermission('orders:read'), asyncHandler(getOrders));
  app.post('/api/orders', requireDb, requireAuth, requirePermission('orders:write'), validate(createOrderSchema), asyncHandler(createOrder));
  app.get('/api/orders/:id', requireDb, requireAuth, requirePermission('orders:read'), asyncHandler(getOrderById));
  app.patch('/api/orders/:id/cancel', requireDb, requireAuth, requirePermission('orders:write'), asyncHandler(cancelOrder));

  // Operations/Production Routes
  app.get('/api/production/batches', requireDb, requireAuth, requirePermission('production:read'), asyncHandler(getBatches));
  app.post('/api/production/batches', requireDb, requireAuth, requirePermission('production:write'), validate(createProductionBatchSchema), asyncHandler(createBatch));
  app.get('/api/production/batches/:id', requireDb, requireAuth, requirePermission('production:read'), asyncHandler(getBatchById));
  app.patch('/api/production/batches/:id/complete', requireDb, requireAuth, requirePermission('production:write'), validate(finalizeProductionBatchSchema), asyncHandler(finalizeBatch));
  app.patch('/api/production/batches/:id/cancel', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(cancelBatch));

  // Customer Routes
  app.get('/api/customers', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCustomers));
  app.get('/api/customers/:id', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCustomerById));
  app.post('/api/customers', requireDb, requireAuth, requirePermission('customers:write'), validate(createCustomerSchema), asyncHandler(createCustomer));
  app.patch('/api/customers/:id', requireDb, requireAuth, requirePermission('customers:write'), validate(updateCustomerSchema), asyncHandler(updateCustomer));
  app.delete('/api/customers/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(deleteCustomer));
  app.get('/api/customers/:id/balance', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCustomerBalance));
  app.get('/api/customers/:id/activity', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCustomerActivity));
  app.post('/api/crm/customers/:id/export-data', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(exportCustomerData));
  app.post('/api/crm/customers/:id/request-erasure', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(requestCustomerErasure));

  // Settings Routes
  app.get('/api/settings/profile', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getProfile));
  app.patch('/api/settings/profile', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(updateProfile));
  app.get('/api/onboarding/status', requireDb, requireAuth, asyncHandler(getOnboardingStatus));
  app.patch('/api/onboarding/status', requireDb, requireAuth, asyncHandler(updateOnboardingStatus));
  
  // Team & Audit Routes
  app.get('/api/me/permissions', requireDb, requireAuth, asyncHandler(getMyPermissions));
  app.get('/api/team/members', requireDb, requireAuth, asyncHandler(getTeamMembers));
  app.patch('/api/team/members/:id', requireDb, requireAuth, requirePermission('team:update'), asyncHandler(updateTeamMember));
  app.patch('/api/team/members/:id/suspend', requireDb, requireAuth, requirePermission('team:suspend'), asyncHandler(suspendTeamMember));
  app.patch('/api/team/members/:id/reactivate', requireDb, requireAuth, requirePermission('team:update'), asyncHandler(reactivateTeamMember));
  
  app.get('/api/team/roles', requireDb, requireAuth, asyncHandler(getRoles));
  app.post('/api/team/roles', requireDb, requireAuth, requirePermission('team:update'), asyncHandler(createRole));
  app.patch('/api/team/roles/:id', requireDb, requireAuth, requirePermission('team:update'), asyncHandler(updateRole));
  // Not exposing delete Role yet to avoid orphaned users, can do soft delete later
  
  app.get('/api/team/permissions', requireDb, requireAuth, asyncHandler(getPermissionsList));
  app.post('/api/team/invitations', requireDb, requireAuth, requirePermission('team:invite'), asyncHandler(createInvitation));
  
  app.get('/api/audit/access-log', requireDb, requireAuth, requirePermission('audit:read'), asyncHandler(getAuditLogs));
  app.get('/api/settings/branches', requireDb, requireAuth, asyncHandler(getBranches));
  app.post('/api/settings/branches', requireDb, requireAuth, asyncHandler(createBranch));
  app.patch('/api/settings/branches/:id', requireDb, requireAuth, asyncHandler(updateBranch));
  app.delete('/api/settings/branches/:id', requireDb, requireAuth, asyncHandler(deleteBranch));

  app.get('/api/system/health', asyncHandler(getSystemHealth));

  app.get('/api/settings/business-rules', requireDb, requireAuth, asyncHandler(getBusinessRules));
  app.patch('/api/settings/business-rules', requireDb, requireAuth, asyncHandler(updateBusinessRules));
  app.get('/api/settings/production-rules', requireDb, requireAuth, asyncHandler(getProductionRules));
  app.patch('/api/settings/production-rules', requireDb, requireAuth, asyncHandler(updateProductionRules));
  app.get('/api/settings/modules', requireDb, requireAuth, asyncHandler(getModuleFlags));
  app.patch('/api/settings/modules', requireDb, requireAuth, asyncHandler(updateModuleFlags));

  // Reports & Documents Routes
  app.get('/api/reports/sales', requireDb, requireAuth, asyncHandler(getSalesReports));
  app.get('/api/reports/finance', requireDb, requireAuth, asyncHandler(getFinanceReports));
  app.get('/api/reports/inventory', requireDb, requireAuth, asyncHandler(getInventoryReports));
  app.post('/api/documents/generate', requireDb, requireAuth, asyncHandler(generateDocument));
  app.get('/api/documents', requireDb, requireAuth, asyncHandler(getDocuments));
  app.patch('/api/documents/:id/void', requireDb, requireAuth, asyncHandler(voidDocument));

  // ----------------------------------------------------------------------
  // STOREFRONT & ENQUIRIES - PUBLIC (No Auth)
  // ----------------------------------------------------------------------
  app.get('/api/storefront/products', asyncHandler(getStorefrontProducts));
  app.get('/api/storefront/subscription-plans', asyncHandler(getStorefrontPlans));
  app.post('/api/storefront/subscription-requests', asyncHandler(createSubscriptionRequest));

  // ----------------------------------------------------------------------
  // SUBSCRIPTIONS - ADMIN
  // ----------------------------------------------------------------------
  app.get('/api/subscriptions/plans', requireDb, requireAuth, asyncHandler(getPlans));
  app.post('/api/subscriptions/plans', requireDb, requireAuth, asyncHandler(createPlan));
  app.patch('/api/subscriptions/plans/:id', requireDb, requireAuth, asyncHandler(updatePlan));
  app.get('/api/subscriptions/requests', requireDb, requireAuth, asyncHandler(getRequests));
  app.patch('/api/subscriptions/requests/:id/status', requireDb, requireAuth, asyncHandler(updateRequestStatus));
  app.get('/api/subscriptions', requireDb, requireAuth, asyncHandler(getSubscriptions));
  app.patch('/api/subscriptions/:id/status', requireDb, requireAuth, asyncHandler(updateSubscriptionStatus));

  // ----------------------------------------------------------------------
  // PAYMENTS & WEBHOOKS
  // ----------------------------------------------------------------------
  // Public / Webhooks
  app.post('/api/payments/intents', asyncHandler(createPaymentIntentPublic));
  app.post('/api/payments/webhooks/:provider', asyncHandler(webhookHandler));

  // Admin
  app.get('/api/payments/intents', requireDb, requireAuth, requirePermission('finance:read'), asyncHandler(getIntents));
  app.post('/api/payments/intents/:id/mark-paid-manual', requireDb, requireAuth, requirePermission('finance:write'), asyncHandler(markAsPaidManual));
  app.post('/api/payments/intents/:id/cancel', requireDb, requireAuth, requirePermission('finance:write'), asyncHandler(cancelIntent));
  app.get('/api/payments/webhook-events', requireDb, requireAuth, requirePermission('finance:read'), asyncHandler(getWebhookEvents));
  app.get('/api/payments/provider-config', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getProviderConfig));
  app.patch('/api/payments/provider-config', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(updateProviderConfig));

  // Mercado Pago Admin
  app.get('/api/payments/mercadopago/connect-url', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(getConnectUrl));
  app.get('/api/payments/mercadopago/callback', requireDb, asyncHandler(oauthCallback));
  app.post('/api/payments/mercadopago/disconnect', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(disconnectMp));
  app.get('/api/payments/mercadopago/status', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getMpStatus));

  // Mercado Pago Webhook 
  app.post('/api/payments/mercadopago/webhook', requireDb, asyncHandler(mpWebhook));

  // ----------------------------------------------------------------------
  // CRM & COMMUNICATIONS
  // ----------------------------------------------------------------------
  app.get('/api/crm/pipelines', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getPipelines));
  app.post('/api/crm/pipelines', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createPipeline));
  app.get('/api/crm/deals', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getDeals));
  app.post('/api/crm/deals', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createDeal));
  app.patch('/api/crm/deals/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(updateDeal));
  app.patch('/api/crm/deals/:id/move', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(moveDeal));
  app.post('/api/crm/deals/:id/won', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(wonDeal));
  app.post('/api/crm/deals/:id/lost', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(lostDeal));
  
  app.get('/api/crm/activities', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getActivities));
  app.post('/api/crm/activities', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createActivity));
  app.patch('/api/crm/activities/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(updateActivity));
  app.patch('/api/crm/activities/:id/complete', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(completeActivity));
  app.post('/api/crm/activities/:id/reschedule', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(rescheduleActivity));

  app.get('/api/crm/templates', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getTemplates));
  app.post('/api/crm/templates', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(createTemplate));
  app.patch('/api/crm/templates/:id', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(updateTemplate));

  app.get('/api/crm/communications', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCommunications));
  app.post('/api/crm/communications/queue', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(queueCommunication));
  app.post('/api/crm/communications/:id/simulate', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(markCommunicationSimulated));
  
  app.get('/api/crm/conversations', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getConversations));
  app.post('/api/crm/conversations', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createConversation));
  app.get('/api/crm/conversations/:id', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getConversation));
  app.patch('/api/crm/conversations/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(updateConversation));
  app.post('/api/crm/conversations/:id/assign', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(assignConversation));
  app.post('/api/crm/conversations/:id/resolve', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(resolveConversation));
  app.post('/api/crm/conversations/:id/archive', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(archiveConversation));
  
  app.get('/api/crm/conversations/:conversationId/messages', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getMessages));
  app.post('/api/crm/conversations/:conversationId/messages', requireDb, requireAuth, requirePermission('crm:send_message'), asyncHandler(sendMessage));

  app.get('/api/crm/customers/:id/profile', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCustomerProfile));
  app.patch('/api/crm/customers/:id/preferences', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(updateCustomerPreferences));
  app.post('/api/crm/customers/:id/tags', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(addCustomerTag));
  app.delete('/api/crm/customers/:id/tags/:tag', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(removeCustomerTag));

  app.get('/api/crm/channels', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getChannelConnections));
  app.get('/api/crm/channels/whatsapp/status', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getWhatsappStatus));
  app.get('/api/crm/channels/whatsapp/connect-url', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(getWhatsappConnectUrl));
  app.post('/api/crm/channels/whatsapp/disconnect', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(disconnectWhatsapp));
  app.post('/api/crm/channels/whatsapp/test-message', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(testWhatsappMessage));
  app.post('/api/crm/channels/whatsapp/webhook', requireDb, asyncHandler(whatsappWebhook));
  
  app.get('/api/crm/channels/whatsapp/setup', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getWhatsappStatus));
  app.patch('/api/crm/channels/whatsapp/setup', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(saveWhatsappSetup));
  app.get('/api/crm/channels/whatsapp/webhook-info', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(getWhatsappWebhookInfo));
  app.post('/api/crm/channels/whatsapp/rotate', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(rotateWhatsappCredentials));
  app.post('/api/crm/channels/whatsapp/revoke', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(revokeWhatsappCredentials));
  app.post('/api/crm/channels/whatsapp/test-credentials', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(testWhatsappCredentials));
  
  app.get('/api/crm/channels/sms/setup', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getSmsStatus));
  app.patch('/api/crm/channels/sms/setup', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(saveSmsSetup));
  app.post('/api/crm/channels/sms/disable', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(disableSmsSetup));
  app.post('/api/crm/channels/sms/test-otp', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(smsOtpStart)); // Repurposed for test
  app.post('/api/crm/channels/sms/rotate', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(rotateSmsCredentials));
  app.post('/api/crm/channels/sms/revoke', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(revokeSmsCredentials));
  app.post('/api/crm/channels/sms/test-credentials', requireDb, requireAuth, requirePermission('crm:manage_channels'), asyncHandler(testSmsCredentials));
  
  app.get('/api/crm/campaigns', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCampaigns));
  app.post('/api/crm/campaigns', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createCampaign));
  app.patch('/api/crm/campaigns/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(updateCampaign));
  app.post('/api/crm/campaigns/:id/launch', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(launchCampaign));
  
  app.post('/api/crm/queue/process-once', requireDb, requireAuthOrCron, requirePermission('customers:write'), asyncHandler(processQueueOnce));
  
  app.post('/api/crm/queue/retry/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(retryQueueItem));
  app.post('/api/crm/queue/cancel/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(cancelQueueItem));
  app.get('/api/crm/queue/status', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getQueueStatus));
  app.get('/api/crm/diagnostics', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getDiagnostics));

  
  app.get('/api/crm/automations', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getAutomations));
  app.post('/api/crm/automations', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(createAutomation));
  
  // Phase 8B CRM Vertical
  app.get('/api/crm/special-orders', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getSpecialOrders));
  app.post('/api/crm/special-orders', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createSpecialOrder));
  app.patch('/api/crm/special-orders/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(updateSpecialOrder));
  
  app.get('/api/crm/calendar', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCalendarEvents));
  app.post('/api/crm/calendar/events', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createCalendarEvent));
  app.patch('/api/crm/calendar/events/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(updateCalendarEvent));
  
  app.get('/api/crm/loyalty/program', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getLoyaltyProgram));
  app.patch('/api/crm/loyalty/program', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(updateLoyaltyProgram));
  app.post('/api/crm/customers/:customerId/loyalty/adjust', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(adjustLoyaltyPoints));
  
  app.get('/api/crm/feedback', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getFeedback));
  app.post('/api/crm/feedback', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createFeedback));
  
  app.get('/api/crm/tickets', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getTickets));
  app.post('/api/crm/tickets', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(createTicket));
  app.post('/api/crm/tickets/:id/resolve', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(resolveTicket));
  
  app.post('/api/crm/customers/recalculate-scores', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(recalculateInsights));
  app.get('/api/crm/customers/:id/insights', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getCustomerInsights));

  app.post('/api/crm/sms/otp/start', requireDb, asyncHandler(smsOtpStart));
  app.post('/api/crm/sms/otp/check', requireDb, asyncHandler(smsOtpCheck));
  
  app.get('/api/crm/portal/:tenantSlug/session/:token', requireDb, asyncHandler(getPortalSession));
  app.post('/api/crm/portal/qr', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(generateQrToken));
  app.post('/api/crm/portal/qr/scan', requireDb, asyncHandler(trackQrScan));
  
  // ----------------------------------------------------------------------
  // ADVANCED PRODUCTION 
  // ----------------------------------------------------------------------
  app.get('/api/production/green-lots', requireDb, requireAuth, requirePermission('production:read'), asyncHandler(getGreenLots));
  app.post('/api/production/green-lots', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(createGreenLot));
  app.patch('/api/production/green-lots/:id', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(updateGreenLot));
  
  app.get('/api/production/recipes', requireDb, requireAuth, requirePermission('production:read'), asyncHandler(getRecipes));
  app.post('/api/production/recipes', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(createRecipe));
  app.patch('/api/production/recipes/:id', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(updateRecipe));
  
  app.get('/api/production/roast-profiles', requireDb, requireAuth, requirePermission('production:read'), asyncHandler(getRoastProfiles));
  app.post('/api/production/roast-profiles', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(createRoastProfile));
  app.patch('/api/production/roast-profiles/:id', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(updateRoastProfile));
  
  app.get('/api/production/demand', requireDb, requireAuth, requirePermission('production:read'), asyncHandler(getProductionDemand));
  app.post('/api/production/batches/from-demand', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(createBatchFromDemand));
  app.post('/api/production/batches/:id/reserve', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(reserveBatchInputs));
  app.post('/api/production/batches/:id/start', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(startBatch));
  app.post('/api/production/batches/:id/complete', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(completeBatch));
  app.post('/api/production/batches/:id/cancel', requireDb, requireAuth, requirePermission('production:write'), asyncHandler(advCancelBatch));
  
  // ----------------------------------------------------------------------
  // QUALITY CONTROL
  // ----------------------------------------------------------------------
  app.get('/api/quality/reviews', requireDb, requireAuth, requirePermission('quality:read'), asyncHandler(getReviews));
  app.post('/api/quality/reviews', requireDb, requireAuth, requirePermission('quality:write'), asyncHandler(createReview));
  app.patch('/api/quality/reviews/:id', requireDb, requireAuth, requirePermission('quality:write'), asyncHandler(updateReview));
  app.post('/api/quality/reviews/:id/approve', requireDb, requireAuth, requirePermission('quality:write'), asyncHandler(approveReview));
  app.post('/api/quality/reviews/:id/reject', requireDb, requireAuth, requirePermission('quality:write'), asyncHandler(rejectReview));
  app.get('/api/quality/descriptors', requireDb, requireAuth, requirePermission('quality:read'), asyncHandler(getDescriptors));
  app.get('/api/quality/defects', requireDb, requireAuth, requirePermission('quality:read'), asyncHandler(getDefects));

  // ----------------------------------------------------------------------
  // DIGITAL MENU - PUBLIC (No Auth)
  // ----------------------------------------------------------------------
  app.get('/api/public/menu/:slug', requireDb, asyncHandler(getPublicMenu));
  app.post('/api/public/menu/:slug/orders', requireDb, asyncHandler(createPublicOrder));
  app.get('/api/public/menu/:slug/orders/:id', requireDb, asyncHandler(getPublicOrder));

  // ----------------------------------------------------------------------
  // PUBLIC TRACEABILITY (No auth needed)
  // ----------------------------------------------------------------------
  app.get('/api/public/trace/:publicCode', requireDb, asyncHandler(getPublicTrace));

  // ----------------------------------------------------------------------
  // TRACEABILITY ADMIN
  // ----------------------------------------------------------------------
  app.get('/api/traceability', requireDb, requireAuth, requirePermission('traceability:read'), asyncHandler(getTraces));
  app.get('/api/traceability/:id', requireDb, requireAuth, requirePermission('traceability:read'), asyncHandler(getTraceById));
  app.post('/api/traceability/from-quality/:qualityReviewId', requireDb, requireAuth, requirePermission('traceability:write'), asyncHandler(createTraceFromQualityInfo));
  app.patch('/api/traceability/:id', requireDb, requireAuth, requirePermission('traceability:write'), asyncHandler(updateTrace));
  app.post('/api/traceability/:id/publish', requireDb, requireAuth, requirePermission('traceability:write'), asyncHandler(publishTrace));
  app.post('/api/traceability/:id/unpublish', requireDb, requireAuth, requirePermission('traceability:write'), asyncHandler(unpublishTrace));

  // ----------------------------------------------------------------------
  // B2B CATALOG
  // ----------------------------------------------------------------------
  app.get('/api/b2b/catalog', requireDb, requireAuth, requirePermission('b2b:read'), asyncHandler(getB2BCatalog));
  app.post('/api/b2b/catalog/items', requireDb, requireAuth, requirePermission('b2b:write'), asyncHandler(createB2BCatalogItem));
  app.patch('/api/b2b/catalog/items/:id', requireDb, requireAuth, requirePermission('b2b:write'), asyncHandler(updateB2BCatalogItem));

  // ----------------------------------------------------------------------
  // DIGITAL MENU (Admin)
  // ----------------------------------------------------------------------
  app.get('/api/digital-menu/config', requireDb, requireAuth, requirePermission('settings:read'), asyncHandler(getConfig));
  app.patch('/api/digital-menu/config', requireDb, requireAuth, requirePermission('settings:write'), asyncHandler(updateConfig));
  app.get('/api/digital-menu/categories', requireDb, requireAuth, requirePermission('products:read'), asyncHandler(getCategories));
  app.post('/api/digital-menu/categories', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(createCategory));
  app.patch('/api/digital-menu/categories/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(updateCategory));
  app.delete('/api/digital-menu/categories/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(deleteCategory));
  app.get('/api/digital-menu/items', requireDb, requireAuth, requirePermission('products:read'), asyncHandler(getItems));
  app.post('/api/digital-menu/items', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(createItem));
  app.patch('/api/digital-menu/items/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(updateItem));
  app.delete('/api/digital-menu/items/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(deleteItem));
  
  app.get('/api/digital-menu/modifiers', requireDb, requireAuth, requirePermission('products:read'), asyncHandler(getModifiers));
  app.post('/api/digital-menu/modifiers/groups', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(createModifierGroup));
  app.patch('/api/digital-menu/modifiers/groups/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(updateModifierGroup));
  app.delete('/api/digital-menu/modifiers/groups/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(deleteModifierGroup));
  app.post('/api/digital-menu/modifiers/options', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(createModifierOption));
  app.patch('/api/digital-menu/modifiers/options/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(updateModifierOption));
  app.delete('/api/digital-menu/modifiers/options/:id', requireDb, requireAuth, requirePermission('products:write'), asyncHandler(deleteModifierOption));

  app.get('/api/digital-menu/orders', requireDb, requireAuth, requirePermission('orders:read'), asyncHandler(getDigitalMenuOrders));
  app.patch('/api/digital-menu/orders/:id/status', requireDb, requireAuth, requirePermission('orders:write'), asyncHandler(updateOrderStatus));

  // Consignments Routes
  app.get('/api/partners', requireDb, requireAuth, requirePermission('customers:read'), asyncHandler(getPartners));
  app.post('/api/partners', requireDb, requireAuth, requirePermission('customers:write'), validate(createPartnerSchema), asyncHandler(createPartner));
  app.patch('/api/partners/:id', requireDb, requireAuth, requirePermission('customers:write'), asyncHandler(updatePartner));
  
  app.get('/api/consignments', requireDb, requireAuth, requirePermission('orders:read'), asyncHandler(getConsignments));
  app.get('/api/consignments/:id', requireDb, requireAuth, requirePermission('orders:read'), asyncHandler(getConsignmentById));
  app.post('/api/consignments', requireDb, requireAuth, requirePermission('orders:write'), validate(createConsignmentSchema), asyncHandler(createConsignment));
  app.patch('/api/consignments/:id/settle', requireDb, requireAuth, requirePermission('orders:write'), validate(settleConsignmentSchema), asyncHandler(settleConsignment));
  app.patch('/api/consignments/:id/cancel', requireDb, requireAuth, requirePermission('orders:write'), asyncHandler(cancelConsignment));

  // Finance Routes
  app.get('/api/finance/transactions', requireDb, requireAuth, requirePermission('finance:read'), asyncHandler(getTransactions));
  app.post('/api/finance/expenses', requireDb, requireAuth, requirePermission('finance:write'), validate(expenseSchema), asyncHandler(createExpense));
  app.patch('/api/finance/transactions/:id/pay', requireDb, requireAuth, requirePermission('finance:write'), asyncHandler(markAsPaid));
  app.patch('/api/finance/transactions/:id/cancel', requireDb, requireAuth, requirePermission('finance:write'), asyncHandler(cancelTransaction));
  app.get('/api/finance/summary', requireDb, requireAuth, requirePermission('finance:read'), asyncHandler(getFinancialSummary));
  app.get('/api/finance/cashflow', requireDb, requireAuth, requirePermission('finance:read'), asyncHandler(getCashFlow));
  app.get('/api/finance/dre', requireDb, requireAuth, requirePermission('finance:read'), asyncHandler(getSimpleDre));

  // Dashboard Routes
  app.get('/api/dashboard/summary', requireDb, requireAuth, requirePermission('dashboard:read'), asyncHandler(getSummary));
  app.get('/api/dashboard/alerts', requireDb, requireAuth, requirePermission('dashboard:read'), asyncHandler(getAlerts));
  app.get('/api/dashboard/recent-activity', requireDb, requireAuth, requirePermission('dashboard:read'), asyncHandler(getRecentActivity));

  app.get('/api/platform-debug', (req, res) => res.json({ debug: true }));
  // ----------------------------------------------------
  // Phase 7A: Platform SaaS Routes
  // ----------------------------------------------------
  app.post('/api/platform/signup', requireDb, asyncHandler(signup));
  app.get('/api/platform/signup/status', requireDb, asyncHandler(getSignupStatus));
  app.post('/api/platform/trial/start', requireDb, requireAuth, asyncHandler(startTrial));

  app.get('/api/platform/billing/plans', requireDb, requireAuth, asyncHandler(getPlatformPlans));
  app.post('/api/platform/billing/checkout', requireDb, requireAuth, asyncHandler(checkout));
  app.get('/api/platform/billing/subscription', requireDb, requireAuth, asyncHandler(getSubscription));
  app.post('/api/platform/billing/change-plan', requireDb, requireAuth, asyncHandler(changePlan));
  app.post('/api/platform/billing/cancel', requireDb, requireAuth, asyncHandler(cancelSubscription));
  app.get('/api/platform/billing/invoices', requireDb, requireAuth, asyncHandler(getInvoices));
  app.get('/api/platform/billing/portal', requireDb, requireAuth, asyncHandler(generatePortalUrl));
  app.get('/api/platform/billing/status', requireDb, requireAuth, asyncHandler(getBillingStatus));
  app.post('/api/platform/billing/webhook', requireDb, asyncHandler(billingWebhook)); // no auth, raw provider payload

  app.get('/api/platform/admin/tenants', requireDb, requireAuth, requirePermission('platform:admin'), asyncHandler(getTenants));
  app.get('/api/platform/admin/metrics', requireDb, requireAuth, requirePermission('platform:admin'), asyncHandler(getPlatformMetrics));
  app.post('/api/platform/admin/tenants/:id/status', requireDb, requireAuth, requirePermission('platform:admin'), asyncHandler(changeTenantStatus));
  // ----------------------------------------------------

  // Catch-all for undefined /api routes should return JSON, not Vite fallback
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use(errorHandler);


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start Communication Worker
  if (process.env.COMMUNICATION_WORKER_ENABLED === 'true') {
     const { startCommunicationWorker } = await import('./server/services/crm/communicationWorker');
     startCommunicationWorker();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
