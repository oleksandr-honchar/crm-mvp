// apps/api/src/leads/leads.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LeadsService } from './leads.service,';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(
      req.user.organizationId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.leadsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.leadsService.findOne(req.user.organizationId, id);
  }

  @Post(':id/convert')
  convert(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.leadsService.convert(
      req.user.organizationId,
      req.user.userId,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.leadsService.remove(req.user.organizationId, id);
  }
}
