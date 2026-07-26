// apps/api/src/activities/timeline.service.ts
import { Injectable } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { DealsService } from '../deals/deals.service';

@Injectable()
export class TimelineService {
  constructor(
    private activitiesService: ActivitiesService,
    private dealsService: DealsService,
  ) {}

  /** Timeline for a single contact — direct activities only. No traversal needed. */
  async forContact(organizationId: string, contactId: string) {
    const items = await this.activitiesService.findByEntity(
      organizationId,
      'contact',
      contactId,
    );
    return this.sortByDate(items);
  }

  /**
   * Timeline for a deal — union of 3 explicit, bounded sources.
   * NOT a recursive graph walk — fetches the deal once, then runs up to 3
   * flat queries in parallel and merges. See session notes on why a
   * self-calling traversal would be wrong here (cyclic account<->contacts<->deals graph).
   */
  async forDeal(organizationId: string, dealId: string) {
    const deal = await this.dealsService.findOne(organizationId, dealId);

    const queries = [
      this.activitiesService.findByEntity(organizationId, 'deal', dealId),
    ];
    if (deal.contactId)
      queries.push(
        this.activitiesService.findByEntity(
          organizationId,
          'contact',
          deal.contactId,
        ),
      );
    if (deal.accountId)
      queries.push(
        this.activitiesService.findByEntity(
          organizationId,
          'account',
          deal.accountId,
        ),
      );

    const results = await Promise.all(queries);
    return this.sortByDate(results.flat());
  }

  private sortByDate<T extends { createdAt: Date | null }>(items: T[]): T[] {
    return [...items].sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
  }
}
