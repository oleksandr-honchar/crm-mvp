// apps/api/src/deals/deals.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '@db/index';
import { deals, pipelineStages, activities } from '@db/schema';
import { eq, and, isNull } from 'drizzle-orm';

@Injectable()
export class DealsService {
  async create(
    organizationId: string,
    ownerId: string,
    dto: {
      title: string;
      accountId?: string;
      contactId?: string;
      pipelineId: string;
      stageId: string;
      value?: number;
      currency?: string;
      closeDate?: string;
    },
  ) {
    const [deal] = await db
      .insert(deals)
      .values({
        organizationId,
        ownerId,
        title: dto.title,
        accountId: dto.accountId,
        contactId: dto.contactId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        value: dto.value?.toString() ?? '0',
        currency: dto.currency ?? 'USD',
        closeDate: dto.closeDate,
      })
      .returning();
    return deal;
  }

  async findAll(organizationId: string) {
    return db
      .select()
      .from(deals)
      .where(
        and(eq(deals.organizationId, organizationId), isNull(deals.deletedAt)),
      );
  }

  async findOne(organizationId: string, id: string) {
    const [deal] = await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.id, id),
          eq(deals.organizationId, organizationId),
          isNull(deals.deletedAt),
        ),
      );
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async update(
    organizationId: string,
    id: string,
    dto: Partial<{ title: string; value: number; closeDate: string }>,
  ) {
    await this.findOne(organizationId, id);
    const [updated] = await db
      .update(deals)
      .set({ ...dto, value: dto.value?.toString() })
      .where(and(eq(deals.id, id), eq(deals.organizationId, organizationId)))
      .returning();
    return updated;
  }

  /**
   * Stage transition — the one piece of real business logic in this block.
   * Guards against:
   * 1. Moving a deal that's already closed (won/lost) — closed deals are frozen.
   * 2. Moving to a stage from a *different* pipeline (data integrity).
   * Logs the transition as an activity so it shows up in the timeline later (20-22h block).
   */
  async transitionStage(
    organizationId: string,
    ownerId: string,
    id: string,
    stageId: string,
  ) {
    const deal = await this.findOne(organizationId, id);
    if (deal.status !== 'open') {
      throw new BadRequestException(
        `Cannot move a deal that is already ${deal.status}`,
      );
    }

    const [stage] = await db
      .select()
      .from(pipelineStages)
      .where(
        and(
          eq(pipelineStages.id, stageId),
          eq(pipelineStages.pipelineId, deal.pipelineId),
        ),
      );

    if (!stage)
      throw new BadRequestException(
        "Stage does not belong to this deal's pipeline",
      );

    const [updated] = await db
      .update(deals)
      .set({ stageId })
      .where(and(eq(deals.id, id), eq(deals.organizationId, organizationId)))
      .returning();

    await db.insert(activities).values({
      organizationId,
      entityType: 'deal',
      entityId: id,
      type: 'stage_change',
      body: `Moved to stage: ${stage.name}`,
      createdBy: ownerId,
    });

    return updated;
  }

  /** Win/lose — terminal state, deal leaves the active pipeline. */
  async close(
    organizationId: string,
    ownerId: string,
    id: string,
    outcome: 'won' | 'lost',
  ) {
    const deal = await this.findOne(organizationId, id);
    if (deal.status !== 'open') {
      throw new BadRequestException(`Deal is already ${deal.status}`);
    }
    const [updated] = await db
      .update(deals)
      .set({ status: outcome })
      .where(and(eq(deals.id, id), eq(deals.organizationId, organizationId)))
      .returning();

    await db.insert(activities).values({
      organizationId,
      entityType: 'deal',
      entityId: id,
      type: 'stage_change',
      body: `Deal marked as ${outcome}`,
      createdBy: ownerId,
    });

    return updated;
  }

  async softDelete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await db
      .update(deals)
      .set({ deletedAt: new Date() })
      .where(and(eq(deals.id, id), eq(deals.organizationId, organizationId)));
    return { deleted: true };
  }
}
