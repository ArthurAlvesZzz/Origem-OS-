import { 
  ICrmRepository, CrmPipelineRecord, CrmStageRecord, CrmDealRecord, 
  CrmActivityRecord, CommunicationTemplateRecord, CommunicationQueueRecord,
  CrmConversationRecord, CrmMessageRecord, CrmChannelConnectionRecord
} from '../interfaces/ICrmRepository';

export class MockCrmRepository implements ICrmRepository {
  private pipelines: CrmPipelineRecord[] = [];
  private stages: CrmStageRecord[] = [];
  private deals: CrmDealRecord[] = [];
  private activities: CrmActivityRecord[] = [];
  private templates: CommunicationTemplateRecord[] = [];
  private queues: CommunicationQueueRecord[] = [];
  private conversations: CrmConversationRecord[] = [];
  private messages: CrmMessageRecord[] = [];
  private connections: CrmChannelConnectionRecord[] = [];

  constructor() {
    this.pipelines.push({
      id: 'pipeline-delivery',
      tenantId: '1',
      name: 'Atendimento / Delivery',
      type: 'delivery',
      isDefault: true,
      stages: [
        { id: 'stg-del-1', pipelineId: 'pipeline-delivery', name: 'Novo contato', order: 1 },
        { id: 'stg-del-2', pipelineId: 'pipeline-delivery', name: 'Escolheu produto', order: 2 },
        { id: 'stg-del-3', pipelineId: 'pipeline-delivery', name: 'Pedido confirmado', order: 3 },
        { id: 'stg-del-4', pipelineId: 'pipeline-delivery', name: 'Saiu para entrega', order: 4 },
        { id: 'stg-del-5', pipelineId: 'pipeline-delivery', name: 'Pós-venda', order: 5 },
      ]
    });
    this.pipelines.push({
      id: 'pipeline-encomendas',
      tenantId: '1',
      name: 'Encomendas / Eventos',
      type: 'events',
      isDefault: false,
      stages: [
        { id: 'stg-enc-1', pipelineId: 'pipeline-encomendas', name: 'Novo orçamento', order: 1 },
        { id: 'stg-enc-2', pipelineId: 'pipeline-encomendas', name: 'Aguardando sinal', order: 2 },
        { id: 'stg-enc-3', pipelineId: 'pipeline-encomendas', name: 'Produção agendada', order: 3 },
        { id: 'stg-enc-4', pipelineId: 'pipeline-encomendas', name: 'Pronto / Entregue', order: 4 },
      ]
    });
    this.pipelines.push({
      id: 'pipeline-b2b',
      tenantId: '1',
      name: 'B2B / Coffee Break',
      type: 'b2b',
      isDefault: false,
      stages: [
        { id: 'stg-b2b-1', pipelineId: 'pipeline-b2b', name: 'Lead B2B', order: 1 },
        { id: 'stg-b2b-2', pipelineId: 'pipeline-b2b', name: 'Qualificação', order: 2 },
        { id: 'stg-b2b-3', pipelineId: 'pipeline-b2b', name: 'Proposta enviada', order: 3 },
        { id: 'stg-b2b-4', pipelineId: 'pipeline-b2b', name: 'Fechado', order: 4 },
      ]
    });

    this.deals.push({
      id: 'deal-1',
      pipelineId: 'pipeline-delivery',
      stageId: 'stg-del-1',
      title: 'Aline - Assinatura Mensal',
      value: 120,
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ flavor: 'Chocolate', deliveryTime: '14:30' })
    });
    this.deals.push({
      id: 'deal-2',
      pipelineId: 'pipeline-delivery',
      stageId: 'stg-del-2',
      title: 'Pedro - 2 Cafés + Croissant',
      value: 65,
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ items: 'Cafe Latte, Croissant' })
    });
    this.deals.push({
      id: 'deal-3',
      pipelineId: 'pipeline-delivery',
      stageId: 'stg-del-3',
      title: 'Lucas - Delivery Ifood',
      value: 154,
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ address: 'Av Paulista 1000' })
    });
    this.deals.push({
      id: 'deal-4',
      pipelineId: 'pipeline-delivery',
      stageId: 'stg-del-4',
      title: 'Mariana - Pacote Especial',
      value: 200,
      status: 'open',
      priority: 'low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({})
    });
    this.deals.push({
      id: 'deal-5',
      pipelineId: 'pipeline-encomendas',
      stageId: 'stg-enc-1',
      title: 'Festa 50 pessoas (João)',
      value: 800,
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ eventDate: '2026-08-10', guestCount: 50, eventTheme: 'Floral' })
    });
    this.deals.push({
      id: 'deal-6',
      pipelineId: 'pipeline-encomendas',
      stageId: 'stg-enc-2',
      title: 'Casamento 200 pessoas',
      value: 4500,
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ eventDate: '2026-11-20', guestCount: 200 })
    });
    this.deals.push({
      id: 'deal-7',
      pipelineId: 'pipeline-encomendas',
      stageId: 'stg-enc-3',
      title: 'Aniversário Infantil (Carros)',
      value: 1200,
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ eventDate: '2026-06-25' })
    });
    this.deals.push({
      id: 'deal-8',
      pipelineId: 'pipeline-b2b',
      stageId: 'stg-b2b-1',
      title: 'Agência de Publicidade - Mensal',
      value: 600,
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ company: 'Agência XPTO' })
    });
    this.deals.push({
      id: 'deal-9',
      pipelineId: 'pipeline-b2b',
      stageId: 'stg-b2b-2',
      title: 'Empresa Tech - Fornecimento',
      value: 1500,
      status: 'open',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ company: 'Tech Solutions' })
    });
    this.deals.push({
      id: 'deal-10',
      pipelineId: 'pipeline-b2b',
      stageId: 'stg-b2b-3',
      title: 'Startup Local - Lanche 20x',
      value: 800,
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customDataJson: JSON.stringify({ company: 'Local Start' })
    });
    this.conversations.push({
      id: 'conv-1',
      customerId: 'cid-1',
      channel: 'whatsapp_baileys',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: 'Aline Souza',
      lastMessage: 'Oi, queria saber sobre as assinaturas de café',
      unreadCount: 1
    } as any);
    this.conversations.push({
      id: 'conv-2',
      customerId: 'cid-2',
      channel: 'whatsapp_baileys',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: 'Empório Trindade',
      lastMessage: 'Vcs entregam na zona sul?',
      unreadCount: 3
    } as any);
  }

  async getPipelines(): Promise<CrmPipelineRecord[]> {
    return this.pipelines;
  }

  async createPipeline(data: Partial<CrmPipelineRecord>): Promise<CrmPipelineRecord> {
    const p = { ...data, id: Date.now().toString() } as CrmPipelineRecord;
    this.pipelines.push(p);
    return p;
  }

  async getDeals(pipelineId?: string): Promise<CrmDealRecord[]> {
    if (pipelineId) return this.deals.filter(d => d.pipelineId === pipelineId);
    return this.deals;
  }

  async createDeal(data: Partial<CrmDealRecord>): Promise<CrmDealRecord> {
    const d = { 
      ...data, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as CrmDealRecord;
    this.deals.push(d);
    return d;
  }

  async updateDeal(id: string, data: Partial<CrmDealRecord>): Promise<CrmDealRecord> {
    const index = this.deals.findIndex(d => d.id === id);
    if(index === -1) throw new Error('Not found');
    this.deals[index] = { ...this.deals[index], ...data, updatedAt: new Date().toISOString() };
    return this.deals[index];
  }

  async moveDeal(id: string, stageId: string): Promise<CrmDealRecord> {
    const index = this.deals.findIndex(d => d.id === id);
    if(index === -1) throw new Error('Not found');
    this.deals[index].stageId = stageId;
    this.deals[index].updatedAt = new Date().toISOString();
    return this.deals[index];
  }

  async getActivities(dealId?: string, customerId?: string): Promise<CrmActivityRecord[]> {
    return this.activities.filter(a => (dealId && a.dealId === dealId) || (customerId && a.customerId === customerId));
  }

  async createActivity(data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord> {
    const a = { ...data, status: data.status || 'pending', id: Date.now().toString(), createdAt: new Date().toISOString() } as CrmActivityRecord;
    this.activities.unshift(a);
    return a;
  }

  async updateActivity(id: string, data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord> {
    const idx = this.activities.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Not found');
    this.activities[idx] = { ...this.activities[idx], ...data };
    return this.activities[idx];
  }

  async getTemplates(): Promise<CommunicationTemplateRecord[]> {
    if (this.templates.length === 0) {
      return [
        { id: 't1', channel: 'whatsapp', name: 'Boas-Vindas Cliente Novo', category: 'marketing', body: 'Olá {{name}}! Seja bem-vindo à nossa cafeteria.', active: true, approvalStatus: 'approved', language: 'pt_BR' },
        { id: 't2', channel: 'whatsapp', name: 'Pedido Confirmado (Delivery)', category: 'utility', body: 'Seu pedido #{{order_id}} foi confirmado e já está em preparo!', active: true, approvalStatus: 'approved', language: 'pt_BR' },
        { id: 't3', channel: 'whatsapp', name: 'Pós-venda Avaliação', category: 'marketing', body: 'Oi {{name}}, o que achou do seu pedido? Responda com uma nota de 1 a 10!', active: true, approvalStatus: 'approved', language: 'pt_BR' }
      ];
    }
    return this.templates;
  }

  async createTemplate(data: Partial<CommunicationTemplateRecord>): Promise<CommunicationTemplateRecord> {
    const t = { ...data, id: Date.now().toString() } as CommunicationTemplateRecord;
    this.templates.push(t);
    return t;
  }

  async getCommunications(): Promise<CommunicationQueueRecord[]> {
    return this.queues;
  }

  async queueCommunication(data: Partial<CommunicationQueueRecord>): Promise<CommunicationQueueRecord> {
    const q = { 
      ...data, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    } as CommunicationQueueRecord;
    this.queues.unshift(q);
    return q;
  }

  async markCommunicationSimulated(id: string): Promise<CommunicationQueueRecord> {
    const index = this.queues.findIndex(q => q.id === id);
    if(index === -1) throw new Error('Not found');
    this.queues[index].status = 'simulated';
    this.queues[index].sentAt = new Date().toISOString();
    return this.queues[index];
  }

  async getConversations(status?: string): Promise<CrmConversationRecord[]> {
    if (status) return this.conversations.filter(c => c.status === status);
    return this.conversations;
  }

  async getConversation(id: string): Promise<CrmConversationRecord> {
    const c = this.conversations.find(c => c.id === id);
    if (!c) throw new Error('Not found');
    return c;
  }

  async resolveConversation(id: string): Promise<CrmConversationRecord> {
    const idx = this.conversations.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Not found');
    this.conversations[idx] = { ...this.conversations[idx], status: 'resolved' };
    return this.conversations[idx];
  }

  async archiveConversation(id: string): Promise<void> {
    const idx = this.conversations.findIndex(c => c.id === id);
    if (idx === -1) return;
    this.conversations[idx] = { ...this.conversations[idx], status: 'archived' };
  }

  async getMessages(conversationId: string): Promise<CrmMessageRecord[]> {
    return this.messages.filter(m => m.conversationId === conversationId);
  }

  async sendMessage(conversationId: string, data: Partial<CrmMessageRecord>): Promise<CrmMessageRecord> {
    const m = {
      ...data,
      conversationId,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    } as CrmMessageRecord;
    this.messages.push(m);
    return m;
  }

  async getChannelConnections(): Promise<CrmChannelConnectionRecord[]> {
    return this.connections;
  }

  async getCampaigns(): Promise<any[]> {
    const saved = localStorage.getItem('mock_crm_campaigns');
    if (saved) return JSON.parse(saved);
    return [];
  }

  async createCampaign(data: any): Promise<any> {
    const campaigns = await this.getCampaigns();
    const newCamp = { ...data, id: `camp_${Date.now()}`, status: 'draft' };
    campaigns.push(newCamp);
    localStorage.setItem('mock_crm_campaigns', JSON.stringify(campaigns));
    return newCamp;
  }
  
  async updateCampaign(id: string, data: any): Promise<any> {
    const campaigns = await this.getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Not found');
    campaigns[index] = { ...campaigns[index], ...data };
    localStorage.setItem('mock_crm_campaigns', JSON.stringify(campaigns));
    return campaigns[index];
  }

  async launchCampaign(id: string): Promise<any> {
    const campaigns = await this.getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Not found');
    campaigns[index].status = 'completed';
    localStorage.setItem('mock_crm_campaigns', JSON.stringify(campaigns));
    return campaigns[index];
  }

  async getQueueStatus(): Promise<any> {
    return { queued: 5, recentSent24h: 12 };
  }

  async processQueueOnce(): Promise<any> {
    return { processed: 5, items: [] };
  }

  async retryQueueItem(id: string): Promise<any> {
    return { status: 'ok' };
  }

  async cancelQueueItem(id: string): Promise<any> {
    return { status: 'ok' };
  }
  
  async getDiagnostics(): Promise<any> {
    return {
      worker: { isRunning: true, enabled: true, lastDispatchAttempt: new Date() },
      providers: { sms: 'mock', whatsapp: 'manual_wa_link' },
      stats: { queued: 5, failed: 1 }
    };
  }

  async getAutomations(): Promise<any[]> {
    const saved = localStorage.getItem('mock_crm_automations');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Palavra-chave: Cardápio', trigger: 'keyword_cardapio', status: 'active', createdAt: new Date().toISOString() },
      { id: '2', name: 'Palavra-chave: Grãos', trigger: 'keyword_cafe', status: 'active', createdAt: new Date().toISOString() },
      { id: '3', name: 'Pós-venda Delivery (2h)', trigger: 'order_delivered', status: 'active', createdAt: new Date().toISOString() },
      { id: '4', name: 'Alerta VIP Retorno (15d)', trigger: 'vip_no_purchase', status: 'active', createdAt: new Date().toISOString() }
    ];
  }

  async createAutomation(data: any): Promise<any> {
    const automations = await this.getAutomations();
    const newAuto = { ...data, id: `auto_${Date.now()}` };
    automations.push(newAuto);
    localStorage.setItem('mock_crm_automations', JSON.stringify(automations));
    return newAuto;
  }

  async createConversation(data: any): Promise<any> {
    return { ...data, id: 'conv_new' };
  }

  async updateConversation(id: string, data: any): Promise<void> {}

  async assignConversation(id: string, assigneeId: string): Promise<void> {}

  async getCustomerProfile(id: string): Promise<any> {
    return { id, name: 'Mock Customer' };
  }

  async updateCustomerPreferences(id: string, data: any): Promise<void> {}

  async addCustomerTag(id: string, tag: string): Promise<void> {}

  async removeCustomerTag(id: string, tag: string): Promise<void> {}

  async startSmsOtp(phoneNumber: string): Promise<{status: string, message: string}> {
    return { status: 'ok', message: 'Mock OTP initialized. Use 123456.' };
  }
  
  async checkSmsOtp(phoneNumber: string, otp: string): Promise<{token: string}> {
    if (otp !== '123456') throw new Error('Invalid OTP');
    return { token: 'mock_token_123' };
  }
  
  async generateQrToken(source: string, campaignId?: string): Promise<{token: string}> {
    return { token: `mock_qr_${Date.now()}` };
  }

  // Phase 8B CRM Vertical Mocks
  async getSpecialOrders(): Promise<any[]> { return []; }
  async createSpecialOrder(data: any): Promise<any> { return { id: 'so_1', ...data }; }
  async updateSpecialOrder(id: string, data: any): Promise<any> { return { id, ...data }; }

  async getCalendarEvents(): Promise<any[]> { return []; }
  async createCalendarEvent(data: any): Promise<any> { return { id: 'evt_1', ...data }; }
  async updateCalendarEvent(id: string, data: any): Promise<any> { return { id, ...data }; }

  async getLoyaltyProgram(): Promise<any> { return { active: true, pointsPerCurrency: 1 }; }
  async updateLoyaltyProgram(data: any): Promise<any> { return { ...data }; }
  async adjustLoyaltyPoints(customerId: string, points: number, description?: string, referenceId?: string): Promise<any> { return {}; }

  async getFeedback(): Promise<any[]> { return []; }
  async createFeedback(data: any): Promise<any> { return { id: 'fb_1', ...data }; }

  async getTickets(): Promise<any[]> { return []; }
  async createTicket(data: any): Promise<any> { return { id: 'tkt_1', ...data }; }
  async resolveTicket(id: string, resolution: string): Promise<any> { return { id, resolution, status: 'resolved' }; }

  async recalculateCustomerScores(): Promise<void> {}
  async getCustomerInsights(customerId: string): Promise<any> { return { riskOfChurn: false, purchaseFrequency: 0, orderCount: 0, npsScore: null }; }
}

