import { DashboardSummary, DashboardAlert, DashboardActivity, DashboardInsight } from '../../domain/types';

export interface IDashboardRepository {
  getSummary(): Promise<DashboardSummary>;
  getAlerts(): Promise<DashboardAlert[]>;
  getInsights(): Promise<DashboardInsight[]>;
  getRecentActivity(): Promise<DashboardActivity[]>;
}
