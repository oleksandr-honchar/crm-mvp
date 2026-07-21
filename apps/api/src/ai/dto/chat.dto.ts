// apps/api/src/ai/dto/chat.dto.ts
import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class ChatDto {
  @IsString()
  @MinLength(3)
  query!: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;
}
