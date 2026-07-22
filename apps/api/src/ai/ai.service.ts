// apps/api/src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { EmbeddingService } from '../embeddings/embedding.service';
import { TimelineService } from '../activities/timeline.service';
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

  constructor(
    private embeddingService: EmbeddingService,
    private timelineService: TimelineService,
  ) {}

  async chat(organizationId: string, query: string, dealId?: string) {
    const t0 = performance.now();
    const queryEmbedding = await this.embeddingService.embed(query);
    const t1 = performance.now();

    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    // Alias a.created_at AS "createdAt" in raw SQL to match the TypeScript interface
    const results = dealId
      ? await db.execute(sql`
        SELECT ac.id, ac.body, ac.chunk_index, a.type, a.created_at,
                ac.embedding <=> ${vectorLiteral}::vector AS distance
        FROM activity_chunks ac
        JOIN activities a ON a.id = ac.activity_id
        WHERE ac.organization_id = ${organizationId}
            AND ac.embedding IS NOT NULL
            AND ac.entity_type = 'deal'
            AND ac.entity_id = ${dealId}
        ORDER BY distance
        LIMIT 5
        `)
      : await db.execute(sql`
        SELECT ac.id, ac.body, ac.chunk_index, a.type, a.created_at,
                ac.embedding <=> ${vectorLiteral}::vector AS distance
        FROM activity_chunks ac
        JOIN activities a ON a.id = ac.activity_id
        WHERE ac.organization_id = ${organizationId}
            AND ac.embedding IS NOT NULL
        ORDER BY distance
        LIMIT 5
        `);
    const t2 = performance.now();

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
        latency: {
          voyageMs: Math.round(t1 - t0),
          pgvectorMs: Math.round(t2 - t1),
          geminiMs: 0,
        },
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

    const t3 = performance.now();
    const response = await this.gemini.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: { temperature: 0.2 }, // lower = more consistent/deterministic phrasing
    });
    const t4 = performance.now();

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
      latency: {
        voyageMs: Math.round(t1 - t0),
        pgvectorMs: Math.round(t2 - t1),
        geminiMs: Math.round(t4 - t3),
        totalMs: Math.round(t4 - t0),
      },
    };
  }

  async summarizeDeal(organizationId: string, dealId: string) {
    console.time('1. Timeline Query');
    const timeline = await this.timelineService.forDeal(organizationId, dealId);
    console.timeEnd('1. Timeline Query');

    if (timeline.length === 0) {
      return {
        summary: 'Not enough activity history yet to generate a summary.',
        painPoints: 'N/A',
        nextSteps: 'N/A',
        closeLikelihood: 'N/A',
      };
    }

    const activityLog = timeline
      .map((a) => `- (${a.type}, ${a.createdAt?.toISOString().slice(0, 10)}): ${a.body}`)
      .join('\n');

    const prompt = `You are a sales assistant analyzing a CRM deal's activity history. Based on the log below, produce a structured summary.

    Activity log:
    ${activityLog}

    Respond in exactly this format, with no extra commentary:
    PAIN POINTS: <1-2 sentences on the client's main concerns or blockers>
    NEXT STEPS: <1-2 sentences on what needs to happen next>
    CLOSE LIKELIHOOD: <one of: Low, Medium, High — plus a brief one-sentence reason>
    SUMMARY: <2-3 sentence overall summary of where this deal stands>`;

    console.time('2. Gemini Summary Generation');
    const response = await this.gemini.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: { temperature: 0.2 },
    });
    console.timeEnd('2. Gemini Summary Generation');

    const text = response.text ?? '';
    return this.parseSummary(text);
  }

  private parseSummary(text: string) {
    const extract = (label: string) => {
      const match = text.match(new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z ]+:|$)`, 's'));
      return match ? match[1].trim() : 'Not available';
    };
    return {
      painPoints: extract('PAIN POINTS'),
      nextSteps: extract('NEXT STEPS'),
      closeLikelihood: extract('CLOSE LIKELIHOOD'),
      summary: extract('SUMMARY'),
    };
  }
}
