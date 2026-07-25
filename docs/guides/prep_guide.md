# CRM System — Interview & Onboarding Prep Guide
### Building an MVP CRM from scratch — architecture, modules, schedule, and Git setup

> Context: Prep for joining Cxntury's internal CRM project (partially built already). This guide gives you the mental model + a hands-on MVP you can build in a weekend to speak fluently about CRM architecture in the interview/onboarding period.

---

## 1. What a CRM Actually Is (Architecture-Level View)

A CRM is fundamentally a **relationship graph + activity timeline + pipeline state machine**, wrapped in role-based views. Almost every CRM (Salesforce, HubSpot, Pipedrive, Close) converges on the same core entities:

```
Organization (tenant)
 └── Users (sales reps, managers, admins)
      └── Accounts / Companies
           └── Contacts (people)
                └── Deals / Opportunities (pipeline stage, value, close date)
                     └── Activities (calls, emails, meetings, notes, tasks)
      └── Leads (pre-qualification, converts into Account+Contact+Deal)
```

### Core architectural layers

| Layer | Purpose | Typical tech |
|---|---|---|
| **Data layer** | Multi-tenant relational schema, audit trail | PostgreSQL |
| **API layer** | REST/GraphQL, auth, business rules | Node.js/NestJS, Django, .NET, Go |
| **Auth & access control** | Multi-tenant isolation, RBAC, SSO | JWT/OAuth2, Row-Level Security |
| **Automation/workflow engine** | Triggers, reminders, pipeline automation | Queue (BullMQ/Sidekiq) + cron |
| **Search** | Global search across entities | Postgres full-text / Elasticsearch |
| **Notification layer** | In-app, email, Slack | WebSockets + email provider (SES/SendGrid) |
| **Reporting/analytics** | Pipeline funnel, forecast, activity metrics | Materialized views / BI layer |
| **Integrations** | Email sync, calendar, telephony | IMAP/Gmail API, Google Calendar, Twilio |
| **Frontend** | Dashboard, kanban pipeline, contact views | React/Next.js, Vue |

### Key architecture decisions you should be ready to discuss

1. **Multi-tenancy strategy** — shared schema with `organization_id` on every table (cheapest, most common for CRMs) vs. schema-per-tenant vs. DB-per-tenant. Most CRM SaaS products use **shared schema + row-level tenant isolation**.
2. **Pipeline as a state machine** — deal stages should be an ordered, configurable list per pipeline (not a hardcoded enum), because sales teams customize stages constantly.
3. **Activity timeline as an append-only log** — all interactions (calls, emails, notes, stage changes) live in one polymorphic `activities` table so you can render a unified timeline per contact/deal.
4. **Soft deletes + audit log** — CRMs are business-critical; you rarely hard-delete. Track `deleted_at` and an `audit_log` table for compliance.
5. **Custom fields** — real CRMs let admins add custom fields per entity without schema migrations (EAV table or JSONB column). Worth mentioning in the interview — it signals you understand extensibility needs.
6. **Email/calendar sync** — usually the hardest integration (OAuth, webhook/polling, deduplication, threading). Good to flag as a known complexity area.

---

## 2. MVP Module List (Prioritized)

### Must-have (MVP core)
- **Auth** — signup/login, JWT sessions, password reset
- **Organizations & Users** — multi-tenant boundary, roles (Admin, Manager, Sales Rep)
- **Contacts & Accounts (Companies)** — CRUD, contact-to-account linking
- **Leads** — capture + qualify + convert to Contact/Account/Deal
- **Deals / Pipeline** — kanban board, configurable stages, deal value, probability, close date
- **Activities** — notes, tasks, calls, meetings logged against a contact/deal
- **Dashboard** — pipeline value by stage, deals closing this month, activity feed

### Should-have (fast follow)
- Email integration (send/log emails against a contact)
- Task reminders / notifications
- Basic reporting (conversion rate, win rate, sales cycle length)
- Global search
- Custom fields

