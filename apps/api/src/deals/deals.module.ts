import { Module, forwardRef } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { ActivitiesModule } from '@/activities/activities.module';

@Module({
  imports: [forwardRef(() => ActivitiesModule)],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
