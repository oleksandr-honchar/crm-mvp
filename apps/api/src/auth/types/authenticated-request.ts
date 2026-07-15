// apps/api/src/auth/types/authenticated-request.ts
import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  organizationId: string;
  role: string;
}

export interface RawJwtPayload {
  sub: string;
  organizationId: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
