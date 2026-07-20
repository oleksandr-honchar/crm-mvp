// apps/web/src/api/pipelines.ts
import { apiClient } from './client';

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
}

export interface Pipeline {
  id: string;
  name: string;
}

export async function getPipelines(): Promise<Pipeline[]> {
  const { data } = await apiClient.get('/pipelines');
  return data;
}

export async function getPipelineWithStages(
  id: string,
): Promise<Pipeline & { stages: PipelineStage[] }> {
  const { data } = await apiClient.get(`/pipelines/${id}`);
  return data;
}
