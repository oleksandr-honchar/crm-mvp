// apps/api/src/deals/deals.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@/auth/types/authenticated-request';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { TransitionStageDto } from './dto/transition-stage.dto';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateDealDto) {
    return this.dealsService.create(
      req.user.organizationId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.dealsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.dealsService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(req.user.organizationId, id, dto);
  }

  @Patch(':id/stage')
  transitionStage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: TransitionStageDto,
  ) {
    return this.dealsService.transitionStage(
      req.user.organizationId,
      req.user.userId,
      id,
      dto.stageId,
    );
  }

  @Post(':id/won')
  markWon(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.dealsService.close(
      req.user.organizationId,
      req.user.userId,
      id,
      'won',
    );
  }

  @Post(':id/lost')
  markLost(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.dealsService.close(
      req.user.organizationId,
      req.user.userId,
      id,
      'lost',
    );
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.dealsService.softDelete(req.user.organizationId, id);
  }
}
