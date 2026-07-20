// apps/api/src/accounts/dto/create-account.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
