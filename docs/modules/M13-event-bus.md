# M13 — Event Bus (Module Spec)

**Status:** Draft for sign-off · **Stage:** 1 (build first) · **Owner:** platform
**Why first:** without this, modules couple directly and every seam from ADR-000 dies on
day one. It is ~150 lines of code with outsized architectural leverage.

---

## 1. Responsibility

A **typed, in-process publish/subscribe bus** through which all cross-module side-effects
flow. Module A never calls Module B to say "something happened" — A emits an event; B
subscribes. The bus is deliberately swappable for a real broker (Azure Service Bus / SQS)
at extraction time: only the transport changes, never the event contracts.

**Explicitly NOT its job:** request/response queries (use the target module's contract
function directly), UI state, long-running jobs (that's S1's scheduler, later).

## 2. Event contract standard

Every event is a versioned, immutable fact, named `<domain>.<past-tense-verb>`:

```ts
// modules/events/contracts.ts
export interface DomainEvent<T extends string, P> {
  type: T                    // e.g. 'child.created'
  version: 1                 // bump on breaking payload change; old handlers keep working
  occurredAt: string         // ISO timestamp
  actorId: string | null     // account that caused it (null = system/agent)
  payload: P
}
```

Initial event catalog (grows via PRs to this file — the catalog is the integration map):

| Event | Emitted by | Consumed by (initially) |
|---|---|---|
| `account.created` | M1 | M12 (welcome), M10 (audit) |
| `account.role_changed` | M1 | M10 (audit) |
| `child.created` | M2 | M9 (start trial subscription), M3 (init daily feed), M12 |
| `child.selected` | M3 shell | any module needing re-scope |
| `subscription.activated` / `.expired` | M9 | M2, M3 (gating), M12 |
| `enrollment.handshake_completed` | M4 | M2 (parent visibility), M12 |
| `milestone.progress_updated` | M4 | M3, M12 |
| `storyboard.entry_added` | M8 | M7 (shareable), M12 |
| `content.updated` | M8 / S1 | M3 (feed refresh), cache invalidation |
| `admin.action_performed` | M10 | audit log |

## 3. Interface (this is also the future broker adapter)

```ts
export interface EventBus {
  emit<E extends AnyDomainEvent>(event: E): void
  on<T extends AnyDomainEvent['type']>(
    type: T, handler: (e: Extract<AnyDomainEvent, {type: T}>) => void | Promise<void>
  ): () => void   // returns unsubscribe
}
```

## 4. Implementation rules (MVP, in-process)

1. **Fire-and-forget with isolation.** A throwing handler must never break the emitter or
   sibling handlers — wrap each handler in try/catch; failures go to the error reporter.
2. **Async by default.** Handlers run on microtask (`queueMicrotask`) so emitting never
   blocks the user interaction that caused it.
3. **Dev-mode ledger.** In dev, every event is pushed to a ring buffer visible in a debug
   panel — this becomes your best debugging tool during the re-org.
4. **No event chains deeper than 2.** A handler may emit at most one follow-up event;
   deeper cascades indicate a workflow, which belongs in S1 later. Enforced by convention +
   dev-mode depth warning.
5. **Persistence-critical effects don't rely on the bus alone** (it's in-memory; a page
   refresh drops queued microtasks). Anything that MUST happen (e.g. trial subscription on
   child creation) is done transactionally by the owning module; the event is notification,
   not the mechanism of record. This rule is what makes broker-swap safe later.

## 5. Extraction seam

At extraction (per ADR-000 triggers): implement `EventBus` over a real broker; monolith
emits to both in-process and broker during transition; extracted service subscribes broker-
side. Event contracts in `contracts.ts` are already the wire format (JSON-serializable by
construction — enforce: payloads contain only plain data, never class instances/functions).

## 6. Definition of done

- [ ] `modules/events/` with contracts.ts, bus.ts, dev ledger
- [ ] Unit tests: isolation (throwing handler), unsubscribe, type narrowing
- [ ] First real wiring: `child.created` → M9 trial + M12 stub (proves the pattern)
