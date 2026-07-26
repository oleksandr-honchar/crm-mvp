// apps/api/src/scripts/seed-demo-data.ts
import { VoyageAIClient } from 'voyageai';
import { db, pool } from '../db';
import {
  organizations,
  users,
  pipelines,
  pipelineStages,
  accounts,
  contacts,
  deals,
  activities,
  activityChunks,
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { chunkText } from '../embeddings/chunk-text';

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const [org] = await db.select().from(organizations).limit(1);
  if (!org)
    throw new Error(
      'No organization found — run the app and sign up a user first.',
    );

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, org.id))
    .limit(1);
  if (!owner) throw new Error('No user found in this organization.');

  const [pipeline] = await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.organizationId, org.id))
    .limit(1);
  if (!pipeline) throw new Error('No pipeline found — create one first.');

  const stages = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.pipelineId, pipeline.id));
  const stageByName = new Map(stages.map((s) => [s.name, s.id]));

  console.log(
    `Seeding into org "${org.name}" (${org.id}), pipeline "${pipeline.name}"\n`,
  );

  for (const demo of demoDeals) {
    const stageId = stageByName.get(demo.stageName);
    if (!stageId) {
      console.warn(
        `Skipping ${demo.companyName} — stage "${demo.stageName}" not found`,
      );
      continue;
    }

    console.log(`Creating ${demo.companyName}...`);

    const [account] = await db
      .insert(accounts)
      .values({
        organizationId: org.id,
        ownerId: owner.id,
        name: demo.companyName,
        domain: demo.domain,
      })
      .returning();

    const [contact] = await db
      .insert(contacts)
      .values({
        organizationId: org.id,
        ownerId: owner.id,
        accountId: account.id,
        firstName: demo.contactFirstName,
        lastName: demo.contactLastName,
        email: demo.contactEmail,
      })
      .returning();

    const [deal] = await db
      .insert(deals)
      .values({
        organizationId: org.id,
        ownerId: owner.id,
        accountId: account.id,
        contactId: contact.id,
        pipelineId: pipeline.id,
        stageId,
        title: demo.dealTitle,
        value: demo.value.toString(),
        status: demo.status,
      })
      .returning();

    // 1. Create all activity rows first (no embeddings yet), tracking each
    //    note's chunk texts alongside its activityId.
    const chunkJobs: {
      activityId: string;
      chunkIndex: number;
      body: string;
    }[] = [];
    for (const noteBody of demo.notes) {
      const [activity] = await db
        .insert(activities)
        .values({
          organizationId: org.id,
          entityType: 'deal',
          entityId: deal.id,
          type: 'note',
          body: noteBody,
          createdBy: owner.id,
        })
        .returning();
      const chunks = chunkText(noteBody);
      chunks.forEach((chunkBody, i) =>
        chunkJobs.push({
          activityId: activity.id,
          chunkIndex: i,
          body: chunkBody,
        }),
      );
    }

    // 2. One batched Voyage call for this deal's entire note set.
    const response = await voyage.embed({
      input: chunkJobs.map((c) => c.body),
      model: 'voyage-4-lite',
    });
    if (!response.data || response.data.length !== chunkJobs.length) {
      throw new Error(`Embedding count mismatch for ${demo.companyName}`);
    }

    // 3. Insert chunk rows using the batch response, matched by index.
    for (let i = 0; i < chunkJobs.length; i++) {
      const embedding = response.data[i].embedding;
      if (!embedding)
        throw new Error(`No embedding at index ${i} for ${demo.companyName}`);
      await db.insert(activityChunks).values({
        activityId: chunkJobs[i].activityId,
        organizationId: org.id,
        entityType: 'deal',
        entityId: deal.id,
        chunkIndex: chunkJobs[i].chunkIndex,
        body: chunkJobs[i].body,
        embedding,
      });
    }

    console.log(
      `  -> ${demo.notes.length} notes, ${chunkJobs.length} chunk(s) embedded in 1 API call`,
    );

    // 4. Respect the 3 RPM limit — wait ~21s between deals (skip after the last one).
    if (demo !== demoDeals[demoDeals.length - 1]) {
      console.log('  waiting 21s to respect rate limit...');
      await sleep(21000);
    }
  }

  console.log('\nSeed complete.');
  await pool.end();
}

interface DemoDeal {
  companyName: string;
  domain: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  dealTitle: string;
  value: number;
  stageName: 'New' | 'Qualified';
  status: 'open' | 'won' | 'lost';
  notes: string[];
}

