// apps/api/src/leads/dto/convert-lead.dto.ts
import { IsUUID, IsOptional, IsString, IsNumber } from 'class-validator';

export class ConvertLeadDto {
  @IsUUID()
  pipelineId!: string;

  @IsUUID()
  stageId!: string;

  @IsString()
  dealTitle!: string;

  @IsOptional()
  @IsNumber()
  dealValue?: number;
}
