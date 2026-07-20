// apps/web/src/api/activities.ts
import { apiClient } from './client';

export async function createActivity(dto: {
  entityType: 'contact' | 'deal' | 'account' | 'lead';
  entityId: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'task';
  body?: string;
}) {
  const { data } = await apiClient.post('/activities', dto);
  return data;
}
