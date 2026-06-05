export interface CrmPipelineRecord {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  isDefault: boolean;
  stages?: CrmStageRecord[];
}

export interface CrmStageRecord {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  color?: string | null;
}

export interface CrmDealRecord {
  id: string;
  pipelineId: string;
  stageId: string;
  customerId?: string | null;
  subscriptionRequestId?: string | null;
  paymentIntentId?: string | null;
  orderId?: string | null;
  title: string;
  value: number;
  status: string;
  priority: string;
  origin?: string | null;
  lostReason?: string | null;
  ownerUserId?: string | null;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  
  // Phase 8A: Local Food CRM fields
  customDataJson?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  eventTheme?: string | null;
  flavor?: string | null;
  deliveryTime?: string | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface CrmActivityRecord {
  id: string;
  dealId?: string | null;
  customerId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  status: string;
  dueAt?: string | null;
  completedAt?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
}

export interface CommunicationTemplateRecord {
  id: string;
  channel: string;
  category?: string | null;
  name: string;
  subject?: string | null;
  body: string;
  variablesJson?: string | null;
  language?: string;
  approvalStatus?: string;
  active: boolean;
}

export interface CommunicationQueueRecord {
  id: string;
  status: string;
  channel: string;
  provider: string;
  recipient: string;
  renderedBody: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  dealId?: string | null;
  customerId?: string | null;
}

export interface CrmConversationRecord {
  id: string;
  customerId?: string | null;
  dealId?: string | null;
  channel: string;
  status: string;
  assignedUserId?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CrmMessageRecord {
  id: string;
  conversationId: string;
  direction: string;
  body: string;
  deliveryStatus: string;
  internalNote: boolean;
  attachmentsJson?: string | null;
  createdAt: string;
}

export interface CrmChannelConnectionRecord {
  id: string;
  provider: string;
  status: string;
  phoneNumber?: string | null;
  displayName?: string | null;
  lastSyncAt?: string | null;
}

export interface CrmCampaignRecord {
  id: string;
  name: string;
  channel: string;
  status: string;
  segmentJson?: string | null;
  templateId?: string | null;
  scheduledAt?: string | null;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  failedCount: number;
  createdAt: string;
}

export interface CrmAutomationRecord {
  id: string;
  name: string;
  trigger: string;
  conditionsJson?: string | null;
  actionsJson: string;
  active: boolean;
  createdAt: string;
}

export interface SpecialOrderRecord {
  id: string;
  customerId: string;
  customer?: any;
  dealId?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  theme?: string | null;
  flavor?: string | null;
  filling?: string | null;
  topping?: string | null;
  deliveryMethod?: string | null;
  deliveryAddress?: string | null;
  depositAmount?: number;
  remainingAmount?: number;
  totalAmount?: number;
  productionDueAt?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

export interface CalendarEventRecord {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt?: string | null;
  allDay?: boolean;
  description?: string | null;
  status: string;
  createdAt: string;
}

export interface LoyaltyProgramRecord {
  id: string;
  pointsPerCurrency: number;
  rewardThresholdBronze?: number | null;
  rewardThresholdSilver?: number | null;
  rewardThresholdGold?: number | null;
  rewardThresholdBlack?: number | null;
  active: boolean;
}

export interface CustomerFeedbackRecord {
  id: string;
  customerId: string;
  customer?: any;
  score: number;
  comment?: string | null;
  createdAt: string;
}

export interface ServiceTicketRecord {
  id: string;
  customerId: string;
  customer?: any;
  feedbackId?: string | null;
  priority: string;
  category: string;
  status: string;
  resolution?: string | null;
  createdAt: string;
}

export interface CustomerInsightsRecord {
  riskOfChurn: boolean;
  purchaseFrequency: number;
  npsScore: number | null;
  orderCount: number;
}

export interface ICrmRepository {
  getPipelines(): Promise<CrmPipelineRecord[]>;
  createPipeline(data: Partial<CrmPipelineRecord>): Promise<CrmPipelineRecord>;
  
  getDeals(pipelineId?: string): Promise<CrmDealRecord[]>;
  createDeal(data: Partial<CrmDealRecord>): Promise<CrmDealRecord>;
  updateDeal(id: string, data: Partial<CrmDealRecord>): Promise<CrmDealRecord>;
  moveDeal(id: string, stageId: string): Promise<CrmDealRecord>;
  
