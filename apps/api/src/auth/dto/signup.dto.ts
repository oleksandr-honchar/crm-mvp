// apps/api/src/auth/dto/signup.dto.ts
import { IsEmail, IsString, MinLength, IsUUID, IsIn } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsUUID()
  organizationId!: string;

  @IsIn(['admin', 'manager', 'sales_rep'])
  role!: string;
}
