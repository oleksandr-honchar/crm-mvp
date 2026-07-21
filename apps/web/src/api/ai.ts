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

export async function askAi(
  query: string,
  dealId?: string,
): Promise<ChatResponse> {
  const { data } = await apiClient.post('/ai/chat', { query, dealId });
  return data;
}
