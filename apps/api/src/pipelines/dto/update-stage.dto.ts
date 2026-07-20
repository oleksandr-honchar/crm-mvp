// apps/api/src/pipelines/dto/update-stage.dto.ts
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateStageDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsNumber()
  probability?: number;
}
