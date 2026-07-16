// apps/api/src/accounts/accounts.service.spec.ts
import { Test } from '@nestjs/testing';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AccountsService],
    }).compile();
    service = module.get(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Note: findAll/create hit the real DB via the `db` import — for true unit
  // isolation you'd mock `../db`. For an MVP, an integration-style test
  // against your Docker Postgres (already running) is faster to write and
  // arguably more valuable right now. Example below.
});
