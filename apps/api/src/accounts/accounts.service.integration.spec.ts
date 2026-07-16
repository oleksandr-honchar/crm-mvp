// apps/api/src/accounts/accounts.service.integration.spec.ts
import { AccountsService } from './accounts.service';
import { db } from '../db';
import { organizations, users, accounts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { pool } from '../db';

describe('AccountsService (integration)', () => {
  let service: AccountsService;
  let orgId: string;
  let userId: string;

  beforeAll(async () => {
    service = new AccountsService();
    const [org] = await db
      .insert(organizations)
      .values({ name: 'Test Org for Accounts' })
      .returning();
    orgId = org.id;
    const [user] = await db
      .insert(users)
      .values({
        email: 'accounts-test@test.com',
        passwordHash: 'x',
        organizationId: orgId,
        role: 'admin',
      })
      .returning();
    userId = user.id;
  });

  afterAll(async () => {
    await db.delete(accounts).where(eq(accounts.organizationId, orgId));
    await db.delete(users).where(eq(users.organizationId, orgId));
    await db.delete(organizations).where(eq(organizations.id, orgId));
  });

  it('creates and retrieves an account scoped to the org', async () => {
    const created = await service.create(orgId, userId, { name: 'Acme Corp' });
    expect(created.name).toBe('Acme Corp');

    const found = await service.findOne(orgId, created.id);
    expect(found.id).toBe(created.id);
  });

  it('does not find an account belonging to a different org', async () => {
    const created = await service.create(orgId, userId, { name: 'Other Corp' });
    await expect(
      service.findOne('00000000-0000-0000-0000-000000000000', created.id),
    ).rejects.toThrow();
  });

  afterAll(async () => {
    await db.delete(accounts).where(eq(accounts.organizationId, orgId));
    await db.delete(users).where(eq(users.organizationId, orgId));
    await db.delete(organizations).where(eq(organizations.id, orgId));
    await pool.end(); // closes the pg connection pool
  });
});
