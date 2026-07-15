// apps/api/src/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.usersService.findAllByOrg(req.user.organizationId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/role')
  updateRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, req.user.organizationId, body.role);
  }
}
