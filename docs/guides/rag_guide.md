# CRM + RAG Integration — 10-Day Roadmap

### Restructured plan: minimal frontend first, walking-skeleton RAG before optimization, testing throughout

> Context: Days 1–3 (backend) are complete and verified — Auth, Users/Roles, Accounts, Contacts, Leads+conversion, Pipelines/Stages, Deals+transitions, polymorphic Activities, Timeline, Dashboard aggregation. This roadmap covers Days 4–10 (frontend + RAG), replacing the original 2-day compressed plan with a realistic 10-day build that keeps testing and leverage-driven sequencing intact.

---

## Guiding principles for this phase (Edmond Lau, applied concretely)

1. **Prioritize ruthlessly.** The CTO asked whether you _know_ RAG — not whether you can ship a production-grade hybrid-search system in 48 hours. A working, explainable, well-tested walking skeleton beats a half-finished "advanced" version every time in an interview/onboarding context.
2. **Iterate fast — build the smallest working version, then layer on.** One embedded note → one similarity query → one LLM answer, proven end-to-end, before chunking strategy, hybrid search, or HNSW tuning.
3. **Avoid premature optimization.** HNSW indexing, hybrid full-text+vector search, and reranking are _scale_ solutions. Your demo dataset is ~100 rows. Sequential scan is fast enough — build it only as a stretch goal, and be ready to explain _why_ you deferred it (this is itself a good interview answer).
4. **Test the riskiest code, not just the easiest.** RAG is the newest, least-familiar part of this codebase — it gets the same integration-test discipline as Accounts/Leads/Deals did, not less.
5. **Don't build infrastructure you don't need yet.** No separate vector DB, no message queue for embedding jobs, no multi-provider LLM abstraction layer — one Postgres extension, one embedding provider, one LLM call path, until something concrete forces more.

---

## High-level 10-day structure

| Day | Focus                                             | Why this order                                                             |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| 4   | Frontend foundations (auth, routing, shell)       | Can't build an AI sidebar into a UI that doesn't exist                     |
| 5   | Core CRUD views (Contacts, Deals, Kanban)         | The "boring" UI that makes the AI features demoable in context             |
| 6   | pgvector setup + walking-skeleton ingestion       | Prove the simplest possible RAG loop works before adding sophistication    |
| 7   | RAG query endpoint (retrieval + LLM answer)       | Complete the walking skeleton end-to-end: question in, grounded answer out |
| 8   | Chunking refinement + AI Sidebar frontend         | Now that the backend loop is proven, make it demoable and improve quality  |
| 9   | Lead/Deal Summary feature + demo data + hardening | The single most "wow" feature, built once the plumbing is solid            |
| 10  | Docker, deploy, README, demo video                | Ship it — with enough time left to not rush the part people actually watch |

---

## Day 4 — Frontend Foundations (8h)

**Leverage note:** Skipping this and going straight to AI UI would mean building on nothing. This day is unglamorous but unblocks everything visual for the rest of the week.

