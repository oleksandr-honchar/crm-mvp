// apps/api/src/leads/dto/convert-lead.dto.ts
export class ConvertLeadDto {
  pipelineId!: string;
  stageId!: string;
  dealTitle!: string;
  dealValue?: number;
}
