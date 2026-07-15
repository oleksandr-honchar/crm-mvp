// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  async create(
    email: string,
    password: string,
    organizationId: string,
    role: string,
  ) {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, organizationId, role })
      .returning();
    return user;
  }

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async findAllByOrg(organizationId: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organizationId, organizationId));
  }

  async updateRole(id: string, organizationId: string, role: string) {
    const [updated] = await db
      .update(users)
      .set({ role })
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .returning({ id: users.id, email: users.email, role: users.role });
    return updated;
  }
}
