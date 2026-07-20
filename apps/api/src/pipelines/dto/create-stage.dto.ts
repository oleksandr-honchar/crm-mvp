// apps/api/src/pipelines/dto/create-stage.dto.ts
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateStageDto {
  @IsString()
  name!: string;

  @IsNumber()
  position!: number;

  @IsOptional()
  @IsNumber()
  probability?: number;
}
