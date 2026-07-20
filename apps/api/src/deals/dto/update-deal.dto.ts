// apps/api/src/deals/dto/update-deal.dto.ts
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsDateString()
  closeDate?: string;
}
