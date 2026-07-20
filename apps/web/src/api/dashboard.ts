// apps/web/src/api/dashboard.ts
import { apiClient } from './client';

export interface FunnelStage {
  stageId: string;
  stageName: string;
  dealCount: number;
  totalValue: string | null;
}

export interface DashboardSummary {
  open: { count: number; totalValue: string | null };
  won: { count: number; totalValue: string | null };
  lost: { count: number; totalValue: string | null };
}

export async function getFunnel(): Promise<FunnelStage[]> {
  const { data } = await apiClient.get('/dashboard/funnel');
  return data;
}

export async function getSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get('/dashboard/summary');
  return data;
}
