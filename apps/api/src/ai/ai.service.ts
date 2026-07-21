// apps/api/src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { EmbeddingService } from '../embeddings/embedding.service';
import { db } from '../db';
import { sql } from 'drizzle-orm';

interface RetrievedActivity {
  id: string;
  body: string | null;
  type: string;
  createdAt: Date | null;
  distance: number;
}

@Injectable()
export class AiService {
  private gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  constructor(private embeddingService: EmbeddingService) {}

  async chat(organizationId: string, query: string, dealId?: string) {
    const queryEmbedding = await this.embeddingService.embed(query);
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    const results = dealId
      ? await db.execute(sql`
          SELECT a.id, a.body, a.type, a.created_at,
                 a.embedding <=> ${vectorLiteral}::vector AS distance
          FROM activities a
          WHERE a.organization_id = ${organizationId}
            AND a.embedding IS NOT NULL
            AND a.entity_type = 'deal'
            AND a.entity_id = ${dealId}
          ORDER BY distance
          LIMIT 5
        `)
      : await db.execute(sql`
          SELECT a.id, a.body, a.type, a.created_at,
                 a.embedding <=> ${vectorLiteral}::vector AS distance
          FROM activities a
          WHERE a.organization_id = ${organizationId}
            AND a.embedding IS NOT NULL
          ORDER BY distance
          LIMIT 5
        `);

    const sources = results.rows as unknown as RetrievedActivity[];
    const RELEVANCE_THRESHOLD = 0.85; // deliberately loose — a coarse "nothing at all relevant" cutoff,
    // not a precision filter. The LLM's own grounding instruction is
    // the primary defense against weak-context hallucination; this
    // threshold only exists to skip the LLM call entirely when
    // literally nothing in the top-5 is even plausibly related.
    const relevantSources = sources.filter(
      (s) => s.distance < RELEVANCE_THRESHOLD,
    );

    if (relevantSources.length === 0) {
      return {
        answer: "I don't have any relevant activity notes to answer that yet.",
        sources: [],
      };
    }

    const context = relevantSources
      .map(
        (s, i) =>
          `[${i + 1}] (${s.type}, ${s.createdAt?.toISOString().slice(0, 10)}): ${s.body}`,
      )
      .join('\n');

    const prompt = `You are a CRM assistant. Answer the user's question using ONLY the context below. If the context doesn't contain the answer, say so honestly rather than guessing.

Context:
${context}

Question: ${query}

Answer concisely, and reference which numbered context item(s) support your answer.`;

    const response = await this.gemini.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    return {
      answer:
        response.text ??
        "I wasn't able to generate a response — please try again.",
      sources: relevantSources.map((s) => ({
        id: s.id,
        type: s.type,
        body: s.body,
        distance: s.distance,
      })),
    };
  }
}
