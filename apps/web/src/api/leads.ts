// apps/web/src/api/leads.ts
import { apiClient } from './client';

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  status: string;
}

export async function createLead(values: { name: string; email: string; company: string; source: string }) {
  const { data } = await apiClient.post('/leads', values);
  return data;
}

export async function getLeads(): Promise<Lead[]> {
  const { data } = await apiClient.get('/leads');
  return data;
}

export async function convertLead(
  id: string,
  dto: {
    pipelineId: string;
    stageId: string;
    dealTitle: string;
    dealValue?: number;
  },
) {
  const { data } = await apiClient.post(`/leads/${id}/convert`, dto);
  return data;
}

export async function deleteLead(id: string) {
  await apiClient.delete(`/leads/${id}`);
}
