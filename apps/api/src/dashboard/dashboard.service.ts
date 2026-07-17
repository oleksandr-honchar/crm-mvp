// apps/api/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { deals, pipelineStages } from '../db/schema';
import { eq, and, count, sum } from 'drizzle-orm';

@Injectable()
export class DashboardService {
  /** Open pipeline only, grouped by stage — "where is my active pipeline stuck?" */
  async pipelineFunnel(organizationId: string) {
    return db
      .select({
        stageId: pipelineStages.id,
        stageName: pipelineStages.name,
        position: pipelineStages.position,
        dealCount: count(deals.id),
        totalValue: sum(deals.value),
      })
      .from(deals)
      .innerJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
      .where(
        and(eq(deals.organizationId, organizationId), eq(deals.status, 'open')),
      )
      .groupBy(pipelineStages.id, pipelineStages.name, pipelineStages.position)
      .orderBy(pipelineStages.position);
  }

  /** Won/lost outcomes — separate from the in-progress funnel, per the status/stage split. */
  async summary(organizationId: string) {
    const [open] = await db
      .select({ count: count(deals.id), totalValue: sum(deals.value) })
      .from(deals)
      .where(
        and(eq(deals.organizationId, organizationId), eq(deals.status, 'open')),
      );

    const [won] = await db
      .select({ count: count(deals.id), totalValue: sum(deals.value) })
      .from(deals)
      .where(
        and(eq(deals.organizationId, organizationId), eq(deals.status, 'won')),
      );

    const [lost] = await db
      .select({ count: count(deals.id), totalValue: sum(deals.value) })
      .from(deals)
      .where(
        and(eq(deals.organizationId, organizationId), eq(deals.status, 'lost')),
      );

    return { open, won, lost };
  }
}
