// apps/api/src/leads/leads.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../db';
import { leads, accounts, contacts, deals } from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class LeadsService {
  async create(organizationId: string, ownerId: string, dto: { name?: string; email?: string; company?: string; source?: string }) {
    const [lead] = await db.insert(leads).values({ organizationId, ownerId, ...dto }).returning();
    return lead;
  }

  async findAll(organizationId: string) {
    return db.select().from(leads).where(eq(leads.organizationId, organizationId));
  }

  async findOne(organizationId: string, id: string) {
    const [lead] = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.organizationId, organizationId)));
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async convert(
    organizationId: string,
    ownerId: string,
    leadId: string,
    dto: { pipelineId: string; stageId: string; dealTitle: string; dealValue?: number },
  ) {
    const lead = await this.findOne(organizationId, leadId);
    if (lead.status === 'converted') {
      throw new BadRequestException('Lead is already converted');
    }

    return db.transaction(async (tx) => {
      // 1. Create (or reuse) an account from the lead's company name
      let accountId: string;
      if (lead.company) {
        const [existing] = await tx
          .select({ id: accounts.id })
          .from(accounts)
          .where(and(eq(accounts.organizationId, organizationId), eq(accounts.name, lead.company)));
        if (existing) {
          accountId = existing.id;
        } else {
          const [account] = await tx
            .insert(accounts)
            .values({ organizationId, ownerId, name: lead.company })
            .returning();
          accountId = account.id;
        }
      } else {
        const [account] = await tx
          .insert(accounts)
          .values({ organizationId, ownerId, name: lead.name ?? lead.email ?? 'Unnamed Account' })
          .returning();
        accountId = account.id;
      }

      // 2. Create the contact
      const [contact] = await tx
        .insert(contacts)
        .values({
          organizationId,
          ownerId,
          accountId,
          firstName: lead.name,
          email: lead.email,
        })
        .returning();

      // 3. Create the deal
      const [deal] = await tx
        .insert(deals)
        .values({
          organizationId,
          ownerId,
          accountId,
          contactId: contact.id,
          pipelineId: dto.pipelineId,
          stageId: dto.stageId,
          title: dto.dealTitle,
          value: dto.dealValue?.toString() ?? '0',
        })
        .returning();

      // 4. Mark the lead as converted, linking the new records
      const [updatedLead] = await tx
        .update(leads)
        .set({ status: 'converted', convertedContactId: contact.id, convertedDealId: deal.id })
        .where(eq(leads.id, leadId))
        .returning();

      return { lead: updatedLead, account: { id: accountId }, contact, deal };
    });
  }
}
