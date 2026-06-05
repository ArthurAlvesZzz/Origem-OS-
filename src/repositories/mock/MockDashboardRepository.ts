import { IDashboardRepository } from '../interfaces/IDashboardRepository';
import { DashboardSummary, DashboardAlert, DashboardActivity, DashboardInsight } from '../../domain/types';

export class MockDashboardRepository implements IDashboardRepository {
  async getSummary(): Promise<DashboardSummary> {
    const today = new Date();
    // Simulate real business data
    return {
      faturamentoMes: 48950.20,
      metaFaturamento: 60000,
      receitaRecebida: 39500.00,
      contasReceber: 9450.20,
      contasPagar: 12400.00,
      lucroEstimado: 21500.50,
      margemBruta: 43.5,
      estoqueCritico: 3,
      consignacoesAbertas: 8,
      consignacoesVencidas: 2,
      producaoMes: 520,
      custoProducao: 14200,
      pedidosMes: 142
    };
  }

  async getAlerts(): Promise<DashboardAlert[]> {
    return [
      {
        id: '1',
        type: 'consignacao_vencida',
        title: 'Acerto de Consignação',
        message: 'Empório Central vence hoje. 30 pacotes de Cerrado pendentes.',
        severity: 'medium',
        actionLabel: 'Realizar acerto',
        actionPayload: { page: 'consignacao' }
      },
      {
        id: '2',
        type: 'estoque_baixo',
        title: 'Falta de Embalagem',
        message: 'Caixas de embarque (120 unid) abaixo do mínimo para as próximas torras.',
        severity: 'high',
        actionLabel: 'Comprar mais',
        actionPayload: { page: 'estoque' }
      },
      {
        id: '3',
        type: 'crm_atraso',
        title: 'Conversas Pendentes CRM',
        message: 'Você tem 12 mensagens não lidas e 3 clientes sem resposta.',
        severity: 'medium',
        actionLabel: 'Abrir Inbox',
        actionPayload: { page: 'crm' }
      }
    ];
  }

  async getInsights(): Promise<DashboardInsight[]> {
    return [
       {
          id: 'ins-1',
          title: 'Campanha de Indicação Recomendada',
          description: 'Seu faturamento em assinaturas B2C aumentou consistentemente nos últimos 3 meses.',
          evidence: 'Engajamento estável na base (NPS > 70). Clientes fiéis podem trazer novos clientes.',
          expectedImpact: '+10 a +15% na aquisição',
          actionLabel: 'Criar campanha de indicação via WhatsApp',
          actionPayload: { page: 'crm', action: 'create_referral_campaign' }
       },
       {
          id: 'ins-2',
          title: 'Produtos parados no estoque',
          description: 'Lote #834 de Grãos Moídos 250g está próximo do vencimento (14 dias).',
          evidence: 'Estoque atual: 80 pacotes de uma torra antiga que não escoou.',
          expectedImpact: 'Prevenir perda de R$ 1.200 (desconto vale mais a pena)',
          actionLabel: 'Lançar promoção e rebaixar preço no catálogo',
          actionPayload: { page: 'catalogo', action: 'discount', data: { sku: 'GRAO-MOIDO-250G' }}
       }
    ];
  }

  async getRecentActivity(): Promise<DashboardActivity[]> {
    return [
      {
        id: '1',
        date: new Date().toISOString(),
        message: 'Pedido #123 criado.',
        type: 'pedido'
      }
    ];
  }
}