| Hours | Task                                                                                                                                                                                                                             |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 24–25 | Frontend scaffold (Vite + React + TS), Tailwind setup, folder structure, API client (axios/TanStack Query base config pointing at `localhost:3000`)                                                                              |
| 25–26 | Auth screens: login form, signup form, token storage (React state/context — no localStorage per artifact rules if this ever becomes an artifact; a plain in-memory auth context is fine for a real app), protected route wrapper |
| 26–27 | App shell: nav sidebar, layout, logout, "who am I" header display using `/users/me`                                                                                                                                              |
| 27–28 | Contacts list view + detail view (read-only first — prove the data flows before building forms)                                                                                                                                  |
| 28–29 | Accounts list + detail view                                                                                                                                                                                                      |
| 29–30 | Contact/Account create + edit forms (reuse one form pattern for both — don't build two bespoke form systems)                                                                                                                     |
| 30–31 | Deals list view (flat table first, not kanban yet — kanban is Day 5)                                                                                                                                                             |
| 31–32 | Smoke-test full loop manually: login → view contacts → create a contact → view it → edit it. Fix whatever breaks before calling Day 4 done                                                                                       |

**Recursion/complexity flag:** None today — this is standard CRUD UI, no self-referential data structures in play.

---

## Day 5 — Core CRUD Views + Pipeline Board (8h)

| Hours | Task                                                                                                                                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 32–33 | Leads list view + "Convert" button wired to your existing `/leads/:id/convert` endpoint                                                                                           |
| 33–35 | Kanban pipeline board: columns = pipeline stages, cards = deals, drag-to-transition calls `/deals/:id/stage`                                                                      |
| 35–36 | Deal detail page: shows deal info + calls your Timeline endpoint (`/deals/:id/timeline`) to render activity history                                                               |
| 36–37 | "Add note" quick-form on the deal detail page, posting to `/activities`                                                                                                           |
| 37–38 | Dashboard page: pipeline funnel chart + won/lost summary cards, using `/dashboard/funnel` and `/dashboard/summary`                                                                |
| 38–39 | Polish pass: loading states, empty states, error toasts — cheap now, expensive to retrofit before a demo                                                                          |
| 39–40 | Full manual walkthrough + fix list. Commit and push. **This is also a natural pause point** if you want to bank a clean, demoable non-AI CRM before starting the riskier RAG work |

**Recursion/complexity flag:** The Kanban drag-and-drop is stateful UI, not recursive — no concern here.

---

## Day 6 — pgvector Setup + Walking-Skeleton Ingestion (8h)

**This is where the original plan's pacing gets fixed.** Today's only goal: prove _one_ note can be embedded, stored, and retrieved by similarity. Resist the urge to build chunking sophistication or a generic "ingestion pipeline" before this works even once.

| Hours | Task                                                                                                                                                                                                                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 40–41 | **Decision point (see below): pick an embedding provider.** Enable `pgvector` extension via a Drizzle migration                                                                                                                                                                                                               |
| 41–42 | Add a `embedding vector(N)` column to `activities` (simplest option — embed the `body` text directly on the table you already have, rather than a separate `crm_embeddings` table on day one — see leverage note below)                                                                                                       |
| 42–44 | Write **one script** (not a service, not an endpoint yet) that: takes a single activity's `body`, calls the embedding API, writes the vector back. Run it manually against your 3 existing test activities                                                                                                                    |
| 44–45 | Write **one raw SQL query** (not wrapped in Drizzle abstractions yet) that does `SELECT ... ORDER BY embedding <=> $1 LIMIT 5` against a test query vector. Confirm it returns your seeded activities in a sensible order                                                                                                     |
| 45–46 | Wrap the embedding call into a reusable `EmbeddingService` (one method: `embed(text: string): Promise<number[]>`) — only _now_ that you've proven the raw path works                                                                                                                                                          |
| 46–48 | Wrap the ingestion into `ActivitiesService.create()` (auto-embed on activity creation, fire-and-forget or awaited — decide based on latency you observe) + a backfill script for existing rows. Write an integration test: create an activity, confirm its embedding column is populated, confirm a similarity query finds it |

### Decision: embedding provider

| Option                                                                       | Pros                                        | Cons                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| OpenAI `text-embedding-3-small` (1536 dims, or 512 with dimension reduction) | Best quality, trivial API, well-documented  | Costs money per call, external dependency, needs API key management     |
| Local model via Ollama (`nomic-embed-text`, 768 dims, or similar)            | Free, no external dependency, works offline | Extra local infra to run, slower, another thing that can break mid-demo |

**Recommendation: OpenAI's smaller embedding model.** For an MVP demo with ~100 rows, embedding costs are effectively zero (a few cents total), and it removes an entire category of "is Ollama running" failure modes right before a demo. This is the same reasoning as picking Drizzle over a heavier abstraction — fewer moving parts, less that can break under time pressure. Note the dimension choice in your schema (`vector(1536)`) and don't change it later without a migration, since pgvector requires a fixed dimension per column.

### Leverage note: single table vs. separate `crm_embeddings` table

The original plan's separate `crm_embeddings` table is the _more scalable_ design (lets you embed notes, deals, contacts, leads all in one place with a polymorphic reference — literally the same `entityType`/`entityId` pattern you already used for `activities`). But building that generic table before proving embeddings work at all is solving scale problems before correctness problems. **Start by adding the vector column directly to `activities`** (your richest text source already). If Day 9 reveals you need to embed Deal titles or Contact notes too, _then_ extract the polymorphic `crm_embeddings` table — refactoring toward a generalized version once you know you need it is cheap; building it speculatively is not.

**Recursion/complexity flag:** None — embedding a single text field is a flat operation.

---

## Day 7 — RAG Query Endpoint (8h)

Complete the walking skeleton: a real question in, a grounded answer out.

| Hours | Task                                                                                                                                                                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 48–49 | `POST /ai/chat` endpoint skeleton: accepts `{ query: string, dealId?: string }`, returns a placeholder response — prove the route/DTO/guard plumbing works before adding AI logic                                                                               |
| 49–50 | Wire in retrieval: embed the incoming query, run the `<=>` similarity query scoped to `organizationId` (**critical — this is your tenant-isolation boundary again, same pattern as every other query this week**) and optionally `dealId`, return top 5 matches |
| 50–52 | Build the prompt: format retrieved activities into a context block, construct a system+user prompt, call the LLM (reuse your Anthropic API key setup pattern, or OpenAI if you're already using their embeddings — one provider is simpler than two)            |
| 52–53 | Return the LLM's answer + the source activities used (showing sources is both good UX and a good interview talking point — "grounded, not hallucinated, and I can prove it")                                                                                    |
| 53–54 | **Write the integration test now, not later:** seed a few known activities, ask a question whose answer is only findable in those activities, assert the response references the right content                                                                  |
| 54–55 | Test with curl: ask a real question about your seeded deal ("What's the status of the Prospect Co deal?") and confirm the answer is grounded in your actual activity notes, not generic LLM knowledge                                                           |
| 55–56 | Error handling: what happens with zero matching activities? Empty org? LLM API failure? Return sensible fallbacks, don't 500                                                                                                                                    |

**Recursion/complexity flag:** None in the retrieval-then-generate flow itself — it's a linear pipeline (embed → search → prompt → generate), not self-referential. The one thing to watch: **don't let the LLM's answer trigger another retrieval call automatically** (no agentic loop for this MVP) — that's a scope expansion with real recursion/runaway-cost risk (an LLM could theoretically keep calling tools indefinitely) that isn't needed for "answer questions about this deal" and would be premature complexity for a first RAG pass.

---

## Day 8 — Chunking Refinement + AI Sidebar Frontend (8h)

Now that the backend loop is proven correct, improve it and make it visible.

| Hours | Task                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 56–57 | **Chunking pass:** if any activity bodies are long (multi-paragraph call notes), split them before embedding rather than truncating. Use a simple fixed-size splitter with overlap (e.g. 500 chars, 50 overlap) — not a recursive/semantic chunker. A recursive character splitter (LangChain-style) is fine to use as a _library function_, but don't hand-roll a self-calling chunking algorithm; use a well-tested, bounded implementation |
| 57–58 | Update the ingestion path to store multiple embedding rows per long activity if chunked (revisit the single-table-vs-separate-table decision here if needed — this is the natural point where a `chunks` table might become worth it)                                                                                                                                                                                                         |
| 58–60 | AI Assistant Sidebar component: collapsible panel on the Deal detail page, chat-style input, calls `/ai/chat` with the current `dealId`                                                                                                                                                                                                                                                                                                       |
| 60–61 | Render the answer + show the source activities it drew from (small citation chips linking back to timeline entries)                                                                                                                                                                                                                                                                                                                           |
| 61–62 | Loading/error states for the sidebar — an AI feature that hangs silently with no feedback looks broken even when it isn't                                                                                                                                                                                                                                                                                                                     |
| 62–63 | Smoke test: open a deal with real notes, ask 3 different questions, confirm grounded answers each time                                                                                                                                                                                                                                                                                                                                        |
| 63–64 | **Optional stretch, time permitting:** hybrid search — add a `tsvector` column + GIN index for exact-match search (company names, exact phrases), combine with vector search via a weighted union. Only attempt this if Days 6–8 finished with time to spare; otherwise defer and note it as a documented next step                                                                                                                           |

**Recursion/complexity flag — chunking:** This is the one place recursion genuinely tempts you (recursively splitting a document into smaller and smaller pieces until each fits a size limit). If you do reach for a recursive splitter, it must have a **hard base case** (stop when text length ≤ target size) and **no possibility of the input growing between calls** — otherwise a pathological input (e.g. one giant unbroken string with no natural split points) could recurse far deeper than expected. Simplest safe answer for MVP scope: a flat loop with fixed-size windows, not recursion at all.

---

## Day 9 — Lead/Deal Summary Feature + Demo Data + Hardening (8h)

The single highest "wow factor" feature, built last because it depends on everything above working.

| Hours | Task                                                                                                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 64–65 | `POST /deals/:id/summary` endpoint: pulls the full timeline (reusing your existing `TimelineService.forDeal` — no new retrieval logic needed here, just a different prompt over the same data), asks the LLM for a structured summary: pain points, next steps, close likelihood                                    |
| 65–66 | "Generate Summary" button on the Deal detail page, renders the structured summary in a card                                                                                                                                                                                                                         |
| 66–68 | **Realistic demo data generation:** write a seed script creating 5–8 deals across different stages, each with 4–6 realistic activity notes ("Client concerned about pricing," "Asked to follow up Friday," "Interested in volume discount," etc.) — this is what makes the demo compelling, budget real time for it |
| 68–69 | Re-run all integration tests (`npm run test -w apps/api`) — confirm nothing regressed across the whole week's work, not just today's                                                                                                                                                                                |
| 69–70 | Manual full-app walkthrough as if you were the CTO seeing it cold: signup → explore contacts/deals → open a deal → read timeline → ask the AI sidebar a question → generate a summary. Fix anything that breaks the illusion                                                                                        |
| 70–71 | Edge case pass: empty org (no data), a deal with zero activities, a very long note, a question with no relevant matches — each should degrade gracefully, not error                                                                                                                                                 |
| 71–72 | Cost/latency check per the original plan's instinct: time your `/ai/chat` and `/deals/:id/summary` calls. If either is noticeably slow (>3-4s), profile whether it's the embedding call, the similarity query, or the LLM generation — optimize the actual bottleneck, not a guess                                  |

**Recursion/complexity flag:** None — summary generation is a single retrieval + single LLM call, same shape as Day 7's chat endpoint.

---

## Day 10 — Docker, Deploy, README, Demo Video (8h)

Given real time this week, this no longer needs to be rushed.

| Hours | Task                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 72–74 | Dockerize: `docker-compose.yml` covering Postgres (with pgvector extension baked into the image or installed via init script), API, frontend. Test the full stack boots from a clean `docker compose up`                                                                                               |
| 74–75 | Environment variable audit: `DATABASE_URL`, `JWT_SECRET`, embedding/LLM API keys — confirm `.env.example` is accurate and nothing is hardcoded                                                                                                                                                         |
| 75–77 | Deploy to Railway/Render (or wherever you're most comfortable) — backend + frontend + managed Postgres with pgvector support                                                                                                                                                                           |
| 77–78 | README: architecture diagram/description, setup instructions, and — importantly — **a short section explaining the RAG design decisions** (why pgvector over a dedicated vector DB, why sequential scan over HNSW at this scale, why single-provider embeddings). This doubles as interview prep notes |
| 78–79 | Record the 3-minute Loom: lead card → raw activity logs → one click → AI-generated summary. Rehearse it once before recording — a clean take beats a long unedited one                                                                                                                                 |
| 79–80 | Final review: read through your own code as if reviewing a colleague's PR. Note anything you'd want to explain proactively in an interview (tradeoffs you made under time pressure, what you'd do differently with more time)                                                                          |

---

## Interview talking points this build gives you

Beyond "yes I've used RAG," you'll be able to speak concretely about:

- **Why pgvector instead of a dedicated vector database** (operational simplicity — one system to run, back up, and secure, appropriate at this data scale)
- **Why you deferred HNSW indexing** (premature optimization at <1000 rows; you know when it becomes necessary and what the tradeoff is — build time for query time)
- **Tenant isolation in vector search** — the same `organizationId` scoping pattern used everywhere else in the CRM, applied to similarity queries too (a detail many RAG tutorials skip entirely, since most don't have multi-tenancy)
- **Grounding and citations** — your chat endpoint returns _which_ activities it drew from, not just an answer, which is a meaningfully more trustworthy design than a bare chatbot
- **What you'd do at real scale** — chunking table extraction, hybrid search, HNSW/IVFFlat indexing, reranking — as a clear "here's the next increment" story rather than something you tried and half-built

---

## What to explicitly _not_ build this week (and why)

| Skipped                                               | Reason                                                                                                                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate vector database (Pinecone, Weaviate, Qdrant) | Extra infra for no benefit at this scale; pgvector keeps one system of record                                                                                                 |
| Multi-provider LLM abstraction                        | You have one use case; build the abstraction when you have a second reason to need it                                                                                         |
| Agentic tool-calling loop for the AI sidebar          | Real recursion/cost-runaway risk for a feature that doesn't need it — retrieval-then-generate is sufficient                                                                   |
| Reranking model                                       | Adds a second model call and latency for a benefit that only shows up with large candidate sets — you won't have one                                                          |
| Streaming responses                                   | Nice UX polish, but it's additive complexity (SSE/WebSocket handling) that doesn't change whether the RAG _works_ — a good Day 11+ item if you keep building after onboarding |
