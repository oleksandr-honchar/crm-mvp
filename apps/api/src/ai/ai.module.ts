// apps/api/src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [EmbeddingsModule, ActivitiesModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
