// apps/api/src/ai/dto/summary-response.dto.ts
// (not a validated DTO, just documenting the shape for clarity)
export interface DealSummaryResponse {
  painPoints: string;
  nextSteps: string;
  closeLikelihood: string;
  summary: string;
}