### Could-have (v2+)
- Calendar sync
- Telephony/VoIP integration
- Automation/workflow builder (if stage = X, send email)
- Role-based field-level permissions
- Marketing/email campaign module

---

## 3. Suggested MVP Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Backend | Node.js + NestJS (or Express) | Structured, testable, TS end-to-end |
| DB | PostgreSQL | Relational integrity, JSONB for custom fields, mature |
| ORM | **Drizzle** | SQL-first (no codegen step), TS-native schema, best fit for reporting/join-heavy CRM queries, small footprint |
| Auth | JWT + refresh tokens (or Supabase Auth / Auth0) | Simple to bootstrap |
| Frontend | React + Vite (or Next.js) | Fast MVP iteration |
| UI kit | Tailwind + shadcn/ui | Speed without design debt |
| State/data fetching | TanStack Query | Cache + sync with backend cleanly |
| Deployment | Docker Compose locally → Railway/Render/Fly.io | Zero-ops MVP hosting |

*(This mirrors what you already did with PulseTeamX on Supabase/Postgres — same anonymity-adjacent multi-tenant thinking applies here, just swap "team health" for "sales pipeline.")*

> **ORM decision note:** Drizzle over Prisma here because a CRM is reporting/join-heavy (pipeline funnels, polymorphic activity timelines, multi-tenant filtering on nearly every query) — Drizzle's SQL-first query builder stays predictable for that, with no codegen step and minimal cold-start overhead. Caveat: if Cxntury's existing partially-built CRM already uses Prisma, don't push for a rewrite — this choice is for your own from-scratch MVP practice, not a recommendation to migrate their live codebase.

---

## 4. Minimal DB Schema (MVP)

With Drizzle, this schema lives directly in TypeScript (`src/db/schema.ts`) instead of a separate DSL file — no generation step, and it's the source of truth for both types and migrations:

```typescript
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, numeric, integer, date, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // 'admin' | 'manager' | 'sales_rep'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  domain: text("domain"),
  ownerId: uuid("owner_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  accountId: uuid("account_id").references(() => accounts.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  ownerId: uuid("owner_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id").references(() => pipelines.id),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  probability: numeric("probability").default("0"),
});

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  accountId: uuid("account_id").references(() => accounts.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  pipelineId: uuid("pipeline_id").references(() => pipelines.id),
  stageId: uuid("stage_id").references(() => pipelineStages.id),
  title: text("title").notNull(),
  value: numeric("value").default("0"),
  currency: text("currency").default("USD"),
  closeDate: date("close_date"),
  ownerId: uuid("owner_id").references(() => users.id),
  status: text("status").default("open"), // 'open' | 'won' | 'lost'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: text("name"),
  email: text("email"),
  company: text("company"),
  source: text("source"),
  status: text("status").default("new"),
  ownerId: uuid("owner_id").references(() => users.id),
  convertedContactId: uuid("converted_contact_id").references(() => contacts.id),
  convertedDealId: uuid("converted_deal_id").references(() => deals.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// polymorphic activity log: attaches to contact, deal, account or lead
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  entityType: text("entity_type").notNull(), // 'contact' | 'deal' | 'account' | 'lead'
  entityId: uuid("entity_id").notNull(),
  type: text("type").notNull(), // 'note' | 'call' | 'email' | 'meeting' | 'task' | 'stage_change'
  body: text("body"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

A sample query showing why Drizzle is a good fit for CRM reporting (pipeline value grouped by stage — the kind of query that powers your dashboard):

```typescript
import { db } from "./db";
import { deals, pipelineStages } from "./db/schema";
import { eq, and, sum, count } from "drizzle-orm";

const pipelineFunnel = await db
  .select({
    stageName: pipelineStages.name,
    dealCount: count(deals.id),
    totalValue: sum(deals.value),
  })
  .from(deals)
  .innerJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
  .where(and(eq(deals.organizationId, orgId), eq(deals.status, "open")))
  .groupBy(pipelineStages.name);