const demoDeals: DemoDeal[] = [
  {
    companyName: 'Nordwind Logistics',
    domain: 'nordwind-logistics.com',
    contactFirstName: 'Erik',
    contactLastName: 'Larsson',
    contactEmail: 'erik.larsson@nordwind-logistics.com',
    dealTitle: 'Nordwind Logistics - Fleet Tracking Deal',
    value: 12000,
    stageName: 'Qualified',
    status: 'open',
    notes: [
      'Initial discovery call. Erik manages a fleet of 40 delivery vehicles across the Nordic region. Current pain point is lack of real-time GPS tracking - they rely on manual driver check-ins by phone.',
      'Client expressed concern about the $12,000 annual price point being higher than a competitor they are evaluating (RouteSense). Asked for a breakdown of what is included.',
      'Sent pricing breakdown showing our platform includes unlimited users, unlike RouteSense which charges per seat. Erik seemed satisfied with this comparison.',
      'Scheduled a technical demo with their IT director for next week to review API integration with their existing dispatch software.',
    ],
  },
  {
    companyName: 'Bramble & Co',
    domain: 'brambleco.com',
    contactFirstName: 'Priya',
    contactLastName: 'Nair',
    contactEmail: 'priya.nair@brambleco.com',
    dealTitle: 'Bramble & Co - Retail Analytics Suite',
    value: 8500,
    stageName: 'New',
    status: 'open',
    notes: [
      'Inbound lead from website contact form. Priya is Head of Operations for a 12-store specialty retail chain, looking for foot-traffic and sales correlation analytics.',
      'First call revealed they are currently using spreadsheets to manually correlate marketing spend with in-store sales - very time consuming, taking her team roughly 15 hours per week.',
      'Priya mentioned budget has not been formally approved yet - she needs to present a business case to her CFO next month.',
    ],
  },
  {
    companyName: 'Vantage Point Consulting',
    domain: 'vantagepointconsulting.io',
    contactFirstName: 'Marcus',
    contactLastName: 'Webb',
    contactEmail: 'marcus.webb@vantagepointconsulting.io',
    dealTitle: 'Vantage Point - Client Reporting Platform',
    value: 22000,
    stageName: 'Qualified',
    status: 'won',
    notes: [
      'Marcus runs a 25-person consulting firm and needs a white-labeled client reporting dashboard to replace their current manual PowerPoint reports.',
      'Demo went extremely well - the team was particularly impressed by the automated data refresh feature, which would save them an estimated 20 hours per month.',
      'Negotiated final price down from $25,000 to $22,000 in exchange for a 2-year contract commitment and a case study reference.',
      'Contract signed. Marcus confirmed onboarding should start within 2 weeks - his team is eager to get off their current manual process before Q4 client reviews.',
    ],
  },
  {
    companyName: 'Ferro Manufacturing',
    domain: 'ferromfg.com',
    contactFirstName: 'Diane',
    contactLastName: 'Castellano',
    contactEmail: 'diane.castellano@ferromfg.com',
    dealTitle: 'Ferro Manufacturing - Inventory Forecasting',
    value: 15000,
    stageName: 'New',
    status: 'lost',
    notes: [
      'Diane oversees procurement for a mid-size metal parts manufacturer, interested in demand forecasting to reduce excess raw material inventory.',
      'Demo call was positive, but Diane flagged that their ERP system (SAP) integration was not on our current roadmap - this is a hard requirement for them.',
      'Followed up to see if a manual CSV import workaround would suffice in the interim. Diane confirmed leadership decided to go with a competitor that has native SAP support.',
      'Marked as lost - the missing SAP integration was the deciding factor, not price or product fit. Worth revisiting if SAP integration ships.',
    ],
  },
  {
    companyName: 'Solstice Wellness Group',
    domain: 'solsticewellness.com',
    contactFirstName: 'Amara',
    contactLastName: 'Okafor',
    contactEmail: 'amara.okafor@solsticewellness.com',
    dealTitle: 'Solstice Wellness - Member Management System',
    value: 6000,
    stageName: 'Qualified',
    status: 'open',
    notes: [
      'Amara runs a chain of 5 wellness studios (yoga, pilates) and needs a unified member management and class booking system.',
      'Current system is a patchwork of Mindbody for bookings and a separate spreadsheet for membership billing - causing frequent double-booking errors.',
      "Budget confirmed at $6,000/year. Amara is comparing us against Mindbody's all-in-one tier, which is slightly cheaper but lacks our reporting depth.",
      'Requested three studio manager accounts and a mobile app preview before making a final decision. Demo scheduled for Thursday.',
    ],
  },
  {
    companyName: 'Ironclad Legal Partners',
    domain: 'ironcladlegal.com',
    contactFirstName: 'Robert',
    contactLastName: 'Chen',
    contactEmail: 'robert.chen@ironcladlegal.com',
    dealTitle: 'Ironclad Legal - Document Automation',
    value: 18000,
    stageName: 'New',
    status: 'open',
    notes: [
      'Robert is a partner at a mid-size law firm looking to automate routine contract generation for their corporate law practice.',
      'Firm currently spends an estimated 8 hours per associate per week manually drafting boilerplate contracts from templates.',
      'Robert asked pointed questions about data security and SOC 2 compliance, given the sensitivity of legal documents. Sent our compliance documentation.',
    ],
  },
  {
    companyName: 'Coastal Brew Collective',
    domain: 'coastalbrewcollective.com',
    contactFirstName: 'Lena',
    contactLastName: 'Fitzgerald',
    contactEmail: 'lena.fitzgerald@coastalbrewcollective.com',
    dealTitle: 'Coastal Brew Collective - POS Integration',
    value: 4500,
    stageName: 'Qualified',
    status: 'won',
    notes: [
      'Lena owns a growing chain of 3 coffee shops, wants POS data synced with our platform for unified sales reporting across locations.',
      'Quick sales cycle - Lena had already researched competitors and came in ready to buy, mainly comparing our onboarding speed.',
      'Closed within 2 weeks of first contact. Lena specifically valued that setup would take under a day per location with no POS hardware changes needed.',
    ],
  },
  {
    companyName: 'Meridian Health Partners',
    domain: 'meridianhealthpartners.org',
    contactFirstName: 'Dr. Sarah',
    contactLastName: 'Kim',
    contactEmail: 's.kim@meridianhealthpartners.org',
    dealTitle: 'Meridian Health - Patient Scheduling Overhaul',
    value: 30000,
    stageName: 'New',
    status: 'lost',
    notes: [
      'Dr. Kim represents a multi-location clinic group evaluating a replacement for their aging patient scheduling software.',
      'Strong initial interest - current no-show rate is 18% and they believe automated reminders could meaningfully reduce it.',
      'Procurement process stalled internally. After 6 weeks of no response, Dr. Kim confirmed the clinic group put all software purchases on hold due to a budget freeze this fiscal year.',
      'Marked as lost due to internal budget freeze, not a competitive loss. Good candidate to re-engage next fiscal year.',
    ],
  },
];

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
