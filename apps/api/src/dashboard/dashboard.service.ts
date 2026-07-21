// apps/api/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { deals, pipelineStages } from '../db/schema';
import { eq, and, count, sum, isNull } from 'drizzle-orm';

@Injectable()
export class DashboardService {
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
        and(eq(deals.organizationId, organizationId), eq(deals.status, 'open'), isNull(deals.deletedAt)),
      )
      .groupBy(pipelineStages.id, pipelineStages.name, pipelineStages.position)
      .orderBy(pipelineStages.position);
  }

  async summary(organizationId: string) {
    const [open] = await db
      .select({ count: count(deals.id), totalValue: sum(deals.value) })
      .from(deals)
      .where(
        and(eq(deals.organizationId, organizationId), eq(deals.status, 'open'), isNull(deals.deletedAt)),
      );

    const [won] = await db
      .select({ count: count(deals.id), totalValue: sum(deals.value) })
      .from(deals)
      .where(
        and(eq(deals.organizationId, organizationId), eq(deals.status, 'won'), isNull(deals.deletedAt)),
      );

    const [lost] = await db
      .select({ count: count(deals.id), totalValue: sum(deals.value) })
      .from(deals)
      .where(
        and(eq(deals.organizationId, organizationId), eq(deals.status, 'lost'), isNull(deals.deletedAt)),
      );

    return { open, won, lost };
  }
}
