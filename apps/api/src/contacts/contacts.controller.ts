// apps/api/src/contacts/contacts.controller.ts
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
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateContactDto) {
    return this.contactsService.create(
      req.user.organizationId,
      req.user.userId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.contactsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.contactsService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.contactsService.softDelete(req.user.organizationId, id);
  }
}
