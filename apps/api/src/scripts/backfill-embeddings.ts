// apps/api/src/scripts/backfill-embeddings.ts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { VoyageAIClient } from 'voyageai';
import { db, pool } from '../db';
import { activities, activityChunks } from '../db/schema';
import { eq } from 'drizzle-orm';
import { chunkText } from '../embeddings/chunk-text';

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });

async function main() {
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.type, 'note'));

  for (const row of rows) {
    if (!row.body) continue;
    const existing = await db
      .select()
      .from(activityChunks)
      .where(eq(activityChunks.activityId, row.id));
    if (existing.length > 0) {
      console.log(`Skipping ${row.id} — already chunked`);
      continue;
    }

    const chunks = chunkText(row.body);
    console.log(`Embedding activity ${row.id}: ${chunks.length} chunk(s)`);

    for (let i = 0; i < chunks.length; i++) {
      const response = await voyage.embed({
        input: [chunks[i]],
        model: 'voyage-4-lite',
      });
      const embedding = response.data?.[0]?.embedding;
      if (!embedding)
        throw new Error(
          `No embedding returned for chunk ${i} of activity ${row.id}`,
        );

      await db.insert(activityChunks).values({
        activityId: row.id,
        organizationId: row.organizationId,
        entityType: row.entityType,
        entityId: row.entityId,
        chunkIndex: i,
        body: chunks[i],
        embedding,
      });
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
