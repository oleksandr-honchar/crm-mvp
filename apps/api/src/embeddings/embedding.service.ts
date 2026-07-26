// apps/api/src/embeddings/embedding.service.ts
import { Injectable } from '@nestjs/common';
import { VoyageAIClient } from 'voyageai';

@Injectable()
export class EmbeddingService {
  private client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embed({
      input: [text],
      model: 'voyage-4-lite',
    });
    const embedding = response.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('Embedding API returned no data');
    }
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embed({
      input: texts,
      model: 'voyage-4-lite',
    });
    if (!response.data || response.data.length !== texts.length) {
      throw new Error('Embedding batch count mismatch');
    }
    return response.data.map((d) => {
      if (!d.embedding)
        throw new Error('Embedding API returned no data for one item');
      return d.embedding;
    });
  }
}
