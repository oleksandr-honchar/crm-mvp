import { Module, forwardRef } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ActivitiesModule } from '@/activities/activities.module';

@Module({
  imports: [forwardRef(() => ActivitiesModule)],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
