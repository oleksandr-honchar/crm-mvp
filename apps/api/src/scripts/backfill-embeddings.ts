// apps/api/src/scripts/backfill-embeddings.ts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { VoyageAIClient } from 'voyageai';
import { db, pool } from '../db';
import { activities } from '../db/schema';
import { eq } from 'drizzle-orm';

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });

async function main() {
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.type, 'note'));

  for (const row of rows) {
    if (!row.body) continue;
    console.log(`Embedding activity ${row.id}: "${row.body.slice(0, 50)}..."`);

    const response = await voyage.embed({
      input: [row.body],
      model: 'voyage-4-lite',
    });

    const embedding = response.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error(
        `No embedding returned for activity ${row.id} — check the API response shape`,
      );
    }

    await db
      .update(activities)
      .set({ embedding })
      .where(eq(activities.id, row.id));
    console.log(`  -> stored ${embedding.length}-dim vector`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