```

Raw SQL equivalent, useful for the initial migration or if you ever need to hand-write DDL / discuss schema with a DBA:

```sql
-- organizations.sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','manager','sales_rep')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE accounts ( -- companies
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  domain TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  account_id UUID REFERENCES accounts(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL
);

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id),
  name TEXT NOT NULL,
  position INT NOT NULL,
  probability NUMERIC DEFAULT 0
);

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  pipeline_id UUID REFERENCES pipelines(id),
  stage_id UUID REFERENCES pipeline_stages(id),
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  close_date DATE,
  owner_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','won','lost')),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT,
  email TEXT,
  company TEXT,
  source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','disqualified')),
  owner_id UUID REFERENCES users(id),
  converted_contact_id UUID REFERENCES contacts(id),
  converted_deal_id UUID REFERENCES deals(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- polymorphic activity log: attaches to contact, deal, account or lead
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact','deal','account','lead')),
  entity_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note','call','email','meeting','task','stage_change')),
  body TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_deals_org_stage ON deals(organization_id, stage_id);
CREATE INDEX idx_contacts_org ON contacts(organization_id);
```

---

## 5. MVP Build Schedule (Hourly, ~40 hrs / 1 focused week)

Assumes ~6–8 hrs/day, solo build, backend+frontend generalist pace.

### Day 1 — Foundations (8h)
| Hours | Task |
|---|---|
| 0–1 | Repo init, folder structure, README, `.gitignore`, license |
| 1–2 | Docker Compose (Postgres + backend + frontend), env config |
| 2–4 | Drizzle schema (entities from Section 4), `drizzle-kit generate` + `migrate` |
| 4–6 | Auth module: signup, login, JWT, refresh token, password hash |
| 6–8 | Organization + User CRUD, role middleware (admin/manager/rep), seed script |

### Day 2 — Core entities (8h)
| Hours | Task |
|---|---|
| 8–10 | Accounts CRUD (API + tests) |
| 10–12 | Contacts CRUD, link to Accounts |
| 12–14 | Leads CRUD + conversion endpoint (lead → contact+account+deal) |
| 14–16 | Pipelines + Pipeline Stages CRUD (admin-configurable) |

### Day 3 — Deals & Activities (8h)
| Hours | Task |
|---|---|
| 16–18 | Deals CRUD, stage transitions, win/lose logic |
| 18–20 | Activities (polymorphic) CRUD — notes, tasks, calls |
| 20–22 | Timeline endpoint: aggregate activities per contact/deal |
| 22–24 | Dashboard aggregation endpoint (pipeline value by stage, open deals count) |

### Day 4 — Frontend core (8h)
| Hours | Task |
|---|---|
| 24–26 | Frontend scaffold, routing, auth screens, protected routes |
| 26–28 | Contacts & Accounts list/detail views |
| 28–30 | Kanban pipeline board (drag deals between stages) |
| 30–32 | Contact/Deal detail page with activity timeline + add-note form |

### Day 5 — Polish, dashboard, deploy (8h)
| Hours | Task |
|---|---|
| 32–33 | Leads list + convert-to-deal UI flow |
| 33–35 | Dashboard UI (pipeline funnel chart, deals closing soon) |
| 35–36 | Global search (basic ILIKE across contacts/accounts/deals) |
| 36–37 | Error handling, loading states, empty states |
| 37–38 | Seed realistic demo data |
| 38–39 | Dockerize for prod, deploy (Railway/Render), env secrets |
| 39–40 | README polish, demo script, record a Loom walkthrough |

**Stretch (if extra time):** email logging, notifications, custom fields via JSONB.

---

## 6. Git Project Initialization Steps

```bash
# 1. Create repo structure
mkdir crm-mvp && cd crm-mvp
git init
git branch -M main

# 2. Monorepo layout (simple, no tooling overhead for MVP)
mkdir -p apps/api apps/web infra docs
touch README.md .gitignore .env.example

# 3. .gitignore essentials
cat > .gitignore << 'EOF'
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
drizzle/*.db
EOF

# 4. Backend init (NestJS example)
cd apps/api
npx @nestjs/cli new . --package-manager npm --skip-git
npm install drizzle-orm pg bcrypt jsonwebtoken
npm install -D drizzle-kit @types/pg

# Drizzle config (drizzle.config.ts at apps/api root)
cat > drizzle.config.ts << 'EOF'
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
EOF

mkdir -p src/db
# put the schema.ts from Section 4 into src/db/schema.ts, then:
npx drizzle-kit generate   # generates SQL migration from schema.ts
npx drizzle-kit migrate    # applies it to the database
# npx drizzle-kit studio    # optional GUI browser, similar to Prisma Studio

# 5. Frontend init (Vite + React + TS)
cd ../web
npm create vite@latest . -- --template react-ts
npm install @tanstack/react-query axios tailwindcss

# 6. Root-level scripts (package.json at repo root, optional workspaces)
cd ../..
cat > package.json << 'EOF'
{
  "name": "crm-mvp",
  "private": true,
  "workspaces": ["apps/*"]
}
EOF

# 7. First commit
git add .
git commit -m "chore: initial monorepo scaffold (api + web)"

# 8. Branching model for the interview-project pace
git checkout -b dev
git checkout -b feature/auth
# ... work, then:
git commit -m "feat(auth): jwt login/signup with refresh tokens"
git push -u origin feature/auth
# open PR into dev -> main

# 9. Conventional commit style (recommended to adopt from day 1)
# feat: new feature
# fix: bug fix
# chore: tooling/config
# refactor: no behavior change
# docs: documentation only
# test: adding/adjusting tests

# 10. Suggested branch protection once repo is shared with a team
# - main: protected, requires PR + 1 review
# - dev: integration branch
# - feature/*: short-lived, squash-merge into dev
```

---

## 7. Talking Points for the Onboarding/Interview Context

Since Cxntury's CRM is **partially built already**, be ready to:

1. **Ask about current architecture before assuming anything**: multi-tenancy model, ORM, auth provider, whether pipelines are hardcoded or configurable, whether there's an existing custom-fields mechanism.
2. **Ask what's already decided vs. still open**: e.g., is email sync in scope? Is there a mobile app? Single org per deployment or true multi-tenant SaaS?
3. **Signal you think in migrations, not rewrites**: joining a partially-built system means proposing additive schema changes and backward-compatible API changes, not "let's redo the data model."
4. **Mention observability from day one**: logging, error tracking (Sentry), and basic metrics (deals created/day, API latency) matter more in an internal CRM than a demo, since sales teams will depend on it daily.
5. **Data integrity questions to ask**: How are duplicate contacts/accounts handled? Is there a merge tool? What happens to activities when a contact is deleted?

---

## 8. Quick Reference — CRM Domain Vocabulary

| Term | Meaning |
|---|---|
| **Lead** | Unqualified prospect, not yet linked to Account/Contact |
| **Qualification** | Process of determining if a lead is worth pursuing (BANT, MEDDIC, etc.) |
| **Opportunity/Deal** | Qualified, in-pipeline sales prospect with $ value |
| **Pipeline** | Ordered set of stages a deal moves through |
| **Win rate** | % of deals closed-won out of all closed deals |
| **Sales cycle length** | Avg. time from deal creation to close |
| **Forecast** | Projected revenue based on open deals × stage probability |
| **Churn** (for CRMs with post-sale modules) | Rate of customer loss after conversion |

---

*Good luck with the offer — given your Supabase/Postgres schema design work on PulseTeamX, this maps almost directly onto CRM data modeling, and Drizzle's SQL-first style should feel familiar coming from raw `.sql` schema/view files. The main new surface area for you will likely be the sales-pipeline state machine and email/calendar integrations.*