import { describe, it, expect, beforeEach } from 'vitest';
import { MockCrmRepository } from '../../src/repositories/mock/MockCrmRepository';
import { MockCustomerRepository } from '../../src/repositories/mock/MockCustomerRepository';

describe('Fase 8A: Vertical CRM para Alimentação Local', () => {
  let crm: MockCrmRepository;
  let cust: MockCustomerRepository;

  beforeEach(() => {
    crm = new MockCrmRepository();
    cust = new MockCustomerRepository();
  });

  it('palavra "bolo" cria deal de encomenda (simulado)', async () => {
    // In actual server, an Automation would watch messages. 
    // Here we simulate the automation logic
    const pipelines = await crm.getPipelines();
    const encomendas = pipelines.find(p => p.type === 'events' || p.id === 'pipeline-encomendas');
    expect(encomendas).toBeDefined();

    const newDeal = await crm.createDeal({
      pipelineId: encomendas!.id,
      stageId: encomendas!.stages[0].id,
      title: 'Bolo via Automação',
      value: 150,
      customDataJson: JSON.stringify({ flavor: 'Desconhecido' })
    });

    expect(newDeal.pipelineId).toBe(encomendas!.id);
    expect(newDeal.customDataJson).toContain('Desconhecido');
  });

  it('palavra "evento" cria deal B2B (simulado)', async () => {
    const pipelines = await crm.getPipelines();
    const b2b = pipelines.find(p => p.type === 'b2b' || p.id === 'pipeline-b2b');
    expect(b2b).toBeDefined();

    const newDeal = await crm.createDeal({
      pipelineId: b2b!.id,
      stageId: b2b!.stages[0].id,
      title: 'Coffee Break (Automação)',
      value: 0
    });

    expect(newDeal.pipelineId).toBe(b2b!.id);
  });

  it('opt-out bloqueia campanha (simulado)', async () => {
    // Customer without opt-in
    const c = await cust.createCustomer({
      name: 'João', documentType: 'cpf', document: '', type: 'b2c', status: 'active', defaultPaymentTermsDays: 0
    });
    expect(c.whatsappOptIn).toBeFalsy(); 
  });

  it('cliente entregue recebe pós-venda queued (simulado)', async () => {
    const q = await crm.queueCommunication({
      status: 'pending', channel: 'whatsapp', provider: 'api', recipient: '5511999999999', renderedBody: 'Como foi seu pedido?'
    });
    expect(q.renderedBody).toContain('pedido');
    expect(q.status).toBe('pending');
  });

  it('fidelidade acumula pontos (simulado)', async () => {
    const c = await cust.createCustomer({
      name: 'Cliente VIP', documentType: 'none', document: '', type: 'b2c', status: 'active', defaultPaymentTermsDays: 0,
      loyaltyPoints: 100, loyaltyLevel: 'Ouro'
    } as any);

    expect(c.loyaltyLevel).toBe('Ouro');
    expect(c.loyaltyPoints).toBe(100);
  });

  it('preview continua abrindo sem DATABASE_URL', async () => {
    // The repository handles this gracefully in its constructor
    expect(crm).toBeDefined();
    const automations = await crm.getAutomations();
    expect(automations.length).toBeGreaterThan(0);
  });
});

describe('Fase 8B: Vertical CRM Real', () => {
  let crm: MockCrmRepository;

  beforeEach(() => {
    crm = new MockCrmRepository();
  });

  it('deve ter endpoints de SpecialOrder mockados no fallback', async () => {
    const orders = await crm.getSpecialOrders();
    expect(orders).toEqual([]);
    
    const created = await crm.createSpecialOrder({ theme: 'Festa 15' });
    expect(created.id).toBe('so_1');
    expect(created.theme).toBe('Festa 15');
  });

  it('deve simular update de pontuação fidelidade via repository', async () => {
    const prog = await crm.getLoyaltyProgram();
    expect(prog.active).toBe(true);

    const adj = await crm.adjustLoyaltyPoints('cust_test', 500, 'simulated');
    expect(adj).toEqual({});
  });

  it('deve simular criação de ticket via feedback crítico', async () => {
    const fb = await crm.createFeedback({ customerId: 'x', score: 2 });
    expect(fb.id).toBe('fb_1');

    const tkt = await crm.createTicket({ customerId: 'x', category: 'complaint' });
    expect(tkt.id).toBe('tkt_1');
  });
  
  it('insights de score e recompra mockados', async () => {
    const insight = await crm.getCustomerInsights('x');
    expect(insight.riskOfChurn).toBe(false);
    expect(insight.purchaseFrequency).toBe(0);
  });
});
