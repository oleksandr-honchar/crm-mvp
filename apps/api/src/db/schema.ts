// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  date,
} from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'admin' | 'manager' | 'sales_rep'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name').notNull(),
  domain: text('domain'),
  ownerId: uuid('owner_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  accountId: uuid('account_id').references(() => accounts.id),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  ownerId: uuid('owner_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name').notNull(),
});

export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  probability: numeric('probability').default('0'),
});

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  accountId: uuid('account_id').references(() => accounts.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  pipelineId: uuid('pipeline_id')
    .notNull()
    .references(() => pipelines.id),
  stageId: uuid('stage_id')
    .notNull()
    .references(() => pipelineStages.id),
  title: text('title').notNull(),
  value: numeric('value').default('0'),
  currency: text('currency').default('USD'),
  closeDate: date('close_date'),
  ownerId: uuid('owner_id').references(() => users.id),
  status: text('status').default('open'), // 'open' | 'won' | 'lost'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name'),
  email: text('email'),
  company: text('company'),
  source: text('source'),
  status: text('status').default('new'),
  ownerId: uuid('owner_id').references(() => users.id),
  convertedContactId: uuid('converted_contact_id').references(
    () => contacts.id,
  ),
  convertedDealId: uuid('converted_deal_id').references(() => deals.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// polymorphic activity log: attaches to contact, deal, account or lead
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  entityType: text('entity_type').notNull(), // 'contact' | 'deal' | 'account' | 'lead'
  entityId: uuid('entity_id').notNull(),
  type: text('type').notNull(), // 'note' | 'call' | 'email' | 'meeting' | 'task' | 'stage_change'
  body: text('body'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
