// apps/api/src/ai/ai.service.integration.spec.ts
import { AiService } from './ai.service';
import { EmbeddingService } from '../embeddings/embedding.service';
import { TimelineService } from '../activities/timeline.service';
import { ActivitiesService } from '../activities/activities.service';
import { DealsService } from '../deals/deals.service';
import { db, pool } from '../db';
import { organizations, users, accounts, contacts, pipelines, pipelineStages, deals, activities, activityChunks } from '../db/schema';
import { eq } from 'drizzle-orm';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('AiService (integration)', () => {
  let aiService: AiService;
  let embeddingService: EmbeddingService;
  let activitiesService: ActivitiesService;
  let dealsService: DealsService;

  let orgId: string;
  let userId: string;
  let dealId: string;

  beforeAll(async () => {
    embeddingService = new EmbeddingService();
    activitiesService = new ActivitiesService(embeddingService);
    dealsService = new DealsService();
    const timelineService = new TimelineService(activitiesService, dealsService);
    aiService = new AiService(embeddingService, timelineService, dealsService);

    const [org] = await db.insert(organizations).values({ name: 'AI Test Org' }).returning();
    orgId = org.id;
    const [user] = await db.insert(users).values({ email: 'ai-test@test.com', passwordHash: 'x', organizationId: orgId, role: 'admin' }).returning();
    userId = user.id;
    const [account] = await db.insert(accounts).values({ organizationId: orgId, ownerId: userId, name: 'Test Account' }).returning();
    const [contact] = await db.insert(contacts).values({ organizationId: orgId, ownerId: userId, accountId: account.id, firstName: 'Test', lastName: 'Contact' }).returning();
    const [pipeline] = await db.insert(pipelines).values({ organizationId: orgId, name: 'Test Pipeline' }).returning();
    const [stage] = await db.insert(pipelineStages).values({ pipelineId: pipeline.id, name: 'New', position: 1 }).returning();

    const [deal] = await db.insert(deals).values({
      organizationId: orgId, ownerId: userId, accountId: account.id, contactId: contact.id,
      pipelineId: pipeline.id, stageId: stage.id, title: 'AI Test Deal', value: '9500', status: 'open',
    }).returning();
    dealId = deal.id;

    // A distinctive note, unlikely to false-positive-match anything else,
    // used to prove real semantic retrieval, not a coincidence.
    await activitiesService.create(orgId, userId, {
      entityType: 'deal',
      entityId: dealId,
      type: 'note',
      body: 'The client specifically requested a purple flamingo mascot for their onboarding welcome email.',
    });
  }, 20000); // generous timeout — this beforeAll makes a real embedding API call

  afterAll(async () => {
    await db.delete(activityChunks).where(eq(activityChunks.organizationId, orgId));
    await db.delete(activities).where(eq(activities.organizationId, orgId));
    await db.delete(deals).where(eq(deals.organizationId, orgId));
    await db.delete(pipelineStages).where(eq(pipelineStages.pipelineId, (await db.select().from(pipelines).where(eq(pipelines.organizationId, orgId)))[0]?.id ?? ''));
    await db.delete(pipelines).where(eq(pipelines.organizationId, orgId));
    await db.delete(contacts).where(eq(contacts.organizationId, orgId));
    await db.delete(accounts).where(eq(accounts.organizationId, orgId));
    await db.delete(users).where(eq(users.organizationId, orgId));
    await db.delete(organizations).where(eq(organizations.id, orgId));
    await pool.end();
  });

    it('answers a question grounded in a specific note, citing the right source', async () => {
        await sleep(22000); // space out from beforeAll's embed call
        const result = await aiService.chat(orgId, 'What did the client ask for regarding the mascot?', dealId);
        expect(result.answer.toLowerCase()).toContain('flamingo');
        expect(result.sources.length).toBeGreaterThan(0);
        expect(result.sources[0].body).toContain('purple flamingo');
    }, 30000);

    it('answers a factual question from the structured deal record, not just note text', async () => {
        await sleep(22000);
        const result = await aiService.chat(orgId, 'What is the exact deal value?', dealId);
        expect(result.answer).toMatch(/9,?500/);
    }, 30000);

    it('honestly declines when nothing relevant exists', async () => {
        await sleep(22000);
        const result = await aiService.chat(orgId, 'What is the weather forecast for tomorrow?', dealId);
        expect(result.answer.toLowerCase()).toMatch(/don't have|not contain|no information/);
    }, 30000);
});