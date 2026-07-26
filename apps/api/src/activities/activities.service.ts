// apps/api/src/activities/activities.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../db';
import { activities, contacts, deals, accounts, leads } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { EmbeddingService } from '../embeddings/embedding.service';
import { chunkText } from '../embeddings/chunk-text';
import { activityChunks } from '../db/schema';

type EntityType = 'contact' | 'deal' | 'account' | 'lead';

@Injectable()
export class ActivitiesService {
  constructor(private embeddingService: EmbeddingService) {}
  /**
   * Validates the referenced entity exists AND belongs to the caller's org,
   * before allowing an activity to be attached to it. This is the same
   * tenant-isolation pattern used in ContactsService.assertAccountInOrg —
   * without it, a malicious/buggy client could attach activities to another
   * org's records just by guessing a UUID.
   *
   * Deliberately a flat switch, not a generic/reflective resolver — see
   * "avoid over-engineering" note above.
   */
  private async assertEntityInOrg(
    organizationId: string,
    entityType: EntityType,
    entityId: string,
  ) {
    let exists: { id: string } | undefined;
    switch (entityType) {
      case 'contact':
        [exists] = await db
          .select({ id: contacts.id })
          .from(contacts)
          .where(
            and(
              eq(contacts.id, entityId),
              eq(contacts.organizationId, organizationId),
              isNull(contacts.deletedAt),
            ),
          );
        break;
      case 'deal':
        [exists] = await db
          .select({ id: deals.id })
          .from(deals)
          .where(
            and(
              eq(deals.id, entityId),
              eq(deals.organizationId, organizationId),
              isNull(deals.deletedAt),
            ),
          );
        break;
      case 'account':
        [exists] = await db
          .select({ id: accounts.id })
          .from(accounts)
          .where(
            and(
              eq(accounts.id, entityId),
              eq(accounts.organizationId, organizationId),
              isNull(accounts.deletedAt),
            ),
          );
        break;
      case 'lead':
        [exists] = await db
          .select({ id: leads.id })
          .from(leads)
          .where(
            and(
              eq(leads.id, entityId),
              eq(leads.organizationId, organizationId),
            ),
          );
        break;
      default:
        throw new BadRequestException('Unknown entity type');
    }
    if (!exists)
      throw new BadRequestException(
        `${entityType} not found in your organization`,
      );
  }

  async create(
    organizationId: string,
    createdBy: string,
    dto: {
      entityType: EntityType;
      entityId: string;
      type: string;
      body?: string;
      dueAt?: string;
    },
  ) {
    await this.assertEntityInOrg(organizationId, dto.entityType, dto.entityId);

    const [activity] = await db
      .insert(activities)
      .values({
        organizationId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        type: dto.type,
        body: dto.body,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        createdBy,
      })
      .returning();

    if (dto.body) {
      await this.embedActivityBody(
        activity.id,
        organizationId,
        dto.entityType,
        dto.entityId,
        dto.body,
      );
    }

    return activity;
  }

  private async embedActivityBody(
    activityId: string,
    organizationId: string,
    entityType: string,
    entityId: string,
    body: string,
  ) {
    const chunks = chunkText(body);
    try {
      const embeddings = await this.embeddingService.embedBatch(chunks); // one API call for all chunks
      const rows = chunks.map((chunkBody, i) => ({
        activityId,
        organizationId,
        entityType,
        entityId,
        chunkIndex: i,
        body: chunkBody,
        embedding: embeddings[i],
      }));
      await db.insert(activityChunks).values(rows); // single batched insert too
    } catch (err) {
      console.error(`Embedding failed for activity ${activityId}:`, err);
    }
  }

  async findOne(organizationId: string, id: string) {
    const [activity] = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.id, id),
          eq(activities.organizationId, organizationId),
        ),
      );
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async update(
    organizationId: string,
    id: string,
    dto: Partial<{ body: string; dueAt: string; completedAt: string }>,
  ) {
    await this.findOne(organizationId, id);
    const [updated] = await db
      .update(activities)
      .set({
        body: dto.body,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      })
      .where(
        and(
          eq(activities.id, id),
          eq(activities.organizationId, organizationId),
        ),
      )
      .returning();

    if (dto.body) {
      await db.delete(activityChunks).where(eq(activityChunks.activityId, id));
      await this.embedActivityBody(
        id,
        organizationId,
        updated.entityType,
        updated.entityId,
        dto.body,
      );
    }

    return updated;
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await db
      .delete(activities)
      .where(
        and(
          eq(activities.id, id),
          eq(activities.organizationId, organizationId),
        ),
      );
    return { deleted: true };
  }

  /** Used by the Timeline endpoint (next block) — flat, single-table query. */
  async findByEntity(
    organizationId: string,
    entityType: EntityType,
    entityId: string,
  ) {
    return db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.organizationId, organizationId),
          eq(activities.entityType, entityType),
          eq(activities.entityId, entityId),
        ),
      );
  }
}
