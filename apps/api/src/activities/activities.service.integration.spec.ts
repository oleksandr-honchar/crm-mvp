// apps/api/src/activities/activities.service.integration.spec.ts
import { ActivitiesService } from './activities.service';
import { EmbeddingService } from '../embeddings/embedding.service';
import { db, pool } from '../db';
import {
  organizations,
  users,
  accounts,
  activities,
  activityChunks,
} from '../db/schema';
import { eq } from 'drizzle-orm';

describe('ActivitiesService embedding integration', () => {
  let service: ActivitiesService;
  let orgId: string;
  let userId: string;
  let accountId: string;

  beforeAll(async () => {
    service = new ActivitiesService(new EmbeddingService());
    const [org] = await db
      .insert(organizations)
      .values({ name: 'Embedding Test Org' })
      .returning();
    orgId = org.id;
    const [user] = await db
      .insert(users)
      .values({
        email: 'embed-test@test.com',
        passwordHash: 'x',
        organizationId: orgId,
        role: 'admin',
      })
      .returning();
    userId = user.id;
    const [account] = await db
      .insert(accounts)
      .values({ organizationId: orgId, ownerId: userId, name: 'Test Account' })
      .returning();
    accountId = account.id;
  });

  afterAll(async () => {
    await db
      .delete(activityChunks)
      .where(eq(activityChunks.organizationId, orgId));
    await db.delete(activities).where(eq(activities.organizationId, orgId));
    await db.delete(accounts).where(eq(accounts.organizationId, orgId));
    await db.delete(users).where(eq(users.organizationId, orgId));
    await db.delete(organizations).where(eq(organizations.id, orgId));
    await pool.end();
  });

  it('stores embedded chunks when creating an activity with a body', async () => {
    const activity = await service.create(orgId, userId, {
      entityType: 'account',
      entityId: accountId,
      type: 'note',
      body: 'Test note for embedding verification',
    });

    const chunks = await db
      .select()
      .from(activityChunks)
      .where(eq(activityChunks.activityId, activity.id));
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].embedding).not.toBeNull();
    expect(chunks[0].embedding?.length).toBe(1024);
  }, 15000);
});
