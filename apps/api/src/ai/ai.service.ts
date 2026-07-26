// apps/api/src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { EmbeddingService } from '../embeddings/embedding.service';
import { TimelineService } from '../activities/timeline.service';
import { db } from '../db';
import { sql } from 'drizzle-orm';

interface RetrievedActivity {
  id: string;
  body: string | null;
  type: string;
  createdAt: string | Date | null;
  distance: number;
}

interface DealSummary {
  painPoints: string;
  nextSteps: string;
  closeLikelihood: string;
  summary: string;
}

@Injectable()
export class AiService {
  private gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  constructor(
    private embeddingService: EmbeddingService,
    private timelineService: TimelineService,
  ) {}

  /**
   * Helper to safely format optional or null dates without throwing TS or runtime errors.
   */
  private formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'Unknown date';
    const parsed = new Date(date);
    return isNaN(parsed.getTime())
      ? 'Unknown date'
      : parsed.toISOString().slice(0, 10);
  }

  async chat(organizationId: string, query: string, dealId?: string) {
    const t0 = performance.now();
    const queryEmbedding = await this.embeddingService.embed(query);
    const t1 = performance.now();

    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

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
    const RELEVANCE_THRESHOLD = 0.85;
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
          `[${i + 1}] (${s.type}, ${this.formatDate(s.createdAt)}): ${s.body}`,
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
      config: { temperature: 0.2 },
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
    const timeline = await this.timelineService.forDeal(organizationId, dealId);

    if (timeline.length === 0) {
      return {
        summary: 'Not enough activity history yet to generate a summary.',
        painPoints: 'N/A',
        nextSteps: 'N/A',
        closeLikelihood: 'N/A',
      };
    }

    const activityLog = timeline
      .map((a) => `- (${a.type}, ${this.formatDate(a.createdAt)}): ${a.body}`)
      .join('\n');

    const prompt = `You are a sales assistant analyzing a CRM deal's activity history. Based on the log below, produce a structured summary.

    Activity log:
    ${activityLog}

    Respond in exactly this format, with no extra commentary:
    PAIN POINTS: <1-2 sentences on the client's main concerns or blockers>
    NEXT STEPS: <1-2 sentences on what needs to happen next>
    CLOSE LIKELIHOOD: <one of: Low, Medium, High — plus a brief one-sentence reason>
    SUMMARY: <2-3 sentence overall summary of where this deal stands>`;

    // Gemini Structured Outputs via responseSchema
    const response = await this.gemini.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            painPoints: {
              type: Type.STRING,
              description:
                "1-2 sentences on the client's main concerns or blockers",
            },
            nextSteps: {
              type: Type.STRING,
              description: '1-2 sentences on what needs to happen next',
            },
            closeLikelihood: {
              type: Type.STRING,
              description: 'One of Low, Medium, High — plus a brief reason',
            },
            summary: {
              type: Type.STRING,
              description:
                '2-3 sentence overall summary of where this deal stands',
            },
          },
          required: ['painPoints', 'nextSteps', 'closeLikelihood', 'summary'],
        },
      },
    });

    if (!response.text) {
      return {
        painPoints: 'Not available',
        nextSteps: 'Not available',
        closeLikelihood: 'Not available',
        summary: 'Failed to generate deal summary.',
      };
    }

    try {
      return JSON.parse(response.text) as DealSummary;
    } catch {
      return {
        painPoints: 'Error parsing summary',
        nextSteps: 'Error parsing summary',
        closeLikelihood: 'Error parsing summary',
        summary: response.text,
      };
    }
  }
}
