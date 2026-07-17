// apps/api/src/deals/dto/transition-stage.dto.ts
import { IsUUID } from 'class-validator';

export class TransitionStageDto {
  @IsUUID()
  stageId!: string;
}
