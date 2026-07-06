# DEV SPEC — Stage 3 (M4 Coach · M8 Learning Content)

**Status:** Ready for execution after Stage 2 exit tests pass.
**Scope:** the supply side — coach machinery hardened, and the program's biggest single
engineering task: content-as-code → content-as-data.

**Spec amendments recorded (grounded in repo reality):**
- **M4-A1 (SECURITY/consistency):** `enrollments.handshake_token` (007) stores tokens
  in **plaintext** and predates M1's hashed single-use `handshake_tokens` (012). Two
  competing mechanisms. Resolution: M4 adopts M1's mechanism exclusively; 016 deprecates
  the old column (kept nullable for history, never written again). Old-style pending
  invitations are invalidated at cutover (regenerate — cheap at current scale).
- **M8-A1 (data continuity):** `knowledge_progress.item_id` and `olympiad_progress`
  reference TS string ids ('k1', 'oly-m-b1'…), not UUIDs. 016 adds
  `legacy_id text unique` to `catalog_knowledge_items` and `catalog_olympiad_sets`;
  the importer preserves original ids there; the app resolves progress via legacy_id.
  **No child loses progress.**

Included artifacts (repo-relative):
```
supabase/migrations/016_content_v2.sql
apps/web/scripts/import-content.ts            ← the importer (idempotent)
apps/web/src/modules/coach/contracts.ts
apps/web/src/modules/learning-content/contracts.ts
apps/web/api/admin/content.js                 ← publish-workflow actions (merge into admin gateway)
```

---

## PR sequence

### PR-15 — Migration 016 (content v2 + M4-A1/M8-A1 groundwork)
Apply to staging. Verify: existing catalog reads unaffected (new columns defaulted to
`published`/`manual` so current UI behavior is unchanged).
**Accept:** columns present; legacy_id unique indexes live; plaintext handshake column
marked deprecated (comment) and no code path writes it.

### PR-16 — The importer (content-as-code → DB)
- Run `apps/web/scripts/import-content.ts` (via `npx vite-node scripts/import-content.ts`
  from `apps/web/` so `@/` aliases resolve) against staging with service-role key in env.
- Imports: syllabusCatalog → catalog_lessons (subject_key, grade, ordinal from array
  index); knowledgeCatalog → catalog_knowledge_items (fields → payload, id → legacy_id);
  olympiadCatalog + olympiadExamsCatalog → catalog_olympiad_sets (questions → payload,
  id → legacy_id); academicCatalog/engagementCatalog per their shapes; blogData →
  catalog_knowledge_items type addition or stays static (decision: blog stays static
  marketing content for now — it is not child-facing KB).
- **Idempotent:** re-running upserts on legacy_id / natural key, never duplicates.
- Produce an import report (counts per table, skipped rows with reasons) — commit the
  report to `docs/reports/import-<date>.md`.
**Accept:** row counts match source counts; spot-check 10 random items field-by-field;
re-run produces zero changes.

### PR-17 — Read-path switchover + delete content-as-code
- `modules/learning-content/`: implement read side of ContentContract
  (getSyllabus/getLesson/queryItems) over the catalog tables; add a thin cache
  (in-memory per session; `content.updated` invalidates).
- Switch Syllabus, Worksheets, Olympiads, Knowledge, Daily-feed assembly to the
  contract. Progress lookups resolve via legacy_id (M8-A1).
- **Delete `src/data/*.ts`** (except blogData per PR-16 decision) once all references
  are gone. Measure and record bundle-size drop in the PR description.
**Accept:** all content pages render identically from DB (visual regression pass);
child progress intact (verify a seeded child's completed items still show completed);
bundle size reduced; boundary lint clean for `modules/learning-content`.

### PR-18 — Publishing workflow (the S1 gate)
- Merge `api/admin/content.js` actions into the admin gateway
  (`Object.assign(actions, require('./content'))`).
- Admin UI: minimal draft list (filter status=draft/review), publish/deprecate buttons.
  (The unified review queue arrives with M10 in Stage 6 — this is the interim surface.)
- Write side of ContentContract (upsertDraft/submitForReview/publish/deprecate) calls
  the admin gateway; `publish` emits `content.updated` on the bus (client-side after
  200) — feed caches invalidate.
**Accept:** draft → review → publish round-trip works; a `draft` item is invisible to
child/parent surfaces (RLS/read filters verified); publish flips visibility without
redeploy. **On merge: declare ContentContract FROZEN in docs/README status board — this
unlocks the S1 workstream.**

### PR-19 — M4 assembly + handshake reconciliation
- Move TutorPortal/Coach pages, coachService, coachStore into `modules/coach/`;
  implement CoachContract.
- Enrollment flow: parent grants via M1 `grantHandshake` (hashed, 72h, single-use) →
  coach redeems (M1 RPC) → M4 creates `enrollments` row (status active, no token stored)
  → `enrollment.handshake_completed`. Revoke path: M1 `revokeAccess` → enrollment
  `revoked` → RLS drops coach access (test it).
- Milestone updates via `ChildContract.recordMilestoneProgress` (shared-write seam from
  Stage 2) → event → parent dashboard + M12 notification.
- `coach_profiles.verification_status` (added in 016): coach submits → admin action
  `coach_set_verification` (in content.js companion) → verified badge renders.
**Accept:** full loop demo — grant → redeem → enroll → milestone → parent notified;
revoke kills access mid-session; old plaintext-token code paths deleted; boundary lint
clean for `modules/coach`.

## Test matrix (Stage 3 exit)
| Area | Test |
|---|---|
| Import | idempotency (2nd run = 0 changes); legacy progress preserved; counts reconcile |
| Content | draft invisible to non-admin; publish → visible + `content.updated`; deprecate hides |
| Handshake | plaintext path dead (grep); expired/used token rejected; revoke drops RLS access |
| Coach | unverified vs verified badge; coach sees only enrolled children's data |
| Regression | Syllabus/Worksheets/Olympiads/Knowledge visual parity pre/post switchover |

## Non-goals
No Discovery projections (Stage 4 consumes `coach.profile_updated` / `content.updated`
later); no S1 runner (unblocked by PR-18 but scheduled after Stage 4 or in parallel by
your call); no worksheet-PDF pipeline changes (it registers into catalog via the same
contract when its batch completes).
