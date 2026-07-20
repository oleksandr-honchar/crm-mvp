// apps/web/src/api/leads.ts
import { apiClient } from './client';

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  status: string;
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
