// apps/api/src/accounts/dto/update-account.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
