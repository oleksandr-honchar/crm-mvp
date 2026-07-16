// apps/api/src/pipelines/dto/create-stage.dto.ts
export class CreateStageDto {
  name!: string;
  position!: number;
  probability?: number;
}
