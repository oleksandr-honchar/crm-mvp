// apps/web/src/api/deals.ts
import { apiClient } from './client';

export interface Deal {
  id: string;
  title: string;
  value: string;
  status: string;
  stageId: string;
}

export interface DealDetail extends Deal {
  accountId: string | null;
  contactId: string | null;
  currency: string;
  closeDate: string | null;
}

export interface Activity {
  id: string;
  entityType: string;
  entityId: string;
  type: string;
  body: string | null;
  createdAt: string;
}

export async function createDeal(values: {
  title: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  accountId?: string;
  contactId?: string;
}) {
  const { data } = await apiClient.post('/deals', values);
  return data;
}

export async function getDeals(): Promise<Deal[]> {
  const { data } = await apiClient.get('/deals');
  return data;
}

export async function transitionDealStage(dealId: string, stageId: string) {
  const { data } = await apiClient.patch(`/deals/${dealId}/stage`, { stageId });
  return data;
}

export async function getDeal(id: string): Promise<DealDetail> {
  const { data } = await apiClient.get(`/deals/${id}`);
  return data;
}

export async function getDealTimeline(id: string): Promise<Activity[]> {
  const { data } = await apiClient.get(`/deals/${id}/timeline`);
  return data;
}

export async function markDealWon(id: string) {
  const { data } = await apiClient.post(`/deals/${id}/won`);
  return data;
}

export async function markDealLost(id: string) {
  const { data } = await apiClient.post(`/deals/${id}/lost`);
  return data;
}

export async function deleteDeal(id: string) {
  await apiClient.delete(`/deals/${id}`);
}
