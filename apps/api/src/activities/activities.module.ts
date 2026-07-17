import { Module, forwardRef } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { TimelineService } from './timeline.service';
import { DealsModule } from '../deals/deals.module';

@Module({
  imports: [forwardRef(() => DealsModule)],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, TimelineService],
  exports: [ActivitiesService, TimelineService],
})
export class ActivitiesModule {}
