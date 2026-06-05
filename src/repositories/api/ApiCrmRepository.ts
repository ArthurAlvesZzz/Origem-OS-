import { 
  ICrmRepository, CrmPipelineRecord, CrmDealRecord, 
  CrmActivityRecord, CommunicationTemplateRecord, CommunicationQueueRecord 
} from '../interfaces/ICrmRepository';
import { safeFetch } from './apiClient';

export class ApiCrmRepository implements ICrmRepository {
  private getHeaders() {
    const token = localStorage.getItem('gestaoos_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getPipelines(): Promise<CrmPipelineRecord[]> {
    const res = await safeFetch('/api/crm/pipelines', { headers: this.getHeaders() });
    return res.data;
  }

  async createPipeline(data: Partial<CrmPipelineRecord>): Promise<CrmPipelineRecord> {
    const res = await safeFetch('/api/crm/pipelines', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getDeals(pipelineId?: string): Promise<CrmDealRecord[]> {
    const url = pipelineId ? `/api/crm/deals?pipelineId=${pipelineId}` : '/api/crm/deals';
    const res = await safeFetch(url, { headers: this.getHeaders() });
    return res.data;
  }

  async createDeal(data: Partial<CrmDealRecord>): Promise<CrmDealRecord> {
    const res = await safeFetch('/api/crm/deals', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateDeal(id: string, data: Partial<CrmDealRecord>): Promise<CrmDealRecord> {
    const res = await safeFetch(`/api/crm/deals/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async moveDeal(id: string, stageId: string): Promise<CrmDealRecord> {
    const res = await safeFetch(`/api/crm/deals/${id}/move`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ stageId })
    });
    return res.data;
  }

  async getActivities(dealId?: string, customerId?: string): Promise<CrmActivityRecord[]> {
    const params = new URLSearchParams();
    if(dealId) params.append('dealId', dealId);
    if(customerId) params.append('customerId', customerId);
    
    const res = await safeFetch(`/api/crm/activities?${params.toString()}`, { headers: this.getHeaders() });
    return res.data;
  }

  async createActivity(data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord> {
    const res = await safeFetch('/api/crm/activities', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateActivity(id: string, data: Partial<CrmActivityRecord>): Promise<CrmActivityRecord> {
    const res = await safeFetch(`/api/crm/activities/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getTemplates(): Promise<CommunicationTemplateRecord[]> {
    const res = await safeFetch('/api/crm/templates', { headers: this.getHeaders() });
    return res.data;
  }

  async createTemplate(data: Partial<CommunicationTemplateRecord>): Promise<CommunicationTemplateRecord> {
    const res = await safeFetch('/api/crm/templates', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async getCommunications(): Promise<CommunicationQueueRecord[]> {
    const res = await safeFetch('/api/crm/communications', { headers: this.getHeaders() });
    return res.data;
  }

  async queueCommunication(data: Partial<CommunicationQueueRecord>): Promise<CommunicationQueueRecord> {
    const res = await safeFetch('/api/crm/communications/queue', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async markCommunicationSimulated(id: string): Promise<CommunicationQueueRecord> {
    const res = await safeFetch(`/api/crm/communications/${id}/simulate`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.data;
  }

  getConversations(status?: string): Promise<any[]> {
    const url = status ? `/api/crm/conversations?status=${status}` : '/api/crm/conversations';
    return safeFetch(url, { headers: this.getHeaders() }).then(res => res.data);
  }

  async getConversation(id: string): Promise<any> {
    const res = await safeFetch(`/api/crm/conversations/${id}`, { headers: this.getHeaders() });
    return res.data;
  }

  async resolveConversation(id: string): Promise<any> {
    const res = await safeFetch(`/api/crm/conversations/${id}/resolve`, { method: 'POST', headers: this.getHeaders() });
    return res.data;
  }

  async archiveConversation(id: string): Promise<void> {
    await safeFetch(`/api/crm/conversations/${id}/archive`, { method: 'POST', headers: this.getHeaders() });
  }

  getMessages(conversationId: string): Promise<any[]> {
    return safeFetch(`/api/crm/conversations/${conversationId}/messages`, { headers: this.getHeaders() }).then(res => res.data);
  }

  async sendMessage(conversationId: string, data: any): Promise<any> {
    const res = await safeFetch(`/api/crm/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  getChannelConnections(): Promise<any[]> {
    return safeFetch('/api/crm/channels', { headers: this.getHeaders() }).then(res => res.data);
  }

  async getCampaigns(): Promise<any[]> {
    return safeFetch('/api/crm/campaigns', { headers: this.getHeaders() }).then(res => res.data);
  }

  async createCampaign(data: any): Promise<any> {
    const res = await safeFetch('/api/crm/campaigns', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }
  
  async updateCampaign(id: string, data: any): Promise<any> {
    const res = await safeFetch(`/api/crm/campaigns/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async launchCampaign(id: string): Promise<any> {
    const res = await safeFetch(`/api/crm/campaigns/${id}/launch`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.data;
  }

  async getQueueStatus(): Promise<any> {
    return safeFetch('/api/crm/queue/status', { headers: this.getHeaders() }).then(res => res.data);
  }

  async processQueueOnce(): Promise<any> {
    const res = await safeFetch('/api/crm/queue/process-once', {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.data;
  }

  async retryQueueItem(id: string): Promise<any> {
    const res = await safeFetch(`/api/crm/queue/retry/${id}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.data;
  }

  async cancelQueueItem(id: string): Promise<any> {
    const res = await safeFetch(`/api/crm/queue/cancel/${id}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.data;
  }

  async getDiagnostics(): Promise<any> {
    return safeFetch('/api/crm/diagnostics', { headers: this.getHeaders() }).then(res => res.data);
  }

  getAutomations(): Promise<any[]> {
    return safeFetch('/api/crm/automations', { headers: this.getHeaders() }).then(res => res.data);
  }

  async createAutomation(data: any): Promise<any> {
    const res = await safeFetch('/api/crm/automations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async createConversation(data: any): Promise<any> {
    const res = await safeFetch('/api/crm/conversations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.data;
  }

  async updateConversation(id: string, data: any): Promise<void> {
    await safeFetch(`/api/crm/conversations/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
  }

  async assignConversation(id: string, assigneeId: string): Promise<void> {
    await safeFetch(`/api/crm/conversations/${id}/assign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ assigneeId })
    });
  }

  async getCustomerProfile(id: string): Promise<any> {
    return safeFetch(`/api/crm/customers/${id}/profile`, { headers: this.getHeaders() }).then(res => res.data);
  }

  async updateCustomerPreferences(id: string, data: any): Promise<void> {
    await safeFetch(`/api/crm/customers/${id}/preferences`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
  }

  async addCustomerTag(id: string, tag: string): Promise<void> {
    await safeFetch(`/api/crm/customers/${id}/tags`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ tag })
    });
  }

  async removeCustomerTag(id: string, tag: string): Promise<void> {
    await safeFetch(`/api/crm/customers/${id}/tags/${tag}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
  }

  async startSmsOtp(phoneNumber: string): Promise<{status: string, message: string}> {
    const res = await safeFetch('/api/crm/sms/otp/start', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
    return res.data;
  }

  async checkSmsOtp(phoneNumber: string, otp: string): Promise<{token: string}> {
    const res = await safeFetch('/api/crm/sms/otp/check', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp })
    });
    return res.data;
  }

  async generateQrToken(source: string, campaignId?: string): Promise<{token: string}> {
    const res = await safeFetch('/api/crm/portal/qr', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ source, campaignId })
    });
    return res.data;
  }

  // Phase 8B CRM Vertical
  getSpecialOrders(): Promise<any[]> {
    return safeFetch('/api/crm/special-orders', { headers: this.getHeaders() }).then(r => r.data);
  }
  async createSpecialOrder(data: any): Promise<any> {
    const res = await safeFetch('/api/crm/special-orders', {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return res.data;
  }
  async updateSpecialOrder(id: string, data: any): Promise<any> {
    const res = await safeFetch(`/api/crm/special-orders/${id}`, {
      method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return res.data;
  }

  getCalendarEvents(): Promise<any[]> {
    return safeFetch('/api/crm/calendar', { headers: this.getHeaders() }).then(r => r.data);
  }
  async createCalendarEvent(data: any): Promise<any> {
    const res = await safeFetch('/api/crm/calendar/events', {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return res.data;
  }
  async updateCalendarEvent(id: string, data: any): Promise<any> {
    const res = await safeFetch(`/api/crm/calendar/events/${id}`, {
      method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return res.data;
  }

  getLoyaltyProgram(): Promise<any> {
    return safeFetch('/api/crm/loyalty/program', { headers: this.getHeaders() }).then(r => r.data);
  }
  async updateLoyaltyProgram(data: any): Promise<any> {
    const res = await safeFetch('/api/crm/loyalty/program', {
      method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return res.data;
  }
  async adjustLoyaltyPoints(customerId: string, points: number, description?: string, referenceId?: string): Promise<any> {
    const res = await safeFetch(`/api/crm/customers/${customerId}/loyalty/adjust`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify({ points, description, referenceId })
    });
    return res.data;
  }

  getFeedback(): Promise<any[]> {
    return safeFetch('/api/crm/feedback', { headers: this.getHeaders() }).then(r => r.data);
  }
  async createFeedback(data: any): Promise<any> {
    const res = await safeFetch('/api/crm/feedback', {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return res.data;
  }

  getTickets(): Promise<any[]> {
    return safeFetch('/api/crm/tickets', { headers: this.getHeaders() }).then(r => r.data);
  }
  async createTicket(data: any): Promise<any> {
    const res = await safeFetch('/api/crm/tickets', {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return res.data;
  }
  async resolveTicket(id: string, resolution: string): Promise<any> {
    const res = await safeFetch(`/api/crm/tickets/${id}/resolve`, {
       method: 'POST', headers: this.getHeaders(), body: JSON.stringify({ resolution })
    });
    return res.data;
  }

  async recalculateCustomerScores(): Promise<void> {
    await safeFetch('/api/crm/customers/recalculate-scores', {
      method: 'POST', headers: this.getHeaders()
    });
  }
  getCustomerInsights(customerId: string): Promise<any> {
    return safeFetch(`/api/crm/customers/${customerId}/insights`, { headers: this.getHeaders() }).then(r => r.data);
  }
}
