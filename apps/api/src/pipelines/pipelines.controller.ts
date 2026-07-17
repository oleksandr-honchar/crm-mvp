// apps/api/src/pipelines/pipelines.controller.ts
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
import { PipelinesService } from './pipelines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';

@Controller('pipelines')
@UseGuards(JwtAuthGuard)
export class PipelinesController {
  constructor(private pipelinesService: PipelinesService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.pipelinesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.pipelinesService.findOneWithStages(req.user.organizationId, id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePipelineDto) {
    return this.pipelinesService.create(req.user.organizationId, dto.name);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post(':id/stages')
  addStage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.pipelinesService.addStage(req.user.organizationId, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/stages/:stageId')
  updateStage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.pipelinesService.updateStage(
      req.user.organizationId,
      id,
      stageId,
      dto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id/stages/:stageId')
  removeStage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('stageId') stageId: string,
  ) {
    return this.pipelinesService.removeStage(
      req.user.organizationId,
      id,
      stageId,
    );
  }
}
