// apps/api/src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('funnel')
  funnel(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.pipelineFunnel(req.user.organizationId);
  }

  @Get('summary')
  summary(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.summary(req.user.organizationId);
  }
}
