// apps/api/src/contacts/dto/update-contact.dto.ts
import { IsOptional, IsString, IsEmail, IsUUID } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;
}
