// apps/api/src/activities/dto/create-activity.dto.ts
import {
  IsUUID,
  IsIn,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateActivityDto {
  @IsIn(['contact', 'deal', 'account', 'lead'])
  entityType!: 'contact' | 'deal' | 'account' | 'lead';

  @IsUUID()
  entityId!: string;

  @IsIn(['note', 'call', 'email', 'meeting', 'task'])
  type!: 'note' | 'call' | 'email' | 'meeting' | 'task';

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
