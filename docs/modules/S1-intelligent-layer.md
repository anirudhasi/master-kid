# S1 — Intelligent Layer (Service Spec)

**Status:** Draft for sign-off · **Stage:** S (parallel track; **gated on M8 contract freeze**)
**The only day-one service (ADR-000 trigger #1: rhythm-driven workload).**

## 1. Responsibility
A fleet of scheduled agents that keep the platform's knowledge base current and generate
personalized insight — "hundreds of agents working at fixed rhythm." Runs outside the
monolith; touches platform data ONLY through M8's ContentContract write-side and
read-only replicas of aggregate signals. Never talks to children directly; never
publishes without human review.

## 2. Architecture
```
Scheduler (cron / Supabase pg_cron → queue)
   → Runner (worker: Azure Container App job or GitHub Actions cron at MVP)
      → Agent = (definition row) + (prompt template in git) + (tools whitelist)
         → outputs → M8 upsertDraft(source:'agent')  → human review (M10) → publish
                   → run record → agent_runs (cost, tokens, duration, outcome)
```

**Key insight: "hundreds of agents" = hundreds of *definitions*, not hundreds of
processes.** One runner executes N definitions per tick. A definition =
(scope: e.g. "CBSE Class 4 Science current-affairs refresh", rhythm: cron expr,
prompt template ref, tool whitelist, output contract, budget). Scaling agents = inserting
rows, not deploying anything.

## 3. Owned data (own schema `s1`, own Supabase project at extraction)
`agent_definitions` · `agent_runs` (append-only: status, tokens_in/out, cost_inr,
artifacts) · `agent_budgets` (per-agent + global daily caps).

## 4. Governance — the rules that make this safe and affordable
1. **Human gate is absolute at launch:** every child-visible artifact lands as M8 `draft`.
   Auto-publish is a per-agent privilege earned later via measured review-acceptance rate
   (>98% over 100 runs), and only for low-risk categories (e.g. quotes), never assessments.
2. **Budget kill-switches:** per-run token cap, per-agent daily cap, global daily spend
   cap (start: ₹500/day). Runner refuses to start a run that would breach. Cost per run
   logged in INR — you should be able to answer "what did agents cost this week?" in one
   query.
3. **Rhythms are staggered** (hash of agent id → minute offset) so 200 agents don't
   thundering-herd the LLM API at midnight.
4. **Idempotent runs:** each run keyed (agent_id, period); re-running a period upserts,
   never duplicates drafts.
5. **Model tiering:** cheap/fast model for high-volume refresh agents; premium model only
   for synthesis/insight agents. Model choice is a field on the definition — swappable
   without code.

## 5. Agent taxonomy (initial catalog)
| Family | Rhythm | Examples |
|---|---|---|
| KB freshness | daily/weekly | current-affairs per grade-band, "this day in history" |
| Content generation | weekly | quiz drafts per lesson, knowledge items, quote curation |
| Quality audit | weekly | broken links, stale content flags, difficulty calibration |
| Insight | weekly | per-child progress digests (→ parent report, consent-gated) |
| Ops | daily | discovery-demand summary (from M6 query log), content-gap reports |

## 6. Contract (inbound — what the monolith may ask of S1)
```ts
export interface IntelligenceContract {
  listAgents(): Promise<AgentDefinition[]>          // M10 admin console
  setAgentEnabled(id: string, on: boolean): Promise<void>
  triggerRun(id: string): Promise<{ runId: string }> // manual kick, admin only
  getRunHistory(id: string, n?: number): Promise<AgentRun[]>
  getSpend(period: 'day'|'week'|'month'): Promise<SpendReport>
}
```
Outbound: S1 → M8 ContentContract only (+ events `content.draft_submitted` via webhook →
bus bridge).

## 7. MVP path (don't build the cathedral first)
1. Runner as a single scheduled job (GitHub Actions cron or pg_cron+Function), 3 agent
   definitions, full draft→review→publish loop, budget caps live.
2. Grow the definition catalog; add model tiering + staggering.
3. Extract to dedicated worker infra (Container Apps) when run volume demands —
   the seam (ContentContract + s1 schema) already exists.

## 8. DoD (MVP)
- [ ] Schema + runner + 3 real agents on daily rhythm
- [ ] Drafts flowing into M10 review queue; nothing reaches children unreviewed
- [ ] Budget caps enforced + spend query working
- [ ] Admin console (M10) can enable/disable/trigger and see run history
