// apps/api/src/contacts/contacts.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db';
import { contacts, accounts } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

@Injectable()
export class ContactsService {
  private async assertAccountInOrg(organizationId: string, accountId: string) {
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.organizationId, organizationId),
        ),
      );
    if (!account)
      throw new BadRequestException(
        'accountId does not belong to your organization',
      );
  }

  async create(
    organizationId: string,
    ownerId: string,
    dto: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      accountId?: string;
    },
  ) {
    if (dto.accountId)
      await this.assertAccountInOrg(organizationId, dto.accountId);
    const [contact] = await db
      .insert(contacts)
      .values({ organizationId, ownerId, ...dto })
      .returning();
    return contact;
  }

  async findAll(organizationId: string) {
    return db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.organizationId, organizationId),
          isNull(contacts.deletedAt),
        ),
      );
  }

  async findOne(organizationId: string, id: string) {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.organizationId, organizationId),
          isNull(contacts.deletedAt),
        ),
      );
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async update(
    organizationId: string,
    id: string,
    dto: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      accountId: string;
    }>,
  ) {
    await this.findOne(organizationId, id);
    if (dto.accountId)
      await this.assertAccountInOrg(organizationId, dto.accountId);
    const [updated] = await db
      .update(contacts)
      .set(dto)
      .where(
        and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)),
      )
      .returning();
    return updated;
  }

  async softDelete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await db
      .update(contacts)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)),
      );
    return { deleted: true };
  }
}
