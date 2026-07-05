# DEV SPEC — Stage 0 + Stage 1 (Coding Brief)

**Status:** Ready for execution once module specs M13/M1/M12 are signed off.
**Scope:** Repo re-org scaffolding + Event Bus + Identity v2 + Notifications core.
**Prime directive:** every PR leaves `main` deployable. No PR mixes a file-move with a
behavior change.

Included code artifacts (this package, repo-relative paths):
```
supabase/migrations/012_identity_v2.sql      ← complete, ready to apply
supabase/migrations/013_notifications.sql    ← complete, ready to apply
apps/web/src/modules/events/contracts.ts     ← complete
apps/web/src/modules/events/bus.ts           ← complete implementation
apps/web/src/modules/identity/contracts.ts   ← types + interface (implementation in PR-6)
apps/web/api/admin/index.js + function.json  ← server-side admin auth pattern
.eslintrc.boundaries.cjs                     ← module boundary rule
```

---

## PR sequence

### PR-1 — Docs land in repo (no code)
Copy `CLAUDE.md` (replacing old) + `docs/` tree from the docs package. Delete nothing else.
**Accept:** repo builds unchanged; old CLAUDE.md content gone.

### PR-2 — Module skeletons + boundary lint (warn)
- Create `src/modules/{events,identity,parent,child,coach,school,discovery,community,
  learning-content,commerce,admin,customer-service,notifications}/` each with `index.ts`
  (empty export) and `contracts.ts` (stub or provided file).
- Add `.eslintrc.boundaries.cjs` config (provided), severity **warn**.
- Add CI workflow if absent: lint + typecheck + build on PR.
**Accept:** build green; lint reports (but doesn't fail on) cross-module imports.

### PR-3 — M13 Event Bus
- Add provided `modules/events/{contracts.ts,bus.ts}`.
- Add dev ledger panel: in dev builds, `window.__mkEvents` exposes the ring buffer.
- Unit tests: handler isolation (a throwing handler doesn't break siblings), unsubscribe,
  type narrowing, depth-2 warning.
**Accept:** tests pass; emitting `child.created` from console shows in ledger.

### PR-4 — Migration 012 (identity v2)
Apply `012_identity_v2.sql` to staging Supabase; verify existing logins unaffected
(role column semantics unchanged; new columns defaulted).
**Accept:** existing parent/coach accounts read identically; `roles[]` backfilled;
handshake + PIN tables exist with RLS.

### PR-5 — Server-side admin auth (SECURITY, launch-blocking)
- Add `api/admin/` Function (provided): verifies Supabase JWT → checks `role='admin'`
  server-side → executes whitelisted actions with service-role key → writes
  `admin_audit_log`.
- Frontend Admin page: replace `verifyAdmin()` calls with `POST /api/admin` actions.
- **Delete `src/lib/adminAuth.ts`** and all `VITE_ADMIN_*` env vars (rotate the admin
  password regardless — treat the old hash as compromised).
- Function app settings needed: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `SUPABASE_JWT_SECRET`.
**Accept:** admin page works only for an account with role=admin; direct `POST /api/admin`
with a parent JWT returns 403; every action appears in `admin_audit_log`; no admin
secret in the client bundle (verify: grep the built JS).

### PR-6 — M1 identity module assembly
- Move `services/authService.ts`, `store/authStore.ts`, Login page into
  `modules/identity/` (file moves only, then a follow-up commit implements
  `contracts.ts`: `getSession`, `can()` v1 policy map, handshake grant/redeem via RPC).
- `can()` v1: pure policy matrix from the M1 spec §3; RLS remains the real enforcement.
- Emit `account.created` (on first-session provisioning detection), `handshake.granted`,
  `handshake.redeemed` on the bus.
**Accept:** login flows unchanged for users; two call sites (Admin page gate + child-mode
entry) use `can()`; handshake round-trip integration test green.

### PR-7 — Child-mode PIN
- Parent sets 4-digit PIN (stored via Supabase RPC as bcrypt/scrypt hash in
  `child_mode_pins`); exiting child shell prompts PIN; 5 failures → 5-min lockout
  (client-enforced UX + server rate limit on the verify RPC).
**Accept:** child cannot reach parent/billing routes without PIN once set.

### PR-8 — Migration 013 + M12 notifications core
- Apply `013_notifications.sql`.
- `modules/notifications/`: contract impl, template registry (start: `welcome_child`,
  `security_admin_action`), prefs read/write.
- Bus subscription: `child.created` → in-app inbox row (+ suppression logic honoring
  prefs/quiet-hours/rate rule with `suppressed` status logged).
- Bell/in-app inbox UI reading `notification_log`.
**Accept:** creating a child produces an inbox notification; disabling the category
produces a `suppressed` log row instead.

### PR-9 — Web push (can trail launch-critical path)
VAPID keypair in Function settings; `api/notify-push/` Function sends; service-worker
subscription flow in parent settings.
**Accept:** push received on a real device for `child.created` with prefs enabled.

---

## Test matrix (Stage 1 exit)
| Area | Test |
|---|---|
| RLS | parent A cannot read parent B's children (SQL test); coach reads only enrolled |
| Admin | JWT-less / non-admin JWT → 401/403; action → audit row |
| Bus | throwing handler isolation; unsubscribe; no handler = no error |
| Handshake | expired token rejected; single-use enforced; revoke kills access |
| Notifications | pref suppression; quiet hours; rate rule (2nd engagement push same day suppressed) |

## Explicit non-goals for this stage
No UI redesign; no page moves beyond identity; no WhatsApp; no Stage-2 migrations
(014/015 ship with M2/M9 dev specs). Resist the urge — the ratchet only works if each
stage is small enough to finish.
