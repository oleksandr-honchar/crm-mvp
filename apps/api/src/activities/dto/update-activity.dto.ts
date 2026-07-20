// apps/api/src/activities/dto/update-activity.dto.ts
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
