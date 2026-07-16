// apps/api/src/pipelines/pipelines.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../db';
import { pipelines, pipelineStages } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';

@Injectable()
export class PipelinesService {
  async create(organizationId: string, name: string) {
    const [pipeline] = await db.insert(pipelines).values({ organizationId, name }).returning();
    return pipeline;
  }

  async findAll(organizationId: string) {
    return db.select().from(pipelines).where(eq(pipelines.organizationId, organizationId));
  }

  async findOneWithStages(organizationId: string, id: string) {
    const [pipeline] = await db.select().from(pipelines).where(and(eq(pipelines.id, id), eq(pipelines.organizationId, organizationId)));
    if (!pipeline) throw new NotFoundException('Pipeline not found');
    const stages = await db.select().from(pipelineStages).where(eq(pipelineStages.pipelineId, id)).orderBy(asc(pipelineStages.position));
    return { ...pipeline, stages };
  }

  async addStage(organizationId: string, pipelineId: string, dto: { name: string; position: number; probability?: number }) {
    await this.findOneWithStages(organizationId, pipelineId); // validates org ownership
    const [stage] = await db
      .insert(pipelineStages)
      .values({ pipelineId, name: dto.name, position: dto.position, probability: dto.probability?.toString() })
      .returning();
    return stage;
  }

  async updateStage(organizationId: string, pipelineId: string, stageId: string, dto: Partial<{ name: string; position: number; probability: number }>) {
    await this.findOneWithStages(organizationId, pipelineId);
    const [updated] = await db
      .update(pipelineStages)
      .set({ ...dto, probability: dto.probability?.toString() })
      .where(and(eq(pipelineStages.id, stageId), eq(pipelineStages.pipelineId, pipelineId)))
      .returning();
    return updated;
  }

  async removeStage(organizationId: string, pipelineId: string, stageId: string) {
    await this.findOneWithStages(organizationId, pipelineId);
    await db.delete(pipelineStages).where(and(eq(pipelineStages.id, stageId), eq(pipelineStages.pipelineId, pipelineId)));
    return { deleted: true };
  }
}
