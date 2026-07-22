// apps/web/src/api/ai.ts
import { apiClient } from './client';

export interface ChatSource {
  id: string;
  type: string;
  body: string | null;
  distance: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface DealSummary {
  painPoints: string;
  nextSteps: string;
  closeLikelihood: string;
  summary: string;
}

export async function askAi(
  query: string,
  dealId?: string,
): Promise<ChatResponse> {
  const { data } = await apiClient.post('/ai/chat', { query, dealId });
  return data;
}

export async function summarizeDeal(dealId: string): Promise<DealSummary> {
  const { data } = await apiClient.post(`/ai/deals/${dealId}/summary`);
  return data;
}
