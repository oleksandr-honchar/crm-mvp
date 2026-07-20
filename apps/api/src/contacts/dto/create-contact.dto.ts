// apps/api/src/contacts/dto/create-contact.dto.ts
import { IsOptional, IsString, IsEmail, IsUUID } from 'class-validator';

export class CreateContactDto {
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
