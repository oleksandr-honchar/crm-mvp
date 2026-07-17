// apps/api/src/deals/dto/create-deal.dto.ts
import { IsUUID } from 'class-validator';

export class CreateDealDto {
  title!: string;
  accountId?: string;
  contactId?: string;
  @IsUUID()
  pipelineId!: string;
  @IsUUID()
  stageId!: string;
  value?: number;
  currency?: string;
  closeDate?: string;
}
