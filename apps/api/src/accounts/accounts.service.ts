// apps/api/src/accounts/accounts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { accounts } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

@Injectable()
export class AccountsService {
  async create(
    organizationId: string,
    ownerId: string,
    dto: { name: string; domain?: string },
  ) {
    const [account] = await db
      .insert(accounts)
      .values({ organizationId, ownerId, name: dto.name, domain: dto.domain })
      .returning();
    return account;
  }

  async findAll(organizationId: string) {
    return db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.organizationId, organizationId),
          isNull(accounts.deletedAt),
        ),
      );
  }

  async findOne(organizationId: string, id: string) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.organizationId, organizationId),
          isNull(accounts.deletedAt),
        ),
      );
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(
    organizationId: string,
    id: string,
    dto: { name?: string; domain?: string },
  ) {
    await this.findOne(organizationId, id); // throws 404 if not found/wrong org
    const [updated] = await db
      .update(accounts)
      .set(dto)
      .where(
        and(eq(accounts.id, id), eq(accounts.organizationId, organizationId)),
      )
      .returning();
    return updated;
  }

  async softDelete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await db
      .update(accounts)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(accounts.id, id), eq(accounts.organizationId, organizationId)),
      )
      .returning();
    return { deleted: true };
  }
}
