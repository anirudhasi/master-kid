# M12 — Notifications & Messaging (Module Spec)

**Status:** Draft for sign-off · **Stage:** 1 (last of foundations)

## 1. Responsibility
Single delivery pipeline for all outbound user communication. Modules never send
anything directly — they emit domain events (M13); M12 decides *whether/when/how/where*
to notify, respecting user preferences and quiet hours. One place for templates,
throttling, and audit.

**NOT its job:** in-app coach↔parent chat threads (`messages` table stays with M4);
customer-service conversations (M11).

## 2. Owned data (new migration `013_notifications.sql`)
- `notification_prefs` (account_id, channel, category, enabled, quiet_hours)
- `notification_log` (id, account_id, category, channel, template_key, payload, status
  sent|failed|suppressed, created_at) — doubles as the in-app inbox source.

## 3. Channels — decision
| Channel | Phase | Provider |
|---|---|---|
| In-app inbox (bell) | Launch | Own (reads notification_log) |
| Web push | Launch | PWA push (VAPID) — free |
| Email | Launch | Resend/Brevo free tier |
| WhatsApp | Post-launch, own ADR | Meta Cloud API — India's real channel, but costs per conversation + template approval; don't block launch on it |
| SMS | Never for notifications (cost); OTP only via Supabase auth | — |

## 4. Contract
```ts
export interface NotificationContract {
  notify(input: { accountId: string; category: NotificationCategory;
    templateKey: string; data: Record<string, unknown>;
    channels?: Channel[] }): Promise<void>   // resolves prefs, renders, fans out
  getInbox(accountId: string, cursor?: string): Promise<InboxPage>
  markRead(ids: string[]): Promise<void>
  setPrefs(prefs: PrefUpdate[]): Promise<void>
}
```
Categories: `transactional` (cannot be disabled: receipts, security) ·
`progress` · `engagement` · `marketing` (opt-in only, DPDP).

## 5. Architecture notes
- Subscribes to M13 events (`child.created`, `subscription.*`, `enrollment.*`,
  `milestone.progress_updated`, …) — the event catalog is the trigger list.
- Delivery via SWA Function `/api/notify` (server-side keys); browser never talks to
  email/push providers directly.
- Template registry in code (`templates.ts`), versioned in git — no CMS until volume
  justifies it.
- Rate rule: max 1 push per category per child per day except transactional (children's
  app = parents are hypersensitive to spam; this is a product-trust feature).

## 6. Extraction seam
Highest-probability second extraction after S1 (blast-radius trigger: provider outages
must not affect the app). Contract already async + fire-and-forget; extraction = move
`/api/notify` workers behind a queue.

## 7. DoD
- [ ] Migration 013; prefs UI in parent settings
- [ ] In-app inbox + web push working end-to-end off `child.created`
- [ ] Suppression honored (prefs, quiet hours, rate rule) with `suppressed` logged
