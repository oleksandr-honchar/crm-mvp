// apps/api/src/scripts/query-test.ts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { VoyageAIClient } from 'voyageai';
import { db, pool } from '../db';
import { sql } from 'drizzle-orm';

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });

async function main() {
  const query = 'What did the client say about pricing or budget?';
  console.log(`Query: "${query}"\n`);

  const response = await voyage.embed({
    input: [query],
    model: 'voyage-4-lite',
  });
  const queryEmbedding = response.data?.[0]?.embedding;
  if (!queryEmbedding) throw new Error('No embedding returned for query');

  const results = await db.execute(sql`
    SELECT id, body, embedding <=> ${JSON.stringify(queryEmbedding)}::vector AS distance
    FROM activities
    WHERE embedding IS NOT NULL
    ORDER BY distance
    LIMIT 5
  `);

  for (const row of results.rows as any[]) {
    console.log(`[${Number(row.distance).toFixed(4)}] ${row.body}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
