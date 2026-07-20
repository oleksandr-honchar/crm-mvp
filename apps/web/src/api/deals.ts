// apps/web/src/api/deals.ts
import { apiClient } from './client';

export interface Deal {
  id: string;
  title: string;
  value: string;
  status: string;
  stageId: string;
}

export async function getDeals(): Promise<Deal[]> {
  const { data } = await apiClient.get('/deals');
  return data;
}