  getActivities(dealId?: string, customerId?: string): Promise<CrmActivityRecord[]>;
  createActivity(data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord>;
  updateActivity(id: string, data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord>;

  getTemplates(): Promise<CommunicationTemplateRecord[]>;
  createTemplate(data: Partial<CommunicationTemplateRecord>): Promise<CommunicationTemplateRecord>;
  
  getCommunications(): Promise<CommunicationQueueRecord[]>;
  queueCommunication(data: Partial<CommunicationQueueRecord>): Promise<CommunicationQueueRecord>;
  markCommunicationSimulated(id: string): Promise<CommunicationQueueRecord>;

  getConversations(status?: string): Promise<CrmConversationRecord[]>;
  getConversation(id: string): Promise<CrmConversationRecord>;
  createConversation(data: any): Promise<CrmConversationRecord>;
  updateConversation(id: string, data: any): Promise<void>;
  assignConversation(id: string, assigneeId: string): Promise<void>;
  resolveConversation(id: string): Promise<CrmConversationRecord>;
  archiveConversation(id: string): Promise<void>;
  
  getMessages(conversationId: string): Promise<CrmMessageRecord[]>;
  sendMessage(conversationId: string, data: Partial<CrmMessageRecord>): Promise<CrmMessageRecord>;
  
  getChannelConnections(): Promise<CrmChannelConnectionRecord[]>;
  
  getCampaigns(): Promise<CrmCampaignRecord[]>;
  createCampaign(data: Partial<CrmCampaignRecord>): Promise<CrmCampaignRecord>;
  updateCampaign(id: string, data: Partial<CrmCampaignRecord>): Promise<CrmCampaignRecord>;
  launchCampaign(id: string): Promise<CrmCampaignRecord>;

  getQueueStatus(): Promise<any>;
  processQueueOnce(): Promise<any>;
  retryQueueItem(id: string): Promise<any>;
  cancelQueueItem(id: string): Promise<any>;
  getDiagnostics(): Promise<any>;

  getAutomations(): Promise<CrmAutomationRecord[]>;
  createAutomation(data: Partial<CrmAutomationRecord>): Promise<CrmAutomationRecord>;
  
  getCustomerProfile(id: string): Promise<any>;
  updateCustomerPreferences(id: string, data: any): Promise<void>;
  addCustomerTag(id: string, tag: string): Promise<void>;
  removeCustomerTag(id: string, tag: string): Promise<void>;
  
  startSmsOtp(phoneNumber: string): Promise<{status: string, message: string}>;
  checkSmsOtp(phoneNumber: string, otp: string): Promise<{token: string}>;
  generateQrToken(source: string, campaignId?: string): Promise<{token: string}>;

  // Phase 8B CRM Vertical
  getSpecialOrders(): Promise<SpecialOrderRecord[]>;
  createSpecialOrder(data: Partial<SpecialOrderRecord>): Promise<SpecialOrderRecord>;
  updateSpecialOrder(id: string, data: Partial<SpecialOrderRecord>): Promise<SpecialOrderRecord>;
  
  getCalendarEvents(): Promise<CalendarEventRecord[]>;
  createCalendarEvent(data: Partial<CalendarEventRecord>): Promise<CalendarEventRecord>;
  updateCalendarEvent(id: string, data: Partial<CalendarEventRecord>): Promise<CalendarEventRecord>;

  getLoyaltyProgram(): Promise<LoyaltyProgramRecord>;
  updateLoyaltyProgram(data: Partial<LoyaltyProgramRecord>): Promise<LoyaltyProgramRecord>;
  adjustLoyaltyPoints(customerId: string, points: number, description?: string, referenceId?: string): Promise<any>;

  getFeedback(): Promise<CustomerFeedbackRecord[]>;
  createFeedback(data: Partial<CustomerFeedbackRecord>): Promise<CustomerFeedbackRecord>;

  getTickets(): Promise<ServiceTicketRecord[]>;
  createTicket(data: Partial<ServiceTicketRecord>): Promise<ServiceTicketRecord>;
  resolveTicket(id: string, resolution: string): Promise<ServiceTicketRecord>;

  recalculateCustomerScores(): Promise<void>;
  getCustomerInsights(customerId: string): Promise<CustomerInsightsRecord | null>;
}
