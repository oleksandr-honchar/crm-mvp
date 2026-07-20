// apps/api/src/pipelines/dto/create-pipeline.dto.ts
import { IsString } from 'class-validator';

export class CreatePipelineDto {
  @IsString()
  name!: string;
}
