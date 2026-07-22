// apps/api/src/ai/ai.controller.ts
import { Body, Controller, Post, UseGuards, Req, Param } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  chat(@Req() req: AuthenticatedRequest, @Body() dto: ChatDto) {
    return this.aiService.chat(req.user.organizationId, dto.query, dto.dealId);
  }

  @Post('deals/:id/summary')
  summarizeDeal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.aiService.summarizeDeal(req.user.organizationId, id);
  }
}
