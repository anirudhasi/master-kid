# DEV SPEC — Stage 4 (M6 Discovery · M7 Community)

**Status:** Ready for execution after Stage 3 exit tests pass.
**Scope:** growth surfaces — structured supply search, and the social layer made safe.

**Grounding notes (repo reality):**
- `posts` (006) already carries `child_id` + `visibility` — good bones. But the read
  policy exposes ALL community posts unconditionally: **there is no moderation state**.
  018 adds it and tightens the policy — an unmoderated feed on a children's platform is
  a launch risk on par with the earlier security holes.
- No search infrastructure exists; 017 introduces the listings projection with
  Postgres full-text (`tsvector`) per the M6 spec — no external search engine.

Included artifacts (repo-relative):
```
supabase/migrations/017_discovery.sql
supabase/migrations/018_community_v2.sql
apps/web/src/modules/discovery/contracts.ts
apps/web/src/modules/community/contracts.ts
apps/web/api/moderate/index.js + function.json   ← synchronous content screen
```

---

## PR sequence

### PR-20 — Migration 017 + discovery projection builders
- Apply 017 (listings + query log + search function + reconcile function).
- `modules/discovery/`: projection builders subscribed to `coach.profile_updated`,
  `enrollment.handshake_completed` (activity score bump), `content.updated`.
- Nightly reconcile: call `rebuild_listings()` from a scheduled job (pg_cron if
  available on the Supabase plan; else a GitHub Actions cron hitting a small
  `/api/reconcile` action — decide by what staging supports, record in PR).
**Accept:** editing a coach profile updates its listing within one event cycle;
`rebuild_listings()` from a cold start reproduces identical rows (projection is
rebuildable by definition — diff test).

### PR-21 — Marketplace rebuilt on search
- TutorMarketplace page migrated to `modules/discovery/ui`, driven by
  `DiscoveryContract.search()` with filters (subject, grade, city, mode, price band).
- Ranking weights in `modules/discovery/ranking.ts` with a changelog comment block;
  verified coaches visibly boosted and badged.
- Every search logs an anonymized row to `discovery_queries` (no account_id — S1
  demand-signal feed later).
**Accept:** relevance sanity checks (exact subject+city match outranks partial);
filter combinations return correct sets; query log rows appear without PII.

### PR-22 — Migration 018 + moderation pipeline
- Apply 018 to staging. Existing posts backfill to `status='visible'`.
- `api/moderate` Function deployed; posting/commenting flows call it synchronously:
  `allow` → status visible · `flag` → status flagged (author sees "under review",
  others don't see it) · `block` → rejected with a kind message.
- Report flow: any user reports a post/comment → `reports` row → (interim, until M10)
  admin gateway action `community_review` to hide/remove/restore, audited.
**Accept:** blocklist term → blocked; borderline → flagged and invisible to others;
report → hide → restore round-trip audited; existing posts unaffected.

### PR-23 — Consent gate + child-safe community
- Posting with a `child_id` requires `community_visibility` consent
  (`consents_current` check in the post path — server-verified via RLS policy in 018,
  not just UI).
- Child mode: community is read-only, curated kinds only (achievements), no comment
  composer rendered, RLS unchanged (writes already impossible — child mode shares the
  parent session; this is a UX guard, and the M1 PIN protects mode exit).
**Accept:** post-with-child blocked at DB level when consent absent (test with direct
insert, not just UI); child-mode UI shows no composers.

### PR-24 — Looking-for + express interest
- `looking_for_listings` CRUD (parent seeking tutor / coach seeking students) with the
  same moderation screen; listing cards surface in Community and cross-link into
  Discovery search.
- `expressInterest`: creates an interest row, notifies the listing owner via M12 —
  **reveals nothing about the interested party until the owner accepts**, which then
  initiates the M1 handshake path (coach case) or a coach-profile share (parent case).
**Accept:** interest → notification → accept → handshake demo; the pre-accept
notification contains no identifying details of the interested account.

## Test matrix (Stage 4 exit)
| Area | Test |
|---|---|
| Projection | event-driven update; cold rebuild identical; stale listing (deleted coach) removed by reconcile |
| Search | tsvector matches Hindi/English titles; filters compose; pagination stable |
| Moderation | block/flag/allow paths; flagged invisible to others but visible to author; audit trail |
| Consent | DB-level rejection of child post without consent; consent revocation hides existing child posts (decide + test: hide vs keep — default HIDE, note in PR) |
| Interest | zero PII pre-accept; accept → handshake; decline → polite notification, no retry spam (1 interest per account per listing) |

## Non-goals
No school listings in Discovery yet (Stage 5 adds the `school` listing kind); no DMs
(deliberately — M7 spec §3.4); no engagement mechanics on posts; no Elasticsearch.